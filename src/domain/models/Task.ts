import { v4 as uuidv4 } from "uuid";

export type TaskStatus = "completed" | "incomplete";

export class Task {
  readonly id: string;
  readonly parentId: string | null;
  readonly title: string;
  readonly description: string | null;
  readonly status: TaskStatus;
  readonly order: number;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly subtasks: readonly Task[];

  constructor(
    title: string,
    parentId: string | null = null,
    description: string | null = null,
    id?: string,
    status: TaskStatus = "incomplete",
    order = 1,
    createdAt?: Date,
    updatedAt?: Date,
    subtasks: readonly Task[] = [],
  ) {
    this.id = id || uuidv4();
    this.parentId = parentId;
    this.title = title;
    this.description = description;
    this.status = status;
    this.order = order;
    this.createdAt = createdAt || new Date();
    this.updatedAt = updatedAt || new Date();
    this.subtasks = [...subtasks]; // Create a copy to ensure immutability
  }

  addSubtask(title: string, description?: string | null): Task {
    const order = this.subtasks.length > 0 ? Math.max(...this.subtasks.map((subtask) => subtask.order)) + 1 : 1;

    const subtask = new Task(title, this.id, description || null, undefined, "incomplete", order);

    const newSubtasks = [...this.subtasks, subtask];

    // Create a new Task with updated subtasks
    const updatedTask = new Task(
      this.title,
      this.parentId,
      this.description,
      this.id,
      this.calculateStatus(newSubtasks),
      this.order,
      this.createdAt,
      new Date(),
      newSubtasks,
    );

    return updatedTask;
  }

  updateTitle(title: string): Task {
    return new Task(
      title,
      this.parentId,
      this.description,
      this.id,
      this.status,
      this.order,
      this.createdAt,
      new Date(),
      this.subtasks,
    );
  }

  updateDescription(description: string | null): Task {
    return new Task(
      this.title,
      this.parentId,
      description,
      this.id,
      this.status,
      this.order,
      this.createdAt,
      new Date(),
      this.subtasks,
    );
  }

  updateStatus(): Task {
    const newStatus = this.calculateStatus(this.subtasks);

    return new Task(
      this.title,
      this.parentId,
      this.description,
      this.id,
      newStatus,
      this.order,
      this.createdAt,
      new Date(),
      this.subtasks,
    );
  }

  updateOrder(order: number): Task {
    return new Task(
      this.title,
      this.parentId,
      this.description,
      this.id,
      this.status,
      order,
      this.createdAt,
      new Date(),
      this.subtasks,
    );
  }

  markAsCompleted(): Task {
    // Mark all subtasks as completed as well
    const completedSubtasks = this.subtasks.map((subtask) => subtask.markAsCompleted());

    return new Task(
      this.title,
      this.parentId,
      this.description,
      this.id,
      "completed",
      this.order,
      this.createdAt,
      new Date(),
      completedSubtasks,
    );
  }

  markAsIncomplete(): Task {
    return new Task(
      this.title,
      this.parentId,
      this.description,
      this.id,
      "incomplete",
      this.order,
      this.createdAt,
      new Date(),
      this.subtasks,
    );
  }

  reorderSubtasks(orderMap: Record<string, number>): Task {
    const updatedSubtasks: Task[] = this.subtasks.map((subtask) => {
      const orderValue = orderMap[subtask.id];
      if (orderValue !== undefined) {
        return subtask.updateOrder(orderValue);
      }
      return subtask;
    });

    const sortedSubtasks = [...updatedSubtasks].sort((a, b) => a.order - b.order);

    return new Task(
      this.title,
      this.parentId,
      this.description,
      this.id,
      this.status,
      this.order,
      this.createdAt,
      new Date(),
      sortedSubtasks,
    );
  }

  // Helper method for calculating status based on subtasks
  private calculateStatus(subtasks: readonly Task[]): TaskStatus {
    if (subtasks.length > 0) {
      return subtasks.every((subtask) => subtask.status === "completed") ? "completed" : "incomplete";
    }
    return this.status;
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
