import { afterAll, beforeAll, beforeEach, describe, expect, it, test } from "bun:test";
import { PriorityLevel, Todo, TodoStatus, WorkState } from "@toodo/core";
import {
  DependencyCycleError,
  DependencyExistsError,
  DependencyNotFoundError,
  SelfDependencyError,
  TodoNotFoundError,
} from "../../domain/errors/todo-errors";
import { PrismaClient } from "../../generated/prisma";
import { PrismaTodoRepository } from "./prisma-todo-repository";

describe("PrismaTodoRepository", () => {
  const prisma = new PrismaClient();
  let repository: PrismaTodoRepository;

  beforeAll(async () => {
    repository = new PrismaTodoRepository(prisma);
  });

  beforeEach(async () => {
    // Clean up the database between tests
    await prisma.todoActivity.deleteMany({});
    await prisma.todoDependency.deleteMany({});
    await prisma.todoTag.deleteMany({});
    await prisma.todo.deleteMany({});
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  // ... other existing tests

  describe("Subtask management", () => {
    let parentTodo: Todo;
    let subtask1: Todo;
    let subtask2: Todo;

    beforeEach(async () => {
      // Create Todo entity using Todo.createNew
      parentTodo = await repository.create(
        Todo.createNew({
          id: "test-parent-id",
          title: "Parent Todo",
          status: TodoStatus.PENDING,
          workState: WorkState.IDLE,
          totalWorkTime: 0,
          lastStateChangeAt: new Date(),
          priority: PriorityLevel.MEDIUM,
        }),
      );

      // Create subtasks
      subtask1 = await repository.create(
        Todo.createNew({
          id: "test-subtask1-id",
          title: "Subtask 1",
          status: TodoStatus.PENDING,
          workState: WorkState.IDLE,
          totalWorkTime: 0,
          lastStateChangeAt: new Date(),
          priority: PriorityLevel.MEDIUM,
        }),
      );

      subtask2 = await repository.create(
        Todo.createNew({
          id: "test-subtask2-id",
          title: "Subtask 2",
          status: TodoStatus.PENDING,
          workState: WorkState.IDLE,
          totalWorkTime: 0,
          lastStateChangeAt: new Date(),
          priority: PriorityLevel.MEDIUM,
        }),
      );
    });

    it("should add a subtask", async () => {
      // Act
      await repository.addSubtask(parentTodo.id, subtask1.id);

      // Assert
      const updatedSubtask = await repository.findById(subtask1.id);
      expect(updatedSubtask?.parentId).toBe(parentTodo.id);

      const children = await repository.findByParent(parentTodo.id);
      expect(children.length).toBe(1);
      expect(children[0]?.id).toBe(subtask1.id);
    });

    it("should remove a subtask", async () => {
      // Arrange
      await repository.addSubtask(parentTodo.id, subtask1.id);

      // Act
      await repository.removeSubtask(parentTodo.id, subtask1.id);

      // Assert
      const updatedSubtask = await repository.findById(subtask1.id);
      // parentId becomes undefined (not null) when mapped to Todo entity
      expect(updatedSubtask?.parentId).toBeUndefined();

      const children = await repository.findByParent(parentTodo.id);
      expect(children.length).toBe(0);
    });

    it("should throw error when adding itself as a subtask", async () => {
      // Act & Assert
      await expect(repository.addSubtask(parentTodo.id, parentTodo.id)).rejects.toThrow(
        new SelfDependencyError(parentTodo.id),
      );
    });

    it("should throw error when removing non-existent subtask relationship", async () => {
      // Act & Assert
      await expect(repository.removeSubtask(parentTodo.id, subtask1.id)).rejects.toThrow(
        `Subtask ${subtask1.id} not found in parent todo ${parentTodo.id}`,
      );
    });

    it("should update parent", async () => {
      // Act
      await repository.updateParent(subtask1.id, parentTodo.id);

      // Assert
      const updatedSubtask = await repository.findById(subtask1.id);
      expect(updatedSubtask?.parentId).toBe(parentTodo.id);
    });

    it("should remove parent", async () => {
      // Arrange
      await repository.updateParent(subtask1.id, parentTodo.id);

      // Act
      await repository.updateParent(subtask1.id, null);

      // Assert
      const updatedSubtask = await repository.findById(subtask1.id);
      // parentId becomes undefined (not null) when mapped to Todo entity
      expect(updatedSubtask?.parentId).toBeUndefined();
    });

    it("should detect hierarchy cycles", async () => {
      // Arrange
      await repository.updateParent(subtask1.id, parentTodo.id);
      await repository.updateParent(subtask2.id, subtask1.id);

      // Act & Assert
      // Circular reference: parent -> subtask1 -> subtask2 -> parent
      const wouldCreateCycle = await repository.checkForHierarchyCycle(parentTodo.id, subtask2.id);
      expect(wouldCreateCycle).toBe(true);
    });

    it("should throw error when creating a cycle", async () => {
      // Arrange
      await repository.updateParent(subtask1.id, parentTodo.id);
      await repository.updateParent(subtask2.id, subtask1.id);

      // Act & Assert
      await expect(repository.updateParent(parentTodo.id, subtask2.id)).rejects.toThrow(DependencyCycleError);
    });

    it("should find children tree", async () => {
      // Arrange
      await repository.updateParent(subtask1.id, parentTodo.id);
      await repository.updateParent(subtask2.id, subtask1.id);

      // Create deeper nesting for testing maxDepth
      const deepSubtask = await repository.create(
        Todo.createNew({
          id: "test-deep-subtask-id",
          title: "Deep Subtask",
          status: TodoStatus.PENDING,
          workState: WorkState.IDLE,
          totalWorkTime: 0,
          lastStateChangeAt: new Date(),
          priority: PriorityLevel.MEDIUM,
        }),
      );
      await repository.updateParent(deepSubtask.id, subtask2.id);

      // Act
      const childrenTree = await repository.findChildrenTree(parentTodo.id);
      const limitedTree = await repository.findChildrenTree(parentTodo.id, 1);

      // Assert
      expect(childrenTree.length).toBe(1);
      expect(childrenTree[0]?.id).toBe(subtask1.id);
      expect(childrenTree[0]?.subtaskIds.length).toBe(1);
      expect(childrenTree[0]?.subtaskIds[0]).toBe(subtask2.id);

      // Depth limit test
      expect(limitedTree.length).toBe(1);
      expect(limitedTree[0]?.id).toBe(subtask1.id);
      // subtask2 is not included because depth is limited to 1
      expect(limitedTree[0]?.subtaskIds.length).toBe(0);
    });
  });
});
