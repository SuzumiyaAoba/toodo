import { v4 as uuidv4 } from "uuid";
import { Subtask } from "../subtask/model";

/**
 * Type representing the status of a Todo
 * completed: task is completed
 * incomplete: task is not completed
 */
export type TodoStatus = "completed" | "incomplete";

/**
 * Domain model representing a Todo
 * Todo is a central entity in the application that can contain multiple Subtasks
 */
export class Todo {
  /** Unique identifier */
  id: string;
  /** Task content */
  content: string;
  /** Completion status */
  completed: boolean;
  /** Creation date */
  createdAt: Date;
  /** Last update date */
  updatedAt: Date;
  /** List of subtasks */
  subtasks: Subtask[];

  /**
   * Creates a Todo object
   * @param content Task content
   * @param id Unique identifier (auto-generated if omitted)
   * @param completed Completion status (defaults to false if omitted)
   * @param createdAt Creation date (defaults to current time if omitted)
   * @param updatedAt Last update date (defaults to current time if omitted)
   * @param subtasks List of subtasks (defaults to empty array if omitted)
   */
  constructor(
    content: string,
    id?: string,
    completed?: boolean,
    createdAt?: Date,
    updatedAt?: Date,
    subtasks: Subtask[] = []
  ) {
    this.id = id || uuidv4();
    this.content = content;
    this.completed = completed ?? false;
    this.createdAt = createdAt || new Date();
    this.updatedAt = updatedAt || new Date();
    this.subtasks = subtasks;
  }

  /**
   * Adds a new subtask to the Todo
   * @param title Subtask title
   * @param description Subtask description (optional)
   * @returns The created subtask
   */
  addSubtask(title: string, description?: string | null): Subtask {
    const order =
      this.subtasks.length > 0
        ? Math.max(...this.subtasks.map((subtask) => subtask.order)) + 1
        : 1;

    const subtask = new Subtask(this.id, title, order, description);
    this.subtasks.push(subtask);
    this.updateCompletionStatus();
    return subtask;
  }

  /**
   * Updates the Todo content
   * @param content New task content
   */
  updateContent(content: string): void {
    this.content = content;
    this.updatedAt = new Date();
  }

  /**
   * Updates the Todo completion status based on subtask statuses
   * Todo becomes completed when all subtasks are completed
   */
  updateCompletionStatus(): void {
    this.completed =
      this.subtasks.length > 0
        ? this.subtasks.every((subtask) => subtask.status === "completed")
        : false;
    this.updatedAt = new Date();
  }

  /**
   * Marks the Todo as completed
   */
  markAsCompleted(): void {
    this.completed = true;
    this.updatedAt = new Date();
  }

  /**
   * Marks the Todo as incomplete
   */
  markAsIncomplete(): void {
    this.completed = false;
    this.updatedAt = new Date();
  }

  /**
   * Reorders the subtasks
   * @param orderMap Mapping of subtask IDs to their new order
   */
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
