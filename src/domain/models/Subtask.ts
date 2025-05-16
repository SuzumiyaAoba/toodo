import { v4 as uuidv4 } from "uuid";

export type SubtaskStatus = "completed" | "incomplete";

export class Subtask {
  id: string;
  todoId: string;
  title: string;
  description: string | null;
  status: SubtaskStatus;
  order: number;
  createdAt: Date;
  updatedAt: Date;

  constructor(
    todoId: string,
    title: string,
    order: number,
    description: string | null = null,
    id?: string,
    status: SubtaskStatus = "incomplete",
    createdAt?: Date,
    updatedAt?: Date,
  ) {
    this.id = id || uuidv4();
    this.todoId = todoId;
    this.title = title;
    this.description = description;
    this.status = status;
    this.order = order;
    this.createdAt = createdAt || new Date();
    this.updatedAt = updatedAt || new Date();
  }

  updateTitle(title: string): void {
    this.title = title;
    this.updatedAt = new Date();
  }

  updateDescription(description: string | null): void {
    this.description = description;
    this.updatedAt = new Date();
  }

  updateStatus(status: SubtaskStatus): void {
    this.status = status;
    this.updatedAt = new Date();
  }

  updateOrder(order: number): void {
    this.order = order;
    this.updatedAt = new Date();
  }

  markAsCompleted(): void {
    this.status = "completed";
    this.updatedAt = new Date();
  }

  markAsIncomplete(): void {
    this.status = "incomplete";
    this.updatedAt = new Date();
  }
}
