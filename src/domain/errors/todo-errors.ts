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

/**
 * DependencyCycleError
 * Thrown when trying to create a dependency relationship that would create a cycle
 */
export class DependencyCycleError extends Error {
  constructor(todoId: string, dependencyId: string) {
    super(`Adding dependency from todo ${todoId} to ${dependencyId} would create a cycle`);
    this.name = "DependencyCycleError";
  }
}

/**
 * SelfDependencyError
 * Thrown when trying to create a dependency relationship where a todo depends on itself
 */
export class SelfDependencyError extends Error {
  constructor(todoId: string) {
    super(`Todo ${todoId} cannot depend on itself`);
    this.name = "SelfDependencyError";
  }
}

/**
 * DependencyExistsError
 * Thrown when trying to create a dependency relationship that already exists
 */
export class DependencyExistsError extends Error {
  constructor(todoId: string, dependencyId: string) {
    super(`Todo ${todoId} already depends on ${dependencyId}`);
    this.name = "DependencyExistsError";
  }
}

/**
 * DependencyNotFoundError
 * Thrown when a dependency relationship is not found
 */
export class DependencyNotFoundError extends Error {
  constructor(todoId: string, dependencyId: string) {
    super(`Dependency relationship from todo ${todoId} to ${dependencyId} not found`);
    this.name = "DependencyNotFoundError";
  }
}

/**
 * IncompleteDependenciesError
 * Thrown when trying to complete a todo that has incomplete dependencies
 */
export class IncompleteDependenciesError extends Error {
  constructor(todoId: string) {
    super(`Cannot complete todo ${todoId} because it has incomplete dependencies`);
    this.name = "IncompleteDependenciesError";
  }
}

/**
 * SubtaskNotFoundError
 * Thrown when a subtask is not found in the parent todo
 */
export class SubtaskNotFoundError extends Error {
  constructor(subtaskId: string, parentId: string) {
    super(`Subtask ${subtaskId} not found in parent todo ${parentId}`);
    this.name = "SubtaskNotFoundError";
  }
}
