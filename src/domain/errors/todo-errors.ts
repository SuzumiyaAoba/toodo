/**
 * TodoNotFoundError
 * Thrown when a todo with the specified id is not found
 */
export class TodoNotFoundError extends Error {
  constructor(id: string) {
    super(`Todo with id ${id} not found`);
    this.name = "TodoNotFoundError";
  }
}

/**
 * TodoActivityNotFoundError
 * Thrown when a todo activity with the specified id is not found
 */
export class TodoActivityNotFoundError extends Error {
  constructor(id: string) {
    super(`Todo activity with id ${id} not found`);
    this.name = "TodoActivityNotFoundError";
  }
}

/**
 * InvalidStateTransitionError
 * Thrown when trying to perform an invalid state transition on a todo
 */
export class InvalidStateTransitionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidStateTransitionError";
  }
}

/**
 * UnauthorizedActivityDeletionError
 * Thrown when trying to delete an activity that should not be deleted
 */
export class UnauthorizedActivityDeletionError extends Error {
  constructor(activityId: string, reason: string) {
    super(`Cannot delete activity ${activityId}: ${reason}`);
    this.name = "UnauthorizedActivityDeletionError";
  }
}
