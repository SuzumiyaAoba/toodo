import { v4 as uuidv4 } from "uuid";

/**
 * Type representing the status of a Subtask
 * completed: task is completed
 * incomplete: task is not completed
 */
export type SubtaskStatus = "completed" | "incomplete";

/**
 * Domain model representing a Subtask
 * Subtask represents a smaller task that belongs to a Todo
 */
export class Subtask {
  /** Unique identifier */
  id: string;
  /** Parent Todo identifier */
  todoId: string;
  /** Subtask title */
  title: string;
  /** Subtask description (optional) */
  description: string | null;
  /** Subtask status */
  status: SubtaskStatus;
  /** Display order of the subtask */
  order: number;
  /** Creation date */
  createdAt: Date;
  /** Last update date */
  updatedAt: Date;

  /**
   * Creates a Subtask object
   * @param todoId Parent Todo identifier
   * @param title Subtask title
   * @param order Display order of the subtask
   * @param description Subtask description (optional)
   * @param id Unique identifier (auto-generated if omitted)
   * @param status Subtask status (defaults to incomplete if omitted)
   * @param createdAt Creation date (defaults to current time if omitted)
   * @param updatedAt Last update date (defaults to current time if omitted)
   */
  constructor(
    todoId: string,
    title: string,
    order: number,
    description: string | null = null,
    id?: string,
    status: SubtaskStatus = "incomplete",
    createdAt?: Date,
    updatedAt?: Date
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

  /**
   * Updates the subtask title
   * @param title New title
   */
  updateTitle(title: string): void {
    this.title = title;
    this.updatedAt = new Date();
  }

  /**
   * Updates the subtask description
   * @param description New description
   */
  updateDescription(description: string | null): void {
    this.description = description;
    this.updatedAt = new Date();
  }

  /**
   * Updates the subtask status
   * @param status New status
   */
  updateStatus(status: SubtaskStatus): void {
    this.status = status;
    this.updatedAt = new Date();
  }

  /**
   * Updates the display order of the subtask
   * @param order New display order
   */
  updateOrder(order: number): void {
    this.order = order;
    this.updatedAt = new Date();
  }

  /**
   * Marks the subtask as completed
   */
  markAsCompleted(): void {
    this.status = "completed";
    this.updatedAt = new Date();
  }

  /**
   * Marks the subtask as incomplete
   */
  markAsIncomplete(): void {
    this.status = "incomplete";
    this.updatedAt = new Date();
  }
}
