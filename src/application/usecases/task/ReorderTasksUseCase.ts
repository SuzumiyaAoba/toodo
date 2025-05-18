import { inject, injectable, singleton } from "tsyringe";
import { Task } from "../../../domain/models/Task";
import type { Task as TaskType } from "../../../domain/models/Task";
import type { TaskRepository } from "../../../domain/repositories/TaskRepository";

type ReorderTasksParams = {
  readonly parentId: string | null;
  readonly orderMap: Readonly<Partial<Record<string, number>>>;
};

@injectable()
@singleton()
export class ReorderTasksUseCase {
  constructor(@inject("TaskRepository") private readonly taskRepository: TaskRepository) {}

  async execute(params: ReorderTasksParams): Promise<readonly TaskType[]> {
    const { parentId, orderMap } = params;

    // Get tasks for the parent (or root tasks if parentId is null)
    const tasks = parentId
      ? await this.taskRepository.findByParentId(parentId)
      : await this.taskRepository.findRootTasks();

    // Defensive validation in an immutable way
    this.validateOrderMap(tasks, orderMap);

    // Update order for each task based on orderMap - immutable processing
    // Filtering and processing in a single pass, ensuring type safety
    const tasksWithOrderValues = tasks
      .map((task) => {
        const newOrder = orderMap[task.id];
        return { task, newOrder };
      })
      .filter((item): item is { task: TaskType; newOrder: number } => item.newOrder !== undefined);

    const tasksToUpdate = tasksWithOrderValues.map((item) => Task.updateOrder(item.task, item.newOrder));

    if (tasksToUpdate.length === 0) {
      return tasks;
    }

    // Sort tasks by order in an immutable way
    const sortedTasks = [...tasksToUpdate].sort((a, b) => a.order - b.order);

    // Persist changes
    const updated = await this.taskRepository.updateOrder(sortedTasks);

    // Merge unchanged siblings and return deterministically sorted list
    const untouched = tasks.filter((t) => !(t.id in orderMap));
    return [...updated, ...untouched].sort((a, b) => a.order - b.order);
  }

  // Split validation logic into a separate method using a pure functional approach
  private validateOrderMap(tasks: readonly TaskType[], orderMap: Readonly<Partial<Record<string, number>>>): void {
    const siblingIds = new Set(tasks.map((t) => t.id));
    const unknownIds = Object.keys(orderMap).filter((id) => !siblingIds.has(id));

    if (unknownIds.length) {
      throw new Error(
        `orderMap contains tasks that are not siblings of the specified parent: ${unknownIds.join(", ")}`,
      );
    }

    // Filter out undefined values
    const orders = Object.values(orderMap).filter((order): order is number => order !== undefined);
    const existingOrders = tasks.filter((t) => !(t.id in orderMap)).map((t) => t.order);
    const allOrders = [...orders, ...existingOrders];

    const seenOrders = new Set<number>();
    const duplicateOrders = allOrders.filter((order) => {
      if (seenOrders.has(order)) {
        return true;
      }
      seenOrders.add(order);
      return false;
    });

    if (duplicateOrders.length) {
      throw new Error(`orderMap contains duplicate order values: ${duplicateOrders.join(", ")}`);
    }

    // Check for continuous sequence (ensures order values are sequential integers starting from 0 or 1)
    const sortedAllOrders = [...allOrders].sort((a, b) => a - b);
    const startValue = sortedAllOrders[0];

    // Only allow start values of 0 or 1
    if (startValue !== 0 && startValue !== 1) {
      throw new Error(`Order values must start with 0 or 1, found: ${startValue}`);
    }

    // Check for continuous sequence
    for (let i = 0; i < sortedAllOrders.length; i++) {
      const expectedValue = startValue + i;
      if (sortedAllOrders[i] !== expectedValue) {
        throw new Error(
          `Order values must form a continuous sequence starting at ${startValue}; missing ${expectedValue}`,
        );
      }
    }
  }
}
