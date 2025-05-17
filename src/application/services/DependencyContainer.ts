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

export class DependencyContainer {
  // Repository
  private taskRepository: DrizzleTaskRepository;

  // Task usecases
  private getRootTasksUseCase: GetRootTasksUseCase;
  private getTaskByIdUseCase: GetTaskByIdUseCase;
  private createTaskUseCase: CreateTaskUseCase;
  private updateTaskUseCase: UpdateTaskUseCase;
  private deleteTaskUseCase: DeleteTaskUseCase;
  private moveTaskUseCase: MoveTaskUseCase;
  private reorderTasksUseCase: ReorderTasksUseCase;

  // Controller
  private taskController: TaskController;

  constructor() {
    // Repository
    this.taskRepository = new DrizzleTaskRepository(db);

    // Task UseCases
    this.getRootTasksUseCase = new GetRootTasksUseCase(this.taskRepository);
    this.getTaskByIdUseCase = new GetTaskByIdUseCase(this.taskRepository);
    this.createTaskUseCase = new CreateTaskUseCase(this.taskRepository);
    this.updateTaskUseCase = new UpdateTaskUseCase(this.taskRepository);
    this.deleteTaskUseCase = new DeleteTaskUseCase(this.taskRepository);
    this.moveTaskUseCase = new MoveTaskUseCase(this.taskRepository);
    this.reorderTasksUseCase = new ReorderTasksUseCase(this.taskRepository);

    // Task Controller
    this.taskController = new TaskController(
      this.getRootTasksUseCase,
      this.getTaskByIdUseCase,
      this.createTaskUseCase,
      this.updateTaskUseCase,
      this.deleteTaskUseCase,
      this.moveTaskUseCase,
      this.reorderTasksUseCase,
    );
  }

  getTaskController(): TaskController {
    return this.taskController;
  }
}
