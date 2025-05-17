import { v4 as uuidv4 } from "uuid";

export type SubtaskStatus = "completed" | "incomplete";

export class Subtask {
  readonly id: string;
  readonly todoId: string;
  readonly title: string;
  readonly description: string | null;
  readonly status: SubtaskStatus;
  readonly order: number;
  readonly createdAt: Date;
  readonly updatedAt: Date;

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

  updateTitle(title: string): Subtask {
    return new Subtask(
      this.todoId,
      title,
      this.order,
      this.description,
      this.id,
      this.status,
      this.createdAt,
      new Date(),
    );
  }

  updateDescription(description: string | null): Subtask {
    return new Subtask(
      this.todoId,
      this.title,
      this.order,
      description,
      this.id,
      this.status,
      this.createdAt,
      new Date(),
    );
  }

  updateStatus(status: SubtaskStatus): Subtask {
    return new Subtask(
      this.todoId,
      this.title,
      this.order,
      this.description,
      this.id,
      status,
      this.createdAt,
      new Date(),
    );
  }

  updateOrder(order: number): Subtask {
    return new Subtask(
      this.todoId,
      this.title,
      order,
      this.description,
      this.id,
      this.status,
      this.createdAt,
      new Date(),
    );
  }

  markAsCompleted(): Subtask {
    return new Subtask(
      this.todoId,
      this.title,
      this.order,
      this.description,
      this.id,
      "completed",
      this.createdAt,
      new Date(),
    );
  }

  markAsIncomplete(): Subtask {
    return new Subtask(
      this.todoId,
      this.title,
      this.order,
      this.description,
      this.id,
      "incomplete",
      this.createdAt,
      new Date(),
    );
  }
}
