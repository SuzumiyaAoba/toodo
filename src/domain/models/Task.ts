import { v4 as uuidv4 } from "uuid";

export type TaskStatus = "completed" | "incomplete";

export type Task = Readonly<{
  id: string;
  parentId: string | null;
  title: string;
  description: string | null;
  status: TaskStatus;
  order: number;
  createdAt: Date;
  updatedAt: Date;
  subtasks: readonly Task[];
}>;

export namespace Task {
  export function create(
    title: string,
    parentId: string | null = null,
    description: string | null = null,
    id?: string,
    status: TaskStatus = "incomplete",
    order = 1,
    createdAt?: Date,
    updatedAt?: Date,
    subtasks: readonly Task[] = [],
  ): Task {
    return {
      id: id || uuidv4(),
      parentId,
      title,
      description,
      status,
      order,
      createdAt: createdAt || new Date(),
      updatedAt: updatedAt || new Date(),
      subtasks: [...subtasks], // Create a copy to ensure immutability
    };
  }

  export function addSubtask(task: Task, title: string, description?: string | null): Task {
    const order = task.subtasks.length > 0 ? Math.max(...task.subtasks.map((subtask) => subtask.order)) + 1 : 1;

    const subtask = create(title, task.id, description || null, undefined, "incomplete", order);
    const newSubtasks = [...task.subtasks, subtask];

    // Create a new Task with updated subtasks
    return {
      ...task,
      status: calculateStatus(newSubtasks, task.status),
      updatedAt: new Date(),
      subtasks: newSubtasks,
    };
  }

  export function updateTitle(task: Task, title: string): Task {
    return {
      ...task,
      title,
      updatedAt: new Date(),
    };
  }

  export function updateDescription(task: Task, description: string | null): Task {
    return {
      ...task,
      description,
      updatedAt: new Date(),
    };
  }

  export function updateStatus(task: Task): Task {
    const newStatus = calculateStatus(task.subtasks, task.status);

    return {
      ...task,
      status: newStatus,
      updatedAt: new Date(),
    };
  }

  export function updateOrder(task: Task, order: number): Task {
    return {
      ...task,
      order,
      updatedAt: new Date(),
    };
  }

  export function markAsCompleted(task: Task): Task {
    // Mark all subtasks as completed as well
    const completedSubtasks = task.subtasks.map((subtask) => markAsCompleted(subtask));

    return {
      ...task,
      status: "completed",
      updatedAt: new Date(),
      subtasks: completedSubtasks,
    };
  }

  export function markAsIncomplete(task: Task): Task {
    return {
      ...task,
      status: "incomplete",
      updatedAt: new Date(),
    };
  }

  export function reorderSubtasks(task: Task, orderMap: Record<string, number>): Task {
    const updatedSubtasks: Task[] = task.subtasks.map((subtask) => {
      const orderValue = orderMap[subtask.id];
      if (orderValue !== undefined) {
        return updateOrder(subtask, orderValue);
      }
      return subtask;
    });

    const sortedSubtasks = [...updatedSubtasks].sort((a, b) => a.order - b.order);

    return {
      ...task,
      updatedAt: new Date(),
      subtasks: sortedSubtasks,
    };
  }

  // Helper function for calculating status based on subtasks
  function calculateStatus(subtasks: readonly Task[], currentStatus: TaskStatus): TaskStatus {
    if (subtasks.length > 0) {
      return subtasks.every((subtask) => subtask.status === "completed") ? "completed" : "incomplete";
    }
    return currentStatus;
  }

  // Functions to support hierarchical task structure
  export function getTaskHierarchy(task: Task): Task[] {
    // Returns this task and all subtasks in a flattened array
    const result: Task[] = [task];

    for (const subtask of task.subtasks) {
      result.push(...getTaskHierarchy(subtask));
    }

    return result;
  }

  export function findTaskById(task: Task, id: string): Task | null {
    if (task.id === id) {
      return task;
    }

    for (const subtask of task.subtasks) {
      const found = findTaskById(subtask, id);
      if (found) {
        return found;
      }
    }

    return null;
  }

  export function getDepth(task: Task): number {
    return task.parentId === null ? 0 : 1 + Math.max(...task.subtasks.map(getDepth), 0);
  }
}
