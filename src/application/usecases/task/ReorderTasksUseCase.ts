import { Task } from "../../../domain/models/Task";
import type { Task as TaskType } from "../../../domain/models/Task";
import type { TaskRepository } from "../../../domain/repositories/TaskRepository";

type ReorderTasksParams = {
  parentId: string | null;
  orderMap: Record<string, number>;
};

export class ReorderTasksUseCase {
  constructor(private taskRepository: TaskRepository) {}

  async execute(params: ReorderTasksParams): Promise<TaskType[]> {
    const { parentId, orderMap } = params;

    // Get tasks for the parent (or root tasks if parentId is null)
    const tasks = parentId
      ? await this.taskRepository.findByParentId(parentId)
      : await this.taskRepository.findRootTasks();

    // Update order for each task based on orderMap
    const tasksToUpdate: TaskType[] = [];

    // defensive checks
    const siblingIds = new Set(tasks.map((t) => t.id));
    const unknownIds = Object.keys(orderMap).filter((id) => !siblingIds.has(id));
    if (unknownIds.length) {
      throw new Error(
        `orderMap contains tasks that are not siblings of the specified parent: ${unknownIds.join(", ")}`,
      );
    }
    const orders = Object.values(orderMap);
    const duplicateOrders = orders.filter((o, i) => orders.indexOf(o) !== i);
    if (duplicateOrders.length) {
      throw new Error(`orderMap contains duplicate order values: ${duplicateOrders.join(", ")}`);
    }

    for (const task of tasks) {
      const newOrder = orderMap[task.id];
      if (newOrder !== undefined) {
        tasksToUpdate.push(Task.updateOrder(task, newOrder));
      }
    }

    // Sort tasks by order
    tasksToUpdate.sort((a, b) => a.order - b.order);

    // Save updated tasks with new order
    if (tasksToUpdate.length > 0) {
      return this.taskRepository.updateOrder(tasksToUpdate);
    }

    return tasks;
  }
}
