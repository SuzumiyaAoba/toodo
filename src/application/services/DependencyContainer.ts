import { container } from "tsyringe";
import { db } from "../../db";
import { TaskController } from "../../infrastructure/controllers/TaskController";
import { DrizzleTaskRepository } from "../../infrastructure/repositories/DrizzleTaskRepository";
import { CreateTaskUseCase } from "../usecases/task/CreateTaskUseCase";
import { DeleteTaskUseCase } from "../usecases/task/DeleteTaskUseCase";
import { GetRootTasksUseCase } from "../usecases/task/GetRootTasksUseCase";
import { GetTaskByIdUseCase } from "../usecases/task/GetTaskByIdUseCase";
import { MoveTaskUseCase } from "../usecases/task/MoveTaskUseCase";
import { ReorderTasksUseCase } from "../usecases/task/ReorderTasksUseCase";
import { UpdateTaskUseCase } from "../usecases/task/UpdateTaskUseCase";

/**
 * Initialize the dependency injection container
 */
export function initializeContainer(): void {
  // Register database instance
  container.register("DB", { useValue: db });

  // Register repositories
  container.register("TaskRepository", { useClass: DrizzleTaskRepository });

  // Register use cases
  container.register("GetRootTasksUseCase", { useClass: GetRootTasksUseCase });
  container.register("GetTaskByIdUseCase", { useClass: GetTaskByIdUseCase });
  container.register("CreateTaskUseCase", { useClass: CreateTaskUseCase });
  container.register("UpdateTaskUseCase", { useClass: UpdateTaskUseCase });
  container.register("DeleteTaskUseCase", { useClass: DeleteTaskUseCase });
  container.register("MoveTaskUseCase", { useClass: MoveTaskUseCase });
  container.register("ReorderTasksUseCase", { useClass: ReorderTasksUseCase });

  // Register controllers
  container.register("TaskController", { useClass: TaskController });
}

/**
 * Get a single instance from the container
 */
export function resolve<T>(token: string | symbol): T {
  return container.resolve<T>(token);
}

/**
 * Get the task controller
 */
export function getTaskController(): TaskController {
  return resolve<TaskController>("TaskController");
}
