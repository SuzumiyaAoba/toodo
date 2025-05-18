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
import { TOKENS } from "./DependencyTokens";

/**
 * Initialize the dependency injection container
 */
export function initializeContainer(): void {
	// Register database instance
	container.register(TOKENS.DB, { useValue: db });

	// Register repositories
	container.register(TOKENS.TaskRepository, {
		useClass: DrizzleTaskRepository,
	});

	// Register use cases
	container.register(TOKENS.GetRootTasksUseCase, {
		useClass: GetRootTasksUseCase,
	});
	container.register(TOKENS.GetTaskByIdUseCase, {
		useClass: GetTaskByIdUseCase,
	});
	container.register(TOKENS.CreateTaskUseCase, { useClass: CreateTaskUseCase });
	container.register(TOKENS.UpdateTaskUseCase, { useClass: UpdateTaskUseCase });
	container.register(TOKENS.DeleteTaskUseCase, { useClass: DeleteTaskUseCase });
	container.register(TOKENS.MoveTaskUseCase, { useClass: MoveTaskUseCase });
	container.register(TOKENS.ReorderTasksUseCase, {
		useClass: ReorderTasksUseCase,
	});

	// Register controllers
	container.register(TOKENS.TaskController, { useClass: TaskController });
}

/**
 * Get a single instance from the container
 */
export function resolve<T>(token: symbol): T {
	return container.resolve<T>(token);
}

/**
 * Get the task controller
 */
export function getTaskController(): TaskController {
	return resolve<TaskController>(TOKENS.TaskController);
}
