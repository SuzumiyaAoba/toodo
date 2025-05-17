import { Task } from "../../../domain/models/Task";
import type { Task as TaskType } from "../../../domain/models/Task";
import type { TaskRepository } from "../../../domain/repositories/TaskRepository";

type ReorderTasksParams = {
  readonly parentId: string | null;
  readonly orderMap: Readonly<Record<string, number>>;
};

export class ReorderTasksUseCase {
  constructor(private readonly taskRepository: TaskRepository) {}

  async execute(params: ReorderTasksParams): Promise<readonly TaskType[]> {
    const { parentId, orderMap } = params;

    // Get tasks for the parent (or root tasks if parentId is null)
    const tasks = parentId
      ? await this.taskRepository.findByParentId(parentId)
      : await this.taskRepository.findRootTasks();

    // 防御的チェック - イミュータブルな方法で
    this.validateOrderMap(tasks, orderMap);

    // Update order for each task based on orderMap - イミュータブルな処理
    // フィルタリングと処理を一度で行い、型安全性を確保
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

    // Sort tasks by order - イミュータブルな方法で
    const sortedTasks = [...tasksToUpdate].sort((a, b) => a.order - b.order);

    // Save updated tasks with new order
    return this.taskRepository.updateOrder(sortedTasks);
  }

  // 検証ロジックを別のメソッドに分割して純粋関数的アプローチを適用
  private validateOrderMap(tasks: readonly TaskType[], orderMap: Readonly<Record<string, number>>): void {
    const siblingIds = new Set(tasks.map((t) => t.id));
    const unknownIds = Object.keys(orderMap).filter((id) => !siblingIds.has(id));

    if (unknownIds.length) {
      throw new Error(
        `orderMap contains tasks that are not siblings of the specified parent: ${unknownIds.join(", ")}`,
      );
    }

    const orders = Object.values(orderMap);
    const seenOrders = new Set<number>();
    const duplicateOrders = orders.filter((order) => {
      if (seenOrders.has(order)) {
        return true;
      }
      seenOrders.add(order);
      return false;
    });

    if (duplicateOrders.length) {
      throw new Error(`orderMap contains duplicate order values: ${duplicateOrders.join(", ")}`);
    }
  }
}
