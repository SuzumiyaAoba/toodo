import { v4 as uuidv4 } from "uuid";
import { Subtask } from "./Subtask";

export type TodoStatus = "completed" | "incomplete";

export type Todo = Readonly<{
  id: string;
  content: string;
  completed: boolean;
  createdAt: Date;
  updatedAt: Date;
  subtasks: readonly Subtask[];
}>;

export namespace Todo {
  export function create(
    content: string,
    id?: string,
    completed?: boolean,
    createdAt?: Date,
    updatedAt?: Date,
    subtasks: readonly Subtask[] = [],
  ): Todo {
    return {
      id: id || uuidv4(),
      content,
      completed: completed ?? false,
      createdAt: createdAt || new Date(),
      updatedAt: updatedAt || new Date(),
      subtasks: [...subtasks], // Create a copy to ensure immutability
    };
  }

  export function addSubtask(todo: Todo, title: string, description?: string | null): Todo {
    const order = todo.subtasks.length > 0 ? Math.max(...todo.subtasks.map((subtask) => subtask.order)) + 1 : 1;

    const subtask = Subtask.create(todo.id, title, order, description);
    const newSubtasks = [...todo.subtasks, subtask];

    return {
      ...todo,
      completed: todo.subtasks.length > 0 ? newSubtasks.every((subtask) => subtask.status === "completed") : false,
      updatedAt: new Date(),
      subtasks: newSubtasks,
    };
  }

  export function updateContent(todo: Todo, content: string): Todo {
    return {
      ...todo,
      content,
      updatedAt: new Date(),
    };
  }

  export function updateCompletionStatus(todo: Todo): Todo {
    const completed =
      todo.subtasks.length > 0 ? todo.subtasks.every((subtask) => subtask.status === "completed") : false;

    return {
      ...todo,
      completed,
      updatedAt: new Date(),
    };
  }

  export function markAsCompleted(todo: Todo): Todo {
    return {
      ...todo,
      completed: true,
      updatedAt: new Date(),
    };
  }

  export function markAsIncomplete(todo: Todo): Todo {
    return {
      ...todo,
      completed: false,
      updatedAt: new Date(),
    };
  }

  export function reorderSubtasks(todo: Todo, orderMap: Record<string, number>): Todo {
    const updatedSubtasks: Subtask[] = todo.subtasks.map((subtask) => {
      const orderValue = orderMap[subtask.id];
      if (orderValue !== undefined) {
        return Subtask.updateOrder(subtask, orderValue);
      }
      return subtask;
    });

    const sortedSubtasks = [...updatedSubtasks].sort((a, b) => a.order - b.order);

    return {
      ...todo,
      updatedAt: new Date(),
      subtasks: sortedSubtasks,
    };
  }
}
