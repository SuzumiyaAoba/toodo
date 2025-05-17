import { v4 as uuidv4 } from "uuid";

export type SubtaskStatus = "completed" | "incomplete";

export type Subtask = Readonly<{
  id: string;
  todoId: string;
  title: string;
  description: string | null;
  status: SubtaskStatus;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}>;

export namespace Subtask {
  export function create(
    todoId: string,
    title: string,
    order: number,
    description: string | null = null,
    id?: string,
    status: SubtaskStatus = "incomplete",
    createdAt?: Date,
    updatedAt?: Date,
  ): Subtask {
    return {
      id: id || uuidv4(),
      todoId,
      title,
      description,
      status,
      order,
      createdAt: createdAt || new Date(),
      updatedAt: updatedAt || new Date(),
    };
  }

  export function updateTitle(subtask: Subtask, title: string): Subtask {
    return {
      ...subtask,
      title,
      updatedAt: new Date(),
    };
  }

  export function updateDescription(subtask: Subtask, description: string | null): Subtask {
    return {
      ...subtask,
      description,
      updatedAt: new Date(),
    };
  }

  export function updateStatus(subtask: Subtask, status: SubtaskStatus): Subtask {
    return {
      ...subtask,
      status,
      updatedAt: new Date(),
    };
  }

  export function updateOrder(subtask: Subtask, order: number): Subtask {
    return {
      ...subtask,
      order,
      updatedAt: new Date(),
    };
  }

  export function markAsCompleted(subtask: Subtask): Subtask {
    return {
      ...subtask,
      status: "completed",
      updatedAt: new Date(),
    };
  }

  export function markAsIncomplete(subtask: Subtask): Subtask {
    return {
      ...subtask,
      status: "incomplete",
      updatedAt: new Date(),
    };
  }
}
