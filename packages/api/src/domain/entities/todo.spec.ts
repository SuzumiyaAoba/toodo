import { describe, expect, it } from "bun:test";
import { PriorityLevel, Todo, TodoStatus, WorkState, mapToDomainTodo } from "@toodo/core";
import { createTestTodo } from "./test-helpers";

describe("Todo Entity", () => {
  describe("Todo Class", () => {
    it("should create a todo with default values", () => {
      // Arrange & Act
      const todo = new Todo("test-id", "Test Todo");

      // Assert
      expect(todo.id).toBe("test-id");
      expect(todo.title).toBe("Test Todo");
      expect(todo.status).toBe(TodoStatus.PENDING);
      expect(todo.workState).toBe(WorkState.IDLE);
      expect(todo.totalWorkTime).toBe(0);
      expect(todo.priority).toBe(PriorityLevel.MEDIUM);
      expect(todo.projectId).toBeUndefined();
      expect(todo.dependencies).toEqual([]);
      expect(todo.dependents).toEqual([]);
      expect(todo.parentId).toBeUndefined();
      expect(todo.subtaskIds).toEqual([]);
    });

    it("should update title", () => {
      // Arrange
      const todo = new Todo("test-id", "Test Todo");

      // Act
      const updatedTodo = todo.updateTitle("Updated Title");

      // Assert
      expect(updatedTodo.id).toBe("test-id");
      expect(updatedTodo.title).toBe("Updated Title");
    });

    it("should update description", () => {
      // Arrange
      const todo = new Todo("test-id", "Test Todo");

      // Act
      const updatedTodo = todo.updateDescription("Updated Description");

      // Assert
      expect(updatedTodo.description).toBe("Updated Description");
    });

    it("should update status", () => {
      // Arrange
      const todo = new Todo("test-id", "Test Todo");

      // Act
      const updatedTodo = todo.updateStatus(TodoStatus.COMPLETED);

      // Assert
      expect(updatedTodo.status).toBe(TodoStatus.COMPLETED);
    });

    it("should mark todo as completed", () => {
      // Arrange
      const todo = new Todo("test-id", "Test Todo");

      // Act
      const completedTodo = todo.complete();

      // Assert
      expect(completedTodo.status).toBe(TodoStatus.COMPLETED);
      expect(completedTodo.workState).toBe(WorkState.COMPLETED);
    });

    it("should mark todo as pending", () => {
      // Arrange
      const todo = new Todo("test-id", "Test Todo", TodoStatus.COMPLETED, WorkState.COMPLETED);

      // Act
      const reopenedTodo = todo.reopen();

      // Assert
      expect(reopenedTodo.status).toBe(TodoStatus.PENDING);
      expect(reopenedTodo.workState).toBe(WorkState.IDLE);
    });

    it("should update work state", () => {
      // Arrange
      const todo = new Todo("test-id", "Test Todo");
      const now = new Date();

      // Act
      const updatedTodo = todo.updateWorkState(WorkState.ACTIVE, now);

      // Assert
      expect(updatedTodo.workState).toBe(WorkState.ACTIVE);
      expect(updatedTodo.lastStateChangeAt).toBe(now);
    });

    it("should calculate work time when transitioning from active state", () => {
      // Arrange
      const startTime = new Date(2025, 0, 1, 10, 0, 0);
      const endTime = new Date(2025, 0, 1, 10, 0, 30); // 30 seconds later
      const todo = new Todo("test-id", "Test Todo", TodoStatus.PENDING, WorkState.ACTIVE, 0, startTime);

      // Act
      const updatedTodo = todo.updateWorkState(WorkState.PAUSED, endTime);

      // Assert
      expect(updatedTodo.totalWorkTime).toBe(30); // 30 seconds
    });

    it("should start working on todo", () => {
      // Arrange
      const todo = new Todo("test-id", "Test Todo");
      const now = new Date();

      // Act
      const startedTodo = todo.start(now);

      // Assert
      expect(startedTodo.workState).toBe(WorkState.ACTIVE);
      expect(startedTodo.lastStateChangeAt).toBe(now);
    });

    it("should pause working on todo", () => {
      // Arrange
      const startTime = new Date(2025, 0, 1, 10, 0, 0);
      const pauseTime = new Date(2025, 0, 1, 10, 0, 45); // 45 seconds later
      const todo = new Todo("test-id", "Test Todo", TodoStatus.PENDING, WorkState.ACTIVE, 0, startTime);

      // Act
      const pausedTodo = todo.pause(pauseTime);

      // Assert
      expect(pausedTodo.workState).toBe(WorkState.PAUSED);
      expect(pausedTodo.totalWorkTime).toBe(45); // 45 seconds
    });

    it("should update priority", () => {
      // Arrange
      const todo = new Todo("test-id", "Test Todo");

      // Act
      const updatedTodo = todo.updatePriority(PriorityLevel.HIGH);

      // Assert
      expect(updatedTodo.priority).toBe(PriorityLevel.HIGH);
    });

    it("should assign todo to project", () => {
      // Arrange
      const todo = new Todo("test-id", "Test Todo");
      const projectId = "project-1";

      // Act
      const updatedTodo = todo.assignToProject(projectId);

      // Assert
      expect(updatedTodo.projectId).toBe(projectId);
    });

    it("should remove todo from project", () => {
      // Arrange
      const todo = new Todo(
        "test-id",
        "Test Todo",
        TodoStatus.PENDING,
        WorkState.IDLE,
        0,
        new Date(),
        new Date(),
        new Date(),
        PriorityLevel.MEDIUM,
        "project-1",
      );

      // Act
      const updatedTodo = todo.removeFromProject();

      // Assert
      expect(updatedTodo.projectId).toBeUndefined();
    });
  });

  describe("Subtask Management", () => {
    it("should add a subtask", () => {
      // Arrange
      const todo = new Todo("test-id", "Test Todo");
      const subtaskId = "subtask-id";

      // Act
      const updatedTodo = todo.addSubtask(subtaskId);

      // Assert
      expect(updatedTodo.subtaskIds).toContain(subtaskId);
      expect(updatedTodo.subtaskIds.length).toBe(1);
    });

    it("should not add the same subtask twice", () => {
      // Arrange
      const todo = new Todo(
        "test-id",
        "Test Todo",
        TodoStatus.PENDING,
        WorkState.IDLE,
        0,
        new Date(),
        new Date(),
        new Date(),
        PriorityLevel.MEDIUM,
        undefined,
        undefined,
        undefined,
        [],
        [],
        undefined,
        ["subtask-id"],
      );

      // Act
      const updatedTodo = todo.addSubtask("subtask-id");

      // Assert
      expect(updatedTodo).toBe(todo);
      expect(updatedTodo.subtaskIds.length).toBe(1);
    });

    it("should throw error when adding itself as a subtask", () => {
      // Arrange
      const todo = new Todo("test-id", "Test Todo");

      // Act & Assert
      expect(() => todo.addSubtask("test-id")).toThrow("A todo cannot be a subtask of itself");
    });

    it("should remove a subtask", () => {
      // Arrange
      const todo = new Todo(
        "test-id",
        "Test Todo",
        TodoStatus.PENDING,
        WorkState.IDLE,
        0,
        new Date(),
        new Date(),
        new Date(),
        PriorityLevel.MEDIUM,
        undefined,
        undefined,
        undefined,
        [],
        [],
        undefined,
        ["subtask-id", "other-subtask"],
      );

      // Act
      const updatedTodo = todo.removeSubtask("subtask-id");

      // Assert
      expect(updatedTodo.subtaskIds).not.toContain("subtask-id");
      expect(updatedTodo.subtaskIds).toEqual(["other-subtask"]);
      expect(updatedTodo.subtaskIds.length).toBe(1);
    });

    it("should return same instance when removing non-existent subtask", () => {
      // Arrange
      const todo = new Todo("test-id", "Test Todo");

      // Act
      const updatedTodo = todo.removeSubtask("non-existent");

      // Assert
      expect(updatedTodo).toBe(todo);
    });

    it("should set a parent todo", () => {
      // Arrange
      const todo = new Todo("test-id", "Test Todo");
      const parentId = "parent-id";

      // Act
      const updatedTodo = todo.setParent(parentId);

      // Assert
      expect(updatedTodo.parentId).toBe(parentId);
    });

    it("should throw error when setting itself as a parent", () => {
      // Arrange
      const todo = new Todo("test-id", "Test Todo");

      // Act & Assert
      expect(() => todo.setParent("test-id")).toThrow("A todo cannot be a parent of itself");
    });

    it("should remove parent", () => {
      // Arrange
      const todo = new Todo(
        "test-id",
        "Test Todo",
        TodoStatus.PENDING,
        WorkState.IDLE,
        0,
        new Date(),
        new Date(),
        new Date(),
        PriorityLevel.MEDIUM,
        undefined,
        undefined,
        undefined,
        [],
        [],
        "parent-id",
      );

      // Act
      const updatedTodo = todo.removeParent();

      // Assert
      expect(updatedTodo.parentId).toBeUndefined();
    });

    it("should return same instance when removing non-existent parent", () => {
      // Arrange
      const todo = new Todo("test-id", "Test Todo");

      // Act
      const updatedTodo = todo.removeParent();

      // Assert
      expect(updatedTodo).toBe(todo);
    });

    it("should check if all subtasks are completed", () => {
      // Arrange
      const todo = new Todo(
        "test-id",
        "Test Todo",
        TodoStatus.PENDING,
        WorkState.IDLE,
        0,
        new Date(),
        new Date(),
        new Date(),
        PriorityLevel.MEDIUM,
        undefined,
        undefined,
        undefined,
        [],
        [],
        undefined,
        ["subtask-1", "subtask-2"],
      );
      const completedTodoIds = ["subtask-1", "subtask-2"];

      // Act
      const result = todo.areAllSubtasksCompleted(completedTodoIds);

      // Assert
      expect(result).toBe(true);
    });

    it("should return false when not all subtasks are completed", () => {
      // Arrange
      const todo = new Todo(
        "test-id",
        "Test Todo",
        TodoStatus.PENDING,
        WorkState.IDLE,
        0,
        new Date(),
        new Date(),
        new Date(),
        PriorityLevel.MEDIUM,
        undefined,
        undefined,
        undefined,
        [],
        [],
        undefined,
        ["subtask-1", "subtask-2", "subtask-3"],
      );
      const completedTodoIds = ["subtask-1", "subtask-2"];

      // Act
      const result = todo.areAllSubtasksCompleted(completedTodoIds);

      // Assert
      expect(result).toBe(false);
    });

    it("should return true when there are no subtasks", () => {
      // Arrange
      const todo = new Todo("test-id", "Test Todo");
      const completedTodoIds: string[] = [];

      // Act
      const result = todo.areAllSubtasksCompleted(completedTodoIds);

      // Assert
      expect(result).toBe(true);
    });

    it("should check if a todo has a specific subtask", () => {
      // Arrange
      const todo = new Todo(
        "test-id",
        "Test Todo",
        TodoStatus.PENDING,
        WorkState.IDLE,
        0,
        new Date(),
        new Date(),
        new Date(),
        PriorityLevel.MEDIUM,
        undefined,
        undefined,
        undefined,
        [],
        [],
        undefined,
        ["subtask-1", "subtask-2"],
      );

      // Act & Assert
      expect(todo.hasSubtask("subtask-1")).toBe(true);
      expect(todo.hasSubtask("non-existent")).toBe(false);
    });

    it("should check if a todo has a parent", () => {
      // Arrange
      const todoWithParent = new Todo(
        "test-id",
        "Test Todo",
        TodoStatus.PENDING,
        WorkState.IDLE,
        0,
        new Date(),
        new Date(),
        new Date(),
        PriorityLevel.MEDIUM,
        undefined,
        undefined,
        undefined,
        [],
        [],
        "parent-id",
      );
      const todoWithoutParent = new Todo("test-id", "Test Todo");

      // Act & Assert
      expect(todoWithParent.hasParent()).toBe(true);
      expect(todoWithoutParent.hasParent()).toBe(false);
    });

    it("should check if a todo is parent of another todo", () => {
      // Arrange
      const todo = new Todo(
        "test-id",
        "Test Todo",
        TodoStatus.PENDING,
        WorkState.IDLE,
        0,
        new Date(),
        new Date(),
        new Date(),
        PriorityLevel.MEDIUM,
        undefined,
        undefined,
        undefined,
        [],
        [],
        undefined,
        ["subtask-1", "subtask-2"],
      );

      // Act & Assert
      expect(todo.isParentOf("subtask-1")).toBe(true);
      expect(todo.isParentOf("non-existent")).toBe(false);
    });

    it("should check if a todo is child of another todo", () => {
      // Arrange
      const todo = new Todo(
        "test-id",
        "Test Todo",
        TodoStatus.PENDING,
        WorkState.IDLE,
        0,
        new Date(),
        new Date(),
        new Date(),
        PriorityLevel.MEDIUM,
        undefined,
        undefined,
        undefined,
        [],
        [],
        "parent-id",
      );

      // Act & Assert
      expect(todo.isChildOf("parent-id")).toBe(true);
      expect(todo.isChildOf("non-existent")).toBe(false);
    });
  });

  describe("mapToDomainTodo", () => {
    it("should map PrismaTodo to domain Todo with subtasks", () => {
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
        priority: PriorityLevel.HIGH,
        projectId: "project-1",
        dueDate: null,
        parentId: "parent-id",
        subtasks: [
          {
            id: "subtask-1",
            title: "Subtask 1",
            status: "pending",
            workState: "idle",
            totalWorkTime: 0,
            lastStateChangeAt: now,
            createdAt: now,
            updatedAt: now,
            priority: PriorityLevel.MEDIUM,
          },
          {
            id: "subtask-2",
            title: "Subtask 2",
            status: "pending",
            workState: "idle",
            totalWorkTime: 0,
            lastStateChangeAt: now,
            createdAt: now,
            updatedAt: now,
            priority: PriorityLevel.LOW,
          },
        ],
      };

      // Act
      const domainTodo = mapToDomainTodo(prismaTodo);

      // Assert
      expect(domainTodo).toBeInstanceOf(Todo);
      expect(domainTodo.parentId).toBe("parent-id");
      expect(domainTodo.subtaskIds).toEqual(["subtask-1", "subtask-2"]);
    });
  });

  describe("Due Date Features", () => {
    it("should update due date", () => {
      // Arrange
      const todo = new Todo("test-id", "Test Todo");
      const dueDate = new Date(2025, 4, 30); // May 30, 2025

      // Act
      const updatedTodo = todo.updateDueDate(dueDate);

      // Assert
      expect(updatedTodo.dueDate).toEqual(dueDate);
    });

    it("should remove due date when undefined is passed", () => {
      // Arrange
      const dueDate = new Date(2025, 4, 30);
      const todo = new Todo(
        "test-id",
        "Test Todo",
        TodoStatus.PENDING,
        WorkState.IDLE,
        0,
        new Date(),
        new Date(),
        new Date(),
        PriorityLevel.MEDIUM,
        undefined,
        undefined,
        dueDate,
      );

      // Act
      const updatedTodo = todo.updateDueDate(undefined);

      // Assert
      expect(updatedTodo.dueDate).toBeUndefined();
    });

    it("should detect overdue todos", () => {
      // Arrange
      const pastDate = new Date(2025, 3, 1); // April 1, 2025 (past date)
      const currentDate = new Date(2025, 3, 15); // April 15, 2025 (current date)
      const todo = new Todo(
        "test-id",
        "Test Todo",
        TodoStatus.PENDING,
        WorkState.IDLE,
        0,
        new Date(),
        new Date(),
        new Date(),
        PriorityLevel.MEDIUM,
        undefined,
        undefined,
        pastDate,
      );

      // Act & Assert
      expect(todo.isOverdue(currentDate)).toBe(true);
    });

    it("should not detect completed todos as overdue", () => {
      // Arrange
      const pastDate = new Date(2025, 3, 1); // April 1, 2025 (past date)
      const currentDate = new Date(2025, 3, 15); // April 15, 2025 (current date)
      const todo = new Todo(
        "test-id",
        "Test Todo",
        TodoStatus.COMPLETED,
        WorkState.COMPLETED,
        0,
        new Date(),
        new Date(),
        new Date(),
        PriorityLevel.MEDIUM,
        undefined,
        undefined,
        pastDate,
      );

      // Act & Assert
      expect(todo.isOverdue(currentDate)).toBe(false);
    });

    it("should not detect todos without due date as overdue", () => {
      // Arrange
      const todo = new Todo("test-id", "Test Todo");

      // Act & Assert
      expect(todo.isOverdue()).toBe(false);
    });

    it("should detect todos due soon", () => {
      // Arrange
      const currentDate = new Date(2025, 3, 15); // April 15, 2025
      const soonDate = new Date(2025, 3, 16); // April 16, 2025 (1 day later)
      const todo = new Todo(
        "test-id",
        "Test Todo",
        TodoStatus.PENDING,
        WorkState.IDLE,
        0,
        new Date(),
        new Date(),
        new Date(),
        PriorityLevel.MEDIUM,
        undefined,
        undefined,
        soonDate,
      );

      // Act & Assert
      expect(todo.isDueSoon(2, currentDate)).toBe(true);
    });

    it("should not detect completed todos as due soon", () => {
      // Arrange
      const currentDate = new Date(2025, 3, 15); // April 15, 2025
      const soonDate = new Date(2025, 3, 16); // April 16, 2025 (1 day later)
      const todo = new Todo(
        "test-id",
        "Test Todo",
        TodoStatus.COMPLETED,
        WorkState.COMPLETED,
        0,
        new Date(),
        new Date(),
        new Date(),
        PriorityLevel.MEDIUM,
        undefined,
        undefined,
        soonDate,
      );

      // Act & Assert
      expect(todo.isDueSoon(2, currentDate)).toBe(false);
    });

    it("should not detect todos without due date as due soon", () => {
      // Arrange
      const todo = new Todo("test-id", "Test Todo");

      // Act & Assert
      expect(todo.isDueSoon()).toBe(false);
    });

    it("should not detect todos with due date beyond soon threshold", () => {
      // Arrange
      const currentDate = new Date(2025, 3, 15); // April 15, 2025
      const farDate = new Date(2025, 3, 20); // April 20, 2025 (5 days later)
      const todo = new Todo(
        "test-id",
        "Test Todo",
        TodoStatus.PENDING,
        WorkState.IDLE,
        0,
        new Date(),
        new Date(),
        new Date(),
        PriorityLevel.MEDIUM,
        undefined,
        undefined,
        farDate,
      );

      // Act & Assert
      expect(todo.isDueSoon(2, currentDate)).toBe(false); // Not within 2 days
    });
  });
});
