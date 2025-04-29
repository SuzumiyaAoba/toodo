import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { ActivityType } from "@toodo/core";
import { WorkState } from "./todo";
import { mapToDomainTodoActivity } from "./todo-activity";

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
        workPeriodId: "work-period-id",
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
        workPeriodId: "work-period-id",
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
        workPeriodId: null,
      };

      // Act
      const domainActivity = mapToDomainTodoActivity(prismaActivity);

      // Assert
      expect(domainActivity.workTime).toBeUndefined();
      // In the implementation, null is treated as undefined
      expect(domainActivity.previousState).toBeUndefined();
      expect(domainActivity.note).toBeUndefined();
      expect(domainActivity.workPeriodId).toBeUndefined();
    });
  });
});
