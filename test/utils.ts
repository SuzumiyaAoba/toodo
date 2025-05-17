import { v4 as uuidv4 } from "uuid";
import type { NewSubtask, NewTodo } from "../src/db/schema";

/**
 * Create mock Todo data for testing
 */
export function createMockTodo(override: Partial<NewTodo> = {}): NewTodo {
  return {
    id: uuidv4(),
    content: "Test Todo",
    completed: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...override,
  };
}

/**
 * Create mock Subtask data for testing
 */
export function createMockSubtask(override: Partial<NewSubtask> = {}): NewSubtask {
  return {
    id: uuidv4(),
    todoId: uuidv4(),
    title: "Test Subtask",
    description: "Test Description",
    status: "incomplete",
    order: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...override,
  };
}
