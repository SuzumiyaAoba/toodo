import "reflect-metadata";
import { describe, expect, it, mock } from "bun:test";
import { ReorderTasksUseCase } from "../src/application/usecases/task/ReorderTasksUseCase";
import type { Task } from "../src/domain/models/Task";
import type {
  PaginationParams,
  TaskRepository,
} from "../src/domain/repositories/TaskRepository";

describe("Use Cases", () => {
  describe("ReorderTasksUseCase", () => {
    it("should validate order map for continuous sequence", async () => {
      // Create the sample tasks
      const sampleTasks = [
        { id: "task1", order: 1 },
        { id: "task2", order: 2 },
        { id: "task3", order: 3 },
      ] as unknown as Task[];

      // Mock task repository
      const mockTaskRepository: TaskRepository = {
        findRootTasks: mock(async () => sampleTasks),
        findRootTasksWithPagination: mock(
          async (_: PaginationParams) => sampleTasks
        ),
        findByParentId: mock(async (_: string) => sampleTasks),
        findById: mock(async (_: string) => null),
        save: mock(async (task: Task) => task),
        delete: mock(async (_: string) => {}),
        updateOrder: mock(async (tasks: readonly Task[]) => tasks),
        findTaskTree: mock(async (_: string) => null),
        moveTask: mock(async (_: string, __: string | null) => null),
      };

      const useCase = new ReorderTasksUseCase(mockTaskRepository);

      // Valid order map with continuous sequence starting from 1
      await expect(
        useCase.execute({
          parentId: null,
          orderMap: { task1: 1, task2: 2, task3: 3 },
        })
      ).resolves.toBeDefined();

      // Valid order map with different values but still continuous
      await expect(
        useCase.execute({
          parentId: null,
          orderMap: { task1: 2, task2: 1, task3: 3 },
        })
      ).resolves.toBeDefined();

      // Valid order map starting from 0
      await expect(
        useCase.execute({
          parentId: null,
          orderMap: { task1: 0, task2: 1, task3: 2 },
        })
      ).resolves.toBeDefined();

      // Invalid order map - discontinuous sequence
      await expect(
        useCase.execute({
          parentId: null,
          orderMap: { task1: 1, task2: 3, task3: 5 },
        })
      ).rejects.toThrow("continuous sequence");

      // Invalid order map - duplicate values
      await expect(
        useCase.execute({
          parentId: null,
          orderMap: { task1: 1, task2: 1, task3: 2 },
        })
      ).rejects.toThrow("duplicate order values");

      // Invalid order map - starting from neither 0 nor 1
      await expect(
        useCase.execute({
          parentId: null,
          orderMap: { task1: 2, task2: 3, task3: 4 },
        })
      ).rejects.toThrow("Order values must start with 0 or 1");

      // Missing task ID in the orderMap
      const unknownTaskId = "unknown";
      await expect(
        useCase.execute({
          parentId: null,
          orderMap: { [unknownTaskId]: 1, task1: 2, task2: 3 },
        })
      ).rejects.toThrow("not siblings");
    });
  });
});
