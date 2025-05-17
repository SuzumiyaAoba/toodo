import { v4 as uuidv4 } from "uuid";

export type TaskStatus = "completed" | "incomplete";

export class Task {
  id: string;
  parentId: string | null;
  title: string;
  description: string | null;
  status: TaskStatus;
  order: number;
  createdAt: Date;
  updatedAt: Date;
  subtasks: Task[];

  constructor(
    title: string,
    parentId: string | null = null,
    description: string | null = null,
    id?: string,
    status: TaskStatus = "incomplete",
    order = 1,
    createdAt?: Date,
    updatedAt?: Date,
    subtasks: Task[] = [],
  ) {
    this.id = id || uuidv4();
    this.parentId = parentId;
    this.title = title;
    this.description = description;
    this.status = status;
    this.order = order;
    this.createdAt = createdAt || new Date();
    this.updatedAt = updatedAt || new Date();
    this.subtasks = subtasks;
  }

  addSubtask(title: string, description?: string | null): Task {
    const order = this.subtasks.length > 0 ? Math.max(...this.subtasks.map((subtask) => subtask.order)) + 1 : 1;

    const subtask = new Task(title, this.id, description || null, undefined, "incomplete", order);

    this.subtasks.push(subtask);
    this.updateStatus();
    return subtask;
  }

  updateTitle(title: string): void {
    this.title = title;
    this.updatedAt = new Date();
  }

  updateDescription(description: string | null): void {
    this.description = description;
    this.updatedAt = new Date();
  }

  updateStatus(): void {
    if (this.subtasks.length > 0) {
      this.status = this.subtasks.every((subtask) => subtask.status === "completed") ? "completed" : "incomplete";
    }
    this.updatedAt = new Date();

    // Propagate status update to parent task if exists
    // Note: This would require parent reference or repository in actual implementation
  }

  updateOrder(order: number): void {
    this.order = order;
    this.updatedAt = new Date();
  }

  markAsCompleted(): void {
    this.status = "completed";

    // Mark all subtasks as completed as well
    for (const subtask of this.subtasks) {
      subtask.markAsCompleted();
    }

    this.updatedAt = new Date();
  }

  markAsIncomplete(): void {
    this.status = "incomplete";
    this.updatedAt = new Date();
  }

  reorderSubtasks(orderMap: Record<string, number>): void {
    for (const subtask of this.subtasks) {
      const orderValue = orderMap[subtask.id];
      if (orderValue !== undefined) {
        subtask.updateOrder(orderValue);
      }
    }

    this.subtasks.sort((a, b) => a.order - b.order);
    this.updatedAt = new Date();
  }

  // Methods to support hierarchical task structure
  getTaskHierarchy(): Task[] {
    // Returns this task and all subtasks in a flattened array
    const result: Task[] = [this];

    for (const subtask of this.subtasks) {
      result.push(...subtask.getTaskHierarchy());
    }

    return result;
  }

  findTaskById(id: string): Task | null {
    if (this.id === id) {
      return this;
    }

    for (const subtask of this.subtasks) {
      const found = subtask.findTaskById(id);
      if (found) {
        return found;
      }
    }

    return null;
  }

  getDepth(): number {
    return this.parentId === null ? 0 : 1 + Math.max(...this.subtasks.map((task) => task.getDepth()), 0);
  }
}
