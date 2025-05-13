import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { TodoStatus, WorkState, mapToDomainTodo } from "./todo";

describe("Todo Entity", () => {
  describe("mapToDomainTodo", () => {
    test("should map prisma todo to domain todo", () => {
      // Arrange
      const now = new Date();
      const prismaTodo = {
        id: "test-id",
        title: "Test Todo",
        description: "Test description",
        status: "pending",
        workState: "idle",
        totalWorkTime: 0,
        lastStateChangeAt: now,
        createdAt: now,
        updatedAt: now,
      };

      // Act
      const domainTodo = mapToDomainTodo(prismaTodo);

      // Assert
      expect(domainTodo).toEqual({
        id: "test-id",
        title: "Test Todo",
        description: "Test description",
        status: TodoStatus.PENDING,
        workState: WorkState.IDLE,
        totalWorkTime: 0,
        lastStateChangeAt: now,
        createdAt: now,
        updatedAt: now,
      });
    });

    test("should handle null description", () => {
      // Arrange
      const now = new Date();
      const prismaTodo = {
        id: "test-id",
        title: "Test Todo",
        description: null,
        status: "pending",
        workState: "idle",
        totalWorkTime: 0,
        lastStateChangeAt: now,
        createdAt: now,
        updatedAt: now,
      };

      // Act
      const domainTodo = mapToDomainTodo(prismaTodo);

      // Assert
      expect(domainTodo.description).toBeUndefined();
    });
  });
});
