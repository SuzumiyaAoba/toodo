/**
 * Base error class for all domain-specific errors
 */
export class DomainError extends Error {
  constructor(message: string, name: string) {
    super(message);
    this.name = name;
  }
}

/**
 * Error thrown when a task is not found
 */
export class TaskNotFoundError extends DomainError {
  constructor(taskId: string) {
    super(`Task ${taskId} not found`, "TaskNotFoundError");
  }
}

/**
 * Error thrown when a parent task is not found
 */
export class ParentTaskNotFoundError extends DomainError {
  constructor(parentId: string) {
    super(`Parent task ${parentId} not found`, "ParentTaskNotFoundError");
  }
}

/**
 * Error thrown when a circular reference is detected
 * (e.g., Task A is parent of Task B is parent of Task A)
 */
export class CircularReferenceError extends DomainError {
  constructor(message: string) {
    super(message, "CircularReferenceError");
  }
}

/**
 * Error thrown when a task is set as its own parent
 */
export class SelfReferenceError extends DomainError {
  constructor(taskId: string) {
    super(`Cannot set a task as its own parent: ${taskId}`, "SelfReferenceError");
  }
}

/**
 * Error thrown when an invalid order is specified
 */
export class InvalidOrderError extends DomainError {
  constructor(message: string) {
    super(message, "InvalidOrderError");
  }
}
