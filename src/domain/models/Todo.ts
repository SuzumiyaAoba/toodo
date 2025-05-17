import { v4 as uuidv4 } from "uuid";
import { Subtask } from "./Subtask";

export type TodoStatus = "completed" | "incomplete";

export class Todo {
  readonly id: string;
  readonly content: string;
  readonly completed: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly subtasks: readonly Subtask[];

  constructor(
    content: string,
    id?: string,
    completed?: boolean,
    createdAt?: Date,
    updatedAt?: Date,
    subtasks: readonly Subtask[] = [],
  ) {
    this.id = id || uuidv4();
    this.content = content;
    this.completed = completed ?? false;
    this.createdAt = createdAt || new Date();
    this.updatedAt = updatedAt || new Date();
    this.subtasks = [...subtasks]; // Create a copy to ensure immutability
  }

  addSubtask(title: string, description?: string | null): Todo {
    const order = this.subtasks.length > 0 ? Math.max(...this.subtasks.map((subtask) => subtask.order)) + 1 : 1;

    const subtask = new Subtask(this.id, title, order, description);
    const newSubtasks = [...this.subtasks, subtask];

    return new Todo(
      this.content,
      this.id,
      this.subtasks.length > 0 ? newSubtasks.every((subtask) => subtask.status === "completed") : false,
      this.createdAt,
      new Date(),
      newSubtasks,
    );
  }

  updateContent(content: string): Todo {
    return new Todo(content, this.id, this.completed, this.createdAt, new Date(), this.subtasks);
  }

  updateCompletionStatus(): Todo {
    const completed =
      this.subtasks.length > 0 ? this.subtasks.every((subtask) => subtask.status === "completed") : false;

    return new Todo(this.content, this.id, completed, this.createdAt, new Date(), this.subtasks);
  }

  markAsCompleted(): Todo {
    return new Todo(this.content, this.id, true, this.createdAt, new Date(), this.subtasks);
  }

  markAsIncomplete(): Todo {
    return new Todo(this.content, this.id, false, this.createdAt, new Date(), this.subtasks);
  }

  reorderSubtasks(orderMap: Record<string, number>): Todo {
    const updatedSubtasks: Subtask[] = this.subtasks.map((subtask) => {
      const orderValue = orderMap[subtask.id];
      if (orderValue !== undefined) {
        return subtask.updateOrder(orderValue);
      }
      return subtask;
    });

    const sortedSubtasks = [...updatedSubtasks].sort((a, b) => a.order - b.order);

    return new Todo(this.content, this.id, this.completed, this.createdAt, new Date(), sortedSubtasks);
  }
}
