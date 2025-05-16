import { Todo } from "./model";
import { TodoRepository } from "./repository";

/**
 * Data Transfer Object for creating a Todo
 */
export interface CreateTodoDTO {
  /** Task content */
  content: string;
}

/**
 * Data Transfer Object for updating a Todo
 */
export interface UpdateTodoDTO {
  /** ID of the Todo to update */
  id: string;
  /** New task content (optional) */
  content?: string;
  /** New completion status (optional) */
  completed?: boolean;
}

/**
 * Class implementing all Todo-related use cases
 * Handles application layer logic and bridges domain model with infrastructure layer
 */
export class TodoUseCases {
  /**
   * Constructor for TodoUseCases class
   * @param todoRepository Implementation of Todo repository
   */
  constructor(private todoRepository: TodoRepository) {}

  /**
   * Retrieves all Todos
   * @returns Array of all Todo entities
   */
  async getAllTodos(): Promise<Todo[]> {
    return this.todoRepository.findAll();
  }

  /**
   * Creates a new Todo
   * @param dto Data needed to create a Todo
   * @returns The created Todo entity
   */
  async createTodo(dto: CreateTodoDTO): Promise<Todo> {
    const todo = new Todo(dto.content);
    return this.todoRepository.save(todo);
  }

  /**
   * Updates an existing Todo
   * @param dto Data needed to update a Todo
   * @returns The updated Todo entity, or null if not found
   */
  async updateTodo(dto: UpdateTodoDTO): Promise<Todo | null> {
    const todo = await this.todoRepository.findById(dto.id);

    if (!todo) {
      return null;
    }

    if (dto.content !== undefined) {
      todo.updateContent(dto.content);
    }

    if (dto.completed !== undefined) {
      if (dto.completed) {
        todo.markAsCompleted();
      } else {
        todo.markAsIncomplete();
      }
    }

    return this.todoRepository.save(todo);
  }

  /**
   * Deletes a Todo
   * @param id ID of the Todo to delete
   * @returns Whether the deletion was successful
   */
  async deleteTodo(id: string): Promise<boolean> {
    const todo = await this.todoRepository.findById(id);

    if (!todo) {
      return false;
    }

    await this.todoRepository.delete(id);
    return true;
  }
}
