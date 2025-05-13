import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { createTestTodo, jest } from "./test-helpers";
import { PriorityLevel, Todo, TodoStatus, WorkState, mapToDomainTodo } from "./todo";

describe("Todo Entity", () => {
  describe("Todo Class", () => {
    test("should create a todo with default values", () => {
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
    });

    test("should update title", () => {
      // Arrange
      const todo = new Todo("test-id", "Test Todo");

      // Act
      const updatedTodo = todo.updateTitle("Updated Title");

      // Assert
      expect(updatedTodo.id).toBe("test-id");
      expect(updatedTodo.title).toBe("Updated Title");
    });

    test("should update description", () => {
      // Arrange
      const todo = new Todo("test-id", "Test Todo");

      // Act
      const updatedTodo = todo.updateDescription("Updated Description");

      // Assert
      expect(updatedTodo.description).toBe("Updated Description");
    });

    test("should update status", () => {
      // Arrange
      const todo = new Todo("test-id", "Test Todo");

      // Act
      const updatedTodo = todo.updateStatus(TodoStatus.COMPLETED);

      // Assert
      expect(updatedTodo.status).toBe(TodoStatus.COMPLETED);
    });

    test("should mark todo as completed", () => {
      // Arrange
      const todo = new Todo("test-id", "Test Todo");

      // Act
      const completedTodo = todo.complete();

      // Assert
      expect(completedTodo.status).toBe(TodoStatus.COMPLETED);
      expect(completedTodo.workState).toBe(WorkState.COMPLETED);
    });

    test("should mark todo as pending", () => {
      // Arrange
      const todo = new Todo("test-id", "Test Todo", TodoStatus.COMPLETED, WorkState.COMPLETED);

      // Act
      const reopenedTodo = todo.reopen();

      // Assert
      expect(reopenedTodo.status).toBe(TodoStatus.PENDING);
      expect(reopenedTodo.workState).toBe(WorkState.IDLE);
    });

    test("should update work state", () => {
      // Arrange
      const todo = new Todo("test-id", "Test Todo");
      const now = new Date();

      // Act
      const updatedTodo = todo.updateWorkState(WorkState.ACTIVE, now);

      // Assert
      expect(updatedTodo.workState).toBe(WorkState.ACTIVE);
      expect(updatedTodo.lastStateChangeAt).toBe(now);
    });

    test("should calculate work time when transitioning from active state", () => {
      // Arrange
      const startTime = new Date(2025, 0, 1, 10, 0, 0);
      const endTime = new Date(2025, 0, 1, 10, 0, 30); // 30 seconds later
      const todo = new Todo("test-id", "Test Todo", TodoStatus.PENDING, WorkState.ACTIVE, 0, startTime);

      // Act
      const updatedTodo = todo.updateWorkState(WorkState.PAUSED, endTime);

      // Assert
      expect(updatedTodo.totalWorkTime).toBe(30); // 30 seconds
    });

    test("should start working on todo", () => {
      // Arrange
      const todo = new Todo("test-id", "Test Todo");
      const now = new Date();

      // Act
      const startedTodo = todo.start(now);

      // Assert
      expect(startedTodo.workState).toBe(WorkState.ACTIVE);
      expect(startedTodo.lastStateChangeAt).toBe(now);
    });

    test("should pause working on todo", () => {
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

    test("should update priority", () => {
      // Arrange
      const todo = new Todo("test-id", "Test Todo");

      // Act
      const updatedTodo = todo.updatePriority(PriorityLevel.HIGH);

      // Assert
      expect(updatedTodo.priority).toBe(PriorityLevel.HIGH);
    });

    test("should assign todo to project", () => {
      // Arrange
      const todo = new Todo("test-id", "Test Todo");
      const projectId = "project-1";

      // Act
      const updatedTodo = todo.assignToProject(projectId);

      // Assert
      expect(updatedTodo.projectId).toBe(projectId);
    });

    test("should remove todo from project", () => {
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

  describe("Dependency Management", () => {
    test("should add a dependency", () => {
      // Arrange
      const todo = new Todo("test-id", "Test Todo");
      const dependencyId = "dependency-id";

      // Act
      const updatedTodo = todo.addDependency(dependencyId);

      // Assert
      expect(updatedTodo.dependencies).toContain(dependencyId);
      expect(updatedTodo.dependencies.length).toBe(1);
    });

    test("should not add duplicate dependency", () => {
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
        ["dependency-id"],
      );
      const dependencyId = "dependency-id";

      // Act
      const updatedTodo = todo.addDependency(dependencyId);

      // Assert
      expect(updatedTodo.dependencies).toEqual(["dependency-id"]);
      expect(updatedTodo.dependencies.length).toBe(1);
    });

    test("should throw error when adding self as dependency", () => {
      // Arrange
      const todo = new Todo("test-id", "Test Todo");

      // Act & Assert
      expect(() => todo.addDependency("test-id")).toThrow("A todo cannot depend on itself");
    });

    test("should remove a dependency", () => {
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
        ["dependency-id", "other-dependency"],
      );

      // Act
      const updatedTodo = todo.removeDependency("dependency-id");

      // Assert
      expect(updatedTodo.dependencies).not.toContain("dependency-id");
      expect(updatedTodo.dependencies).toEqual(["other-dependency"]);
      expect(updatedTodo.dependencies.length).toBe(1);
    });

    test("should return same instance when removing non-existent dependency", () => {
      // Arrange
      const todo = new Todo("test-id", "Test Todo");

      // Act
      const updatedTodo = todo.removeDependency("non-existent");

      // Assert
      expect(updatedTodo).toBe(todo);
    });

    test("should add a dependent", () => {
      // Arrange
      const todo = new Todo("test-id", "Test Todo");
      const dependentId = "dependent-id";

      // Act
      const updatedTodo = todo.addDependent(dependentId);

      // Assert
      expect(updatedTodo.dependents).toContain(dependentId);
      expect(updatedTodo.dependents.length).toBe(1);
    });

    test("should not add duplicate dependent", () => {
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
        [],
        ["dependent-id"],
      );
      const dependentId = "dependent-id";

      // Act
      const updatedTodo = todo.addDependent(dependentId);

      // Assert
      expect(updatedTodo.dependents).toEqual(["dependent-id"]);
      expect(updatedTodo.dependents.length).toBe(1);
    });

    test("should throw error when adding self as dependent", () => {
      // Arrange
      const todo = new Todo("test-id", "Test Todo");

      // Act & Assert
      expect(() => todo.addDependent("test-id")).toThrow("A todo cannot depend on itself");
    });

    test("should remove a dependent", () => {
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
        [],
        ["dependent-id", "other-dependent"],
      );

      // Act
      const updatedTodo = todo.removeDependent("dependent-id");

      // Assert
      expect(updatedTodo.dependents).not.toContain("dependent-id");
      expect(updatedTodo.dependents).toEqual(["other-dependent"]);
      expect(updatedTodo.dependents.length).toBe(1);
    });

    test("should return same instance when removing non-existent dependent", () => {
      // Arrange
      const todo = new Todo("test-id", "Test Todo");

      // Act
      const updatedTodo = todo.removeDependent("non-existent");

      // Assert
      expect(updatedTodo).toBe(todo);
    });

    test("should check if todo has dependency on another todo", () => {
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
        ["dependency-id"],
      );

      // Act & Assert
      expect(todo.hasDependencyOn("dependency-id")).toBe(true);
      expect(todo.hasDependencyOn("non-existent")).toBe(false);
    });

    test("should check if todo has dependent", () => {
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
        [],
        ["dependent-id"],
      );

      // Act & Assert
      expect(todo.hasDependent("dependent-id")).toBe(true);
      expect(todo.hasDependent("non-existent")).toBe(false);
    });

    test("should check if todo can be completed when all dependencies are completed", () => {
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
        ["dependency-1", "dependency-2"],
      );
      const completedTodoIds = ["dependency-1", "dependency-2"];

      // Act & Assert
      expect(todo.canBeCompleted(completedTodoIds)).toBe(true);
    });

    test("should check if todo can be completed when some dependencies are not completed", () => {
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
        ["dependency-1", "dependency-2"],
      );
      const completedTodoIds = ["dependency-1"];

      // Act & Assert
      expect(todo.canBeCompleted(completedTodoIds)).toBe(false);
    });

    test("should check if todo can be completed when there are no dependencies", () => {
      // Arrange
      const todo = new Todo("test-id", "Test Todo");

      // Act & Assert
      expect(todo.canBeCompleted([])).toBe(true);
    });
  });

  describe("mapToDomainTodo", () => {
    test("should map prisma todo to domain todo with dependencies", () => {
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
        dependsOn: [{ dependencyId: "dep-1" }, { dependencyId: "dep-2" }],
        dependents: [{ dependentId: "depnt-1" }],
      };

      // Act
      const domainTodo = mapToDomainTodo(prismaTodo);

      // Assert
      expect(domainTodo).toBeInstanceOf(Todo);
      expect(domainTodo.id).toBe("test-id");
      expect(domainTodo.dependencies).toEqual(["dep-1", "dep-2"]);
      expect(domainTodo.dependents).toEqual(["depnt-1"]);
    });

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
        priority: PriorityLevel.HIGH,
        projectId: "project-1",
      };

      // Act
      const domainTodo = mapToDomainTodo(prismaTodo);

      // Assert
      expect(domainTodo).toBeInstanceOf(Todo);
      expect(domainTodo.id).toBe("test-id");
      expect(domainTodo.title).toBe("Test Todo");
      expect(domainTodo.description).toBe("Test description");
      expect(domainTodo.status).toBe(TodoStatus.PENDING);
      expect(domainTodo.workState).toBe(WorkState.IDLE);
      expect(domainTodo.totalWorkTime).toBe(0);
      expect(domainTodo.lastStateChangeAt).toBe(now);
      expect(domainTodo.createdAt).toBe(now);
      expect(domainTodo.updatedAt).toBe(now);
      expect(domainTodo.priority).toBe(PriorityLevel.HIGH);
      expect(domainTodo.projectId).toBe("project-1");
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
        priority: PriorityLevel.MEDIUM,
        projectId: null,
      };

      // Act
      const domainTodo = mapToDomainTodo(prismaTodo);

      // Assert
      expect(domainTodo.description).toBeUndefined();
      expect(domainTodo.projectId).toBeUndefined();
    });
  });
});
