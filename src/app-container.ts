import { db } from "./db";
import { TodoController } from "./todo/controller";
import { DrizzleTodoRepository } from "./todo/drizzle-repository";
import { TodoUseCases } from "./todo/usecases";
import { SubtaskController } from "./subtask/controller";
import { DrizzleSubtaskRepository } from "./subtask/drizzle-repository";
import { SubtaskUseCases } from "./subtask/usecases";

export class AppContainer {
  private todoRepository: DrizzleTodoRepository;
  private subtaskRepository: DrizzleSubtaskRepository;

  private todoUseCases: TodoUseCases;
  private subtaskUseCases: SubtaskUseCases;

  private todoController: TodoController;
  private subtaskController: SubtaskController;

  constructor() {
    // Repositories
    this.subtaskRepository = new DrizzleSubtaskRepository(db);
    this.todoRepository = new DrizzleTodoRepository(db, this.subtaskRepository);

    // UseCases
    this.todoUseCases = new TodoUseCases(
      this.todoRepository,
      this.subtaskRepository
    );
    this.subtaskUseCases = new SubtaskUseCases(
      this.subtaskRepository,
      this.todoRepository
    );

    // Controllers
    this.todoController = new TodoController(this.todoUseCases);
    this.subtaskController = new SubtaskController(this.subtaskUseCases);
  }

  getTodoController(): TodoController {
    return this.todoController;
  }

  getSubtaskController(): SubtaskController {
    return this.subtaskController;
  }
}
