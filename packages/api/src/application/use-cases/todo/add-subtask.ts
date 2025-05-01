import * as v from "valibot";
import { TodoNotFoundError } from "../../../domain/errors/todo-errors";
import { DependencyCycleError } from "../../../domain/errors/todo-errors";
import { SelfDependencyError } from "../../../domain/errors/todo-errors";
import type { TodoRepository } from "../../../domain/repositories/todo-repository";

/**
 * サブタスクを追加するためのInput
 */
export interface AddSubtaskUseCaseInput {
  parentId: string;
  subtaskId: string;
}

/**
 * サブタスクを追加するためのInputスキーマ
 */
export const AddSubtaskInputSchema = v.object({
  parentId: v.pipe(v.string(), v.uuid("Parent ID must be a valid UUID")),
  subtaskId: v.pipe(v.string(), v.uuid("Subtask ID must be a valid UUID")),
});

/**
 * サブタスクを追加するユースケース
 */
export class AddSubtaskUseCase {
  constructor(private readonly todoRepository: TodoRepository) {}

  /**
   * サブタスクを追加する
   */
  async execute({ parentId, subtaskId }: AddSubtaskUseCaseInput): Promise<void> {
    const parent = await this.todoRepository.findById(parentId);
    const subtask = await this.todoRepository.findById(subtaskId);

    if (!parent) {
      throw new TodoNotFoundError(parentId);
    }

    if (!subtask) {
      throw new TodoNotFoundError(subtaskId);
    }

    if (parentId === subtaskId) {
      throw new SelfDependencyError(parentId);
    }

    const wouldCreateCycle = await this.todoRepository.checkForHierarchyCycle(parentId, subtaskId);

    if (wouldCreateCycle) {
      throw new DependencyCycleError(parentId, subtaskId);
    }

    await this.todoRepository.addSubtask(parentId, subtaskId);
  }
}
