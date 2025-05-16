import { db } from "../../db";
import { AddSubtaskUseCase } from "../usecases/subtask/AddSubtaskUseCase";
import { DeleteSubtaskUseCase } from "../usecases/subtask/DeleteSubtaskUseCase";
import { ReorderSubtasksUseCase } from "../usecases/subtask/ReorderSubtasksUseCase";
import { UpdateSubtaskUseCase } from "../usecases/subtask/UpdateSubtaskUseCase";
import { CreateTodoUseCase } from "../usecases/todo/CreateTodoUseCase";
import { DeleteTodoUseCase } from "../usecases/todo/DeleteTodoUseCase";
import { GetAllTodosUseCase } from "../usecases/todo/GetAllTodosUseCase";
import { UpdateTodoUseCase } from "../usecases/todo/UpdateTodoUseCase";
import { SubtaskController } from "../../infrastructure/controllers/SubtaskController";
import { TodoController } from "../../infrastructure/controllers/TodoController";
import { DrizzleSubtaskRepository } from "../../infrastructure/repositories/DrizzleSubtaskRepository";
import { DrizzleTodoRepository } from "../../infrastructure/repositories/DrizzleTodoRepository";

export class DependencyContainer {
  private subtaskRepository: DrizzleSubtaskRepository;
  private todoRepository: DrizzleTodoRepository;

  private getAllTodosUseCase: GetAllTodosUseCase;
  private createTodoUseCase: CreateTodoUseCase;
  private updateTodoUseCase: UpdateTodoUseCase;
  private deleteTodoUseCase: DeleteTodoUseCase;

  private addSubtaskUseCase: AddSubtaskUseCase;
  private updateSubtaskUseCase: UpdateSubtaskUseCase;
  private deleteSubtaskUseCase: DeleteSubtaskUseCase;
  private reorderSubtasksUseCase: ReorderSubtasksUseCase;

  private todoController: TodoController;
  private subtaskController: SubtaskController;

  constructor() {
    // Repositories
    this.subtaskRepository = new DrizzleSubtaskRepository(db);
    this.todoRepository = new DrizzleTodoRepository(db, this.subtaskRepository);

    // Todo UseCases
    this.getAllTodosUseCase = new GetAllTodosUseCase(this.todoRepository);
    this.createTodoUseCase = new CreateTodoUseCase(this.todoRepository);
    this.updateTodoUseCase = new UpdateTodoUseCase(this.todoRepository);
    this.deleteTodoUseCase = new DeleteTodoUseCase(this.todoRepository);

    // Subtask UseCases
    this.addSubtaskUseCase = new AddSubtaskUseCase(
      this.todoRepository,
      this.subtaskRepository
    );
    this.updateSubtaskUseCase = new UpdateSubtaskUseCase(
      this.subtaskRepository,
      this.todoRepository
    );
    this.deleteSubtaskUseCase = new DeleteSubtaskUseCase(
      this.subtaskRepository,
      this.todoRepository
    );
    this.reorderSubtasksUseCase = new ReorderSubtasksUseCase(
      this.todoRepository,
      this.subtaskRepository
    );

    // Controllers
    this.todoController = new TodoController(
      this.getAllTodosUseCase,
      this.createTodoUseCase,
      this.updateTodoUseCase,
      this.deleteTodoUseCase
    );

    this.subtaskController = new SubtaskController(
      this.subtaskRepository,
      this.addSubtaskUseCase,
      this.updateSubtaskUseCase,
      this.deleteSubtaskUseCase,
      this.reorderSubtasksUseCase
    );
  }

  getTodoController(): TodoController {
    return this.todoController;
  }

  getSubtaskController(): SubtaskController {
    return this.subtaskController;
  }
}
