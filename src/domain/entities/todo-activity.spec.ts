import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { WorkState } from "./todo";
import { ActivityType, mapToDomainTodoActivity } from "./todo-activity";

describe("TodoActivity Entity", () => {
  describe("mapToDomainTodoActivity", () => {
    test("should map prisma activity to domain activity", () => {
      // Arrange
      const now = new Date();
      const prismaActivity = {
        id: "activity-id",
        todoId: "todo-id",
        type: "started",
        workTime: 120,
        previousState: "idle",
        note: "Test note",
        createdAt: now,
      };

      // Act
      const domainActivity = mapToDomainTodoActivity(prismaActivity);

      // Assert
      expect(domainActivity).toEqual({
        id: "activity-id",
        todoId: "todo-id",
        type: ActivityType.STARTED,
        workTime: 120,
        previousState: WorkState.IDLE,
        note: "Test note",
        createdAt: now,
      });
    });

    test("should handle null optional fields", () => {
      // Arrange
      const now = new Date();
      const prismaActivity = {
        id: "activity-id",
        todoId: "todo-id",
        type: "completed",
        workTime: null,
        previousState: null,
        note: null,
        createdAt: now,
      };

      // Act
      const domainActivity = mapToDomainTodoActivity(prismaActivity);

      // Assert
      expect(domainActivity.workTime).toBeUndefined();
      // 実装では null の場合は null として扱われる
      expect(domainActivity.previousState).toBeNull();
      expect(domainActivity.note).toBeUndefined();
    });
  });
});
