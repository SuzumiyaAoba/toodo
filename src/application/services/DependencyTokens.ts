/**
 * Dependency Injection Container Tokens
 * Provides symbol-based identifiers for DI container
 */
export const TOKENS = {
  // Infrastructure
  DB: Symbol.for("DB"),

  // Repositories
  TaskRepository: Symbol.for("TaskRepository"),

  // Use Cases
  GetRootTasksUseCase: Symbol.for("GetRootTasksUseCase"),
  GetTaskByIdUseCase: Symbol.for("GetTaskByIdUseCase"),
  CreateTaskUseCase: Symbol.for("CreateTaskUseCase"),
  UpdateTaskUseCase: Symbol.for("UpdateTaskUseCase"),
  DeleteTaskUseCase: Symbol.for("DeleteTaskUseCase"),
  MoveTaskUseCase: Symbol.for("MoveTaskUseCase"),
  ReorderTasksUseCase: Symbol.for("ReorderTasksUseCase"),

  // Controllers
  TaskController: Symbol.for("TaskController"),
};
