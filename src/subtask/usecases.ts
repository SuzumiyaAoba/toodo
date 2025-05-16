import { Subtask, SubtaskStatus } from "./model";
import { SubtaskRepository } from "./repository";
import { TodoRepository } from "../todo/repository";

/**
 * Data Transfer Object for adding a subtask
 */
export interface AddSubtaskDTO {
  /** ID of the parent Todo */
  todoId: string;
  /** Subtask title */
  title: string;
  /** Subtask description (optional) */
  description?: string | null;
}

/**
 * Data Transfer Object for updating a subtask
 */
export interface UpdateSubtaskDTO {
  /** ID of the subtask to update */
  id: string;
  /** New title (optional) */
  title?: string;
  /** New description (optional) */
  description?: string | null;
  /** New status (optional) */
  status?: SubtaskStatus;
}

/**
 * Data Transfer Object for reordering subtasks
 */
export interface ReorderSubtasksDTO {
  /** ID of the parent Todo */
  todoId: string;
  /** Mapping of subtask IDs to their new order */
  orderMap: Record<string, number>;
}

/**
 * Class implementing all subtask-related use cases
 * Handles application layer logic and bridges domain model with infrastructure layer
 */
export class SubtaskUseCases {
  /**
   * Constructor for SubtaskUseCases class
   * @param subtaskRepository Implementation of Subtask repository
   * @param todoRepository Implementation of Todo repository
   */
  constructor(
    private subtaskRepository: SubtaskRepository,
    private todoRepository: TodoRepository
  ) {}

  /**
   * Retrieves all subtasks belonging to a specific Todo
   * @param todoId ID of the parent Todo
   * @returns Array of subtask entities
   */
  async getSubtasksByTodoId(todoId: string): Promise<Subtask[]> {
    return this.subtaskRepository.findByTodoId(todoId);
  }

  /**
   * Adds a new subtask
   * @param dto Data needed to add a subtask
   * @returns The created subtask entity, or null if parent Todo not found
   */
  async addSubtask(dto: AddSubtaskDTO): Promise<Subtask | null> {
    const todo = await this.todoRepository.findById(dto.todoId);

    if (!todo) {
      return null;
    }

    const subtask = todo.addSubtask(dto.title, dto.description);
    await this.todoRepository.save(todo);

    return subtask;
  }

  /**
   * Updates an existing subtask
   * @param dto Data needed to update a subtask
   * @returns The updated subtask entity, or null if not found
   */
  async updateSubtask(dto: UpdateSubtaskDTO): Promise<Subtask | null> {
    const subtask = await this.subtaskRepository.findById(dto.id);

    if (!subtask) {
      return null;
    }

    if (dto.title !== undefined) {
      subtask.updateTitle(dto.title);
    }

    if (dto.description !== undefined) {
      subtask.updateDescription(dto.description);
    }

    if (dto.status !== undefined) {
      subtask.updateStatus(dto.status);
    }

    const updatedSubtask = await this.subtaskRepository.save(subtask);

    // Update parent Todo completion status if the subtask status has changed
    if (dto.status !== undefined) {
      const todo = await this.todoRepository.findById(subtask.todoId);
      if (todo) {
        todo.updateCompletionStatus();
        await this.todoRepository.save(todo);
      }
    }

    return updatedSubtask;
  }

  /**
   * Deletes a subtask
   * @param id ID of the subtask to delete
   * @returns Whether the deletion was successful
   */
  async deleteSubtask(id: string): Promise<boolean> {
    const subtask = await this.subtaskRepository.findById(id);

    if (!subtask) {
      return false;
    }

    const todoId = subtask.todoId;
    await this.subtaskRepository.delete(id);

    // Update parent Todo completion status after subtask deletion
    const todo = await this.todoRepository.findById(todoId);
    if (todo) {
      todo.updateCompletionStatus();
      await this.todoRepository.save(todo);
    }

    return true;
  }

  /**
   * Reorders subtasks
   * @param dto Data needed for reordering subtasks
   * @returns Array of updated subtask entities, or null if parent Todo not found
   */
  async reorderSubtasks(dto: ReorderSubtasksDTO): Promise<Subtask[] | null> {
    const todo = await this.todoRepository.findById(dto.todoId);

    if (!todo) {
      return null;
    }

    todo.reorderSubtasks(dto.orderMap);
    await this.todoRepository.save(todo);

    return todo.subtasks;
  }
}
