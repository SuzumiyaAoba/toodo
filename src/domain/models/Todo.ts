import { v4 as uuidv4 } from "uuid";
import { Subtask } from "./Subtask";

export type TodoStatus = "completed" | "incomplete";

export class Todo {
  id: string;
  content: string;
  completed: boolean;
  createdAt: Date;
  updatedAt: Date;
  subtasks: Subtask[];

  constructor(
    content: string,
    id?: string,
    completed?: boolean,
    createdAt?: Date,
    updatedAt?: Date,
    subtasks: Subtask[] = [],
  ) {
    this.id = id || uuidv4();
    this.content = content;
    this.completed = completed ?? false;
    this.createdAt = createdAt || new Date();
    this.updatedAt = updatedAt || new Date();
    this.subtasks = subtasks;
  }

  addSubtask(title: string, description?: string | null): Subtask {
    const order = this.subtasks.length > 0 ? Math.max(...this.subtasks.map((subtask) => subtask.order)) + 1 : 1;

    const subtask = new Subtask(this.id, title, order, description);
    this.subtasks.push(subtask);
    this.updateCompletionStatus();
    return subtask;
  }

  updateContent(content: string): void {
    this.content = content;
    this.updatedAt = new Date();
  }

  updateCompletionStatus(): void {
    this.completed =
      this.subtasks.length > 0 ? this.subtasks.every((subtask) => subtask.status === "completed") : false;
    this.updatedAt = new Date();
  }

  markAsCompleted(): void {
    this.completed = true;
    this.updatedAt = new Date();
  }

  markAsIncomplete(): void {
    this.completed = false;
    this.updatedAt = new Date();
  }

  reorderSubtasks(orderMap: Record<string, number>): void {
    for (const subtask of this.subtasks) {
      if (orderMap[subtask.id] !== undefined) {
        subtask.updateOrder(orderMap[subtask.id]);
      }
    }

    this.subtasks.sort((a, b) => a.order - b.order);
    this.updatedAt = new Date();
  }
}
