import { describe, expect, it } from "bun:test";
import { createTestTodo } from "./test-helpers";
import { PriorityLevel, Todo, TodoStatus, WorkState, mapToDomainTodo } from "./todo";

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

  describe("Dependency Management", () => {
    it("should add a dependency", () => {
      // Arrange
      const todo = new Todo("test-id", "Test Todo");
      const dependencyId = "dependency-id";

      // Act
      const updatedTodo = todo.addDependency(dependencyId);

      // Assert
      expect(updatedTodo.dependencies).toContain(dependencyId);
      expect(updatedTodo.dependencies.length).toBe(1);
    });

    it("should not add duplicate dependency", () => {
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

    it("should throw error when adding self as dependency", () => {
      // Arrange
      const todo = new Todo("test-id", "Test Todo");

      // Act & Assert
      expect(() => todo.addDependency("test-id")).toThrow("A todo cannot depend on itself");
    });

    it("should remove a dependency", () => {
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

    it("should return same instance when removing non-existent dependency", () => {
      // Arrange
      const todo = new Todo("test-id", "Test Todo");

      // Act
      const updatedTodo = todo.removeDependency("non-existent");

      // Assert
      expect(updatedTodo).toBe(todo);
    });

    it("should add a dependent", () => {
      // Arrange
      const todo = new Todo("test-id", "Test Todo");
      const dependentId = "dependent-id";

      // Act
      const updatedTodo = todo.addDependent(dependentId);

      // Assert
      expect(updatedTodo.dependents).toContain(dependentId);
      expect(updatedTodo.dependents.length).toBe(1);
    });

    it("should not add duplicate dependent", () => {
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

    it("should throw error when adding self as dependent", () => {
      // Arrange
      const todo = new Todo("test-id", "Test Todo");

      // Act & Assert
      expect(() => todo.addDependent("test-id")).toThrow("A todo cannot depend on itself");
    });

    it("should remove a dependent", () => {
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

    it("should return same instance when removing non-existent dependent", () => {
      // Arrange
      const todo = new Todo("test-id", "Test Todo");

      // Act
      const updatedTodo = todo.removeDependent("non-existent");

      // Assert
      expect(updatedTodo).toBe(todo);
    });

    it("should check if todo has dependency on another todo", () => {
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

    it("should check if todo has dependent", () => {
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

    it("should check if todo can be completed when all dependencies are completed", () => {
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

    it("should check if todo can be completed when some dependencies are not completed", () => {
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

    it("should check if todo can be completed when there are no dependencies", () => {
      // Arrange
      const todo = new Todo("test-id", "Test Todo");

      // Act & Assert
      expect(todo.canBeCompleted([])).toBe(true);
    });
  });

  describe("mapToDomainTodo", () => {
    it("should map prisma todo to domain todo with dependencies", () => {
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
        dueDate: null, // dueDate フィールドを追加
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

    it("should map prisma todo to domain todo", () => {
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

    it("should handle null description", () => {
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
        dueDate: null,
      };

      // Act
      const domainTodo = mapToDomainTodo(prismaTodo);

      // Assert
      expect(domainTodo.description).toBeUndefined();
      expect(domainTodo.projectId).toBeUndefined();
    });
  });

  describe("Due Date Features", () => {
    it("should update due date", () => {
      // Arrange
      const todo = new Todo("test-id", "Test Todo");
      const dueDate = new Date(2025, 4, 30); // 2025年5月30日

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
      const pastDate = new Date(2025, 3, 1); // 2025年4月1日 (過去の日付)
      const currentDate = new Date(2025, 3, 15); // 2025年4月15日 (現在の日付)
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
      const pastDate = new Date(2025, 3, 1); // 2025年4月1日 (過去の日付)
      const currentDate = new Date(2025, 3, 15); // 2025年4月15日 (現在の日付)
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
      const currentDate = new Date(2025, 3, 15); // 2025年4月15日
      const soonDate = new Date(2025, 3, 16); // 2025年4月16日 (1日後)
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
      const currentDate = new Date(2025, 3, 15); // 2025年4月15日
      const soonDate = new Date(2025, 3, 16); // 2025年4月16日 (1日後)
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
      const currentDate = new Date(2025, 3, 15); // 2025年4月15日
      const farDate = new Date(2025, 3, 20); // 2025年4月20日 (5日後)
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
      expect(todo.isDueSoon(2, currentDate)).toBe(false); // 2日以内ではない
    });
  });
});
