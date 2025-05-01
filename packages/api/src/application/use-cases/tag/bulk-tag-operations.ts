import { array, object, parse, pipe, string, uuid } from "valibot";
import { TagNotFoundError } from "../../../domain/errors/tag-errors";
import { TodoNotFoundError } from "../../../domain/errors/todo-errors";
import type { TagRepository } from "../../../domain/repositories/tag-repository";
import type { TodoRepository } from "../../../domain/repositories/todo-repository";

/**
 * Input for bulk assigning a tag to multiple todos
 */
export type BulkAssignTagInput = {
  tagId: string;
  todoIds: string[];
};

/**
 * Schema for bulk assigning a tag to multiple todos
 */
export const BulkAssignTagInputSchema = object({
  tagId: object({
    tagId: pipe(string(), uuid("Tag ID must be a valid UUID")),
  }),
  todoIds: array(pipe(string(), uuid("Todo ID must be a valid UUID"))),
});

export interface BulkTagOperationInput {
  tagIds: string[];
  todoIds: string[];
}

export type BulkTagOperationOutput = {
  successCount: number;
  failedCount: number;
};

export const BulkTagOperationInputSchema = object({
  tagIds: array(pipe(string(), uuid("Tag ID must be a valid UUID"))),
  todoIds: array(pipe(string(), uuid("Todo ID must be a valid UUID"))),
});

export type ValidatedBulkTagOperationInput = {
  tagIds: string[];
  todoIds: string[];
};

export class BulkAssignTagUseCase {
  constructor(
    private readonly tagRepository: TagRepository,
    private readonly todoRepository: TodoRepository,
  ) {}

  async execute(input: BulkTagOperationInput): Promise<BulkTagOperationOutput> {
    const validated = parse(BulkTagOperationInputSchema, input) as BulkTagOperationInput;
    const tagId = validated.tagIds[0];
    const todoIds = validated.todoIds;

    if (!tagId || todoIds.length === 0) {
      return {
        successCount: 0,
        failedCount: 0,
      };
    }

    // Validate tag exists
    const tag = await this.tagRepository.findById(tagId);
    if (!tag) {
      throw new TagNotFoundError(tagId);
    }

    // Validate all todos exist
    for (const todoId of todoIds) {
      const todo = await this.todoRepository.findById(todoId);
      if (!todo) {
        throw new TodoNotFoundError(todoId);
      }
    }

    const successCount = await this.tagRepository.bulkAssignTagToTodos(tagId, todoIds);
    const failedCount = todoIds.length - successCount;

    return {
      successCount,
      failedCount,
    };
  }
}

export class BulkRemoveTagUseCase {
  constructor(
    private readonly tagRepository: TagRepository,
    private readonly todoRepository: TodoRepository,
  ) {}

  async execute(input: BulkTagOperationInput): Promise<BulkTagOperationOutput> {
    const validated = parse(BulkTagOperationInputSchema, input) as BulkTagOperationInput;
    const tagId = validated.tagIds[0];
    const todoIds = validated.todoIds;

    if (!tagId || todoIds.length === 0) {
      return {
        successCount: 0,
        failedCount: 0,
      };
    }

    // Validate tag exists
    const tag = await this.tagRepository.findById(tagId);
    if (!tag) {
      throw new TagNotFoundError(tagId);
    }

    // Validate all todos exist
    for (const todoId of todoIds) {
      const todo = await this.todoRepository.findById(todoId);
      if (!todo) {
        throw new TodoNotFoundError(todoId);
      }
    }

    const successCount = await this.tagRepository.bulkRemoveTagFromTodos(tagId, todoIds);
    const failedCount = todoIds.length - successCount;

    return {
      successCount,
      failedCount,
    };
  }
}
