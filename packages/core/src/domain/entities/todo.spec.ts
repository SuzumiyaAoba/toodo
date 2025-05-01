import { describe, expect, test } from "bun:test";
import { PriorityLevel, Todo, TodoStatus, WorkState } from "./todo";

describe("Todo", () => {
  const todoId = "test-todo-id";
  const title = "Test Todo";
  const description = "Test description";
  const now = new Date();

  test("should create a new Todo instance", () => {
    const todo = new Todo(todoId, title, TodoStatus.PENDING, WorkState.IDLE, 0, now, now, now);

    expect(todo.id).toBe(todoId);
    expect(todo.title).toBe(title);
    expect(todo.status).toBe(TodoStatus.PENDING);
    expect(todo.workState).toBe(WorkState.IDLE);
    expect(todo.totalWorkTime).toBe(0);
    expect(todo.lastStateChangeAt).toBe(now);
  });

  test("should create a new Todo with default values", () => {
    const todo = new Todo(todoId, title);

    expect(todo.id).toBe(todoId);
    expect(todo.title).toBe(title);
    expect(todo.status).toBe(TodoStatus.PENDING);
    expect(todo.workState).toBe(WorkState.IDLE);
    expect(todo.totalWorkTime).toBe(0);
    expect(todo.priority).toBe(PriorityLevel.MEDIUM);
    expect(todo.dependencies).toEqual([]);
    expect(todo.dependents).toEqual([]);
    expect(todo.subtaskIds).toEqual([]);
  });

  test("should update title", () => {
    const todo = new Todo(todoId, title);
    const newTitle = "Updated Title";
    const updatedTodo = todo.updateTitle(newTitle);

    expect(updatedTodo.id).toBe(todoId);
    expect(updatedTodo.title).toBe(newTitle);
    expect(updatedTodo.updatedAt).not.toBe(todo.updatedAt);
  });

  test("should not update title if it's the same", () => {
    const todo = new Todo(todoId, title);
    const updatedTodo = todo.updateTitle(title);

    expect(updatedTodo).toBe(todo); // Should return the same instance
  });

  test("should update description", () => {
    const todo = new Todo(
      todoId,
      title,
      TodoStatus.PENDING,
      WorkState.IDLE,
      0,
      now,
      now,
      now,
      PriorityLevel.MEDIUM,
      undefined,
      description,
    );
    const newDescription = "Updated description";
    const updatedTodo = todo.updateDescription(newDescription);

    expect(updatedTodo.id).toBe(todoId);
    expect(updatedTodo.description).toBe(newDescription);
    expect(updatedTodo.updatedAt).not.toBe(todo.updatedAt);
  });

  test("should not update description if it's the same", () => {
    const todo = new Todo(
      todoId,
      title,
      TodoStatus.PENDING,
      WorkState.IDLE,
      0,
      now,
      now,
      now,
      PriorityLevel.MEDIUM,
      undefined,
      description,
    );
    const updatedTodo = todo.updateDescription(description);

    expect(updatedTodo).toBe(todo); // Should return the same instance
  });

  test("should update status", () => {
    const todo = new Todo(todoId, title);
    const updatedTodo = todo.updateStatus(TodoStatus.IN_PROGRESS);

    expect(updatedTodo.id).toBe(todoId);
    expect(updatedTodo.status).toBe(TodoStatus.IN_PROGRESS);
    expect(updatedTodo.updatedAt).not.toBe(todo.updatedAt);
  });

  test("should not update status if it's the same", () => {
    const todo = new Todo(todoId, title);
    const updatedTodo = todo.updateStatus(TodoStatus.PENDING);

    expect(updatedTodo).toBe(todo); // Should return the same instance
  });

  test("should complete a todo", () => {
    const todo = new Todo(todoId, title);
    const completedTodo = todo.complete();

    expect(completedTodo.id).toBe(todoId);
    expect(completedTodo.status).toBe(TodoStatus.COMPLETED);
    expect(completedTodo.workState).toBe(WorkState.COMPLETED);
    expect(completedTodo.updatedAt).not.toBe(todo.updatedAt);
  });

  test("should not change a todo that is already completed", () => {
    const todo = new Todo(todoId, title, TodoStatus.COMPLETED, WorkState.COMPLETED);
    const completedTodo = todo.complete();

    expect(completedTodo).toBe(todo); // Should return the same instance
  });

  test("should reopen a completed todo", () => {
    const todo = new Todo(todoId, title, TodoStatus.COMPLETED, WorkState.COMPLETED);
    const reopenedTodo = todo.reopen();

    expect(reopenedTodo.id).toBe(todoId);
    expect(reopenedTodo.status).toBe(TodoStatus.PENDING);
    expect(reopenedTodo.workState).toBe(WorkState.IDLE);
    expect(reopenedTodo.updatedAt).not.toBe(todo.updatedAt);
  });

  test("should not change a todo that is already pending", () => {
    const todo = new Todo(todoId, title);
    const reopenedTodo = todo.reopen();

    expect(reopenedTodo).toBe(todo); // Should return the same instance
  });

  test("should update work state", () => {
    const todo = new Todo(todoId, title);
    const changedAt = new Date(now.getTime() + 3600000); // 1 hour later
    const updatedTodo = todo.updateWorkState(WorkState.ACTIVE, changedAt);

    expect(updatedTodo.id).toBe(todoId);
    expect(updatedTodo.workState).toBe(WorkState.ACTIVE);
    expect(updatedTodo.lastStateChangeAt).toBe(changedAt);
    expect(updatedTodo.updatedAt).not.toBe(todo.updatedAt);
  });

  test("should not update work state if it's the same and time is the same", () => {
    const todo = new Todo(todoId, title, TodoStatus.PENDING, WorkState.IDLE, 0, now);
    const updatedTodo = todo.updateWorkState(WorkState.IDLE, now);

    expect(updatedTodo).toBe(todo); // Should return the same instance
  });

  test("should calculate work time when changing from ACTIVE to another state", () => {
    const startTime = new Date();
    const todo = new Todo(todoId, title, TodoStatus.IN_PROGRESS, WorkState.ACTIVE, 0, startTime);

    // Simulate 1 hour of work
    const endTime = new Date(startTime.getTime() + 3600000); // 1 hour later
    const updatedTodo = todo.updateWorkState(WorkState.PAUSED, endTime);

    expect(updatedTodo.totalWorkTime).toBe(3600); // 3600 seconds = 1 hour
  });

  test("should start a todo", () => {
    const todo = new Todo(todoId, title);
    const startTime = new Date(now.getTime() + 3600000); // 1 hour later
    const startedTodo = todo.start(startTime);

    expect(startedTodo.id).toBe(todoId);
    expect(startedTodo.workState).toBe(WorkState.ACTIVE);
    expect(startedTodo.lastStateChangeAt).toBe(startTime);
    expect(startedTodo.updatedAt).not.toBe(todo.updatedAt);
  });

  test("should not start a todo that is already active", () => {
    const todo = new Todo(todoId, title, TodoStatus.IN_PROGRESS, WorkState.ACTIVE, 0, now);
    const startTime = new Date(now.getTime() + 3600000); // 1 hour later
    const startedTodo = todo.start(startTime);

    expect(startedTodo).toBe(todo); // Should return the same instance
  });

  test("should pause an active todo", () => {
    const todo = new Todo(todoId, title, TodoStatus.IN_PROGRESS, WorkState.ACTIVE, 0, now);
    const pauseTime = new Date(now.getTime() + 3600000); // 1 hour later
    const pausedTodo = todo.pause(pauseTime);

    expect(pausedTodo.id).toBe(todoId);
    expect(pausedTodo.workState).toBe(WorkState.PAUSED);
    expect(pausedTodo.lastStateChangeAt).toBe(pauseTime);
    expect(pausedTodo.totalWorkTime).toBe(3600); // 3600 seconds = 1 hour
    expect(pausedTodo.updatedAt).not.toBe(todo.updatedAt);
  });

  test("should not pause a todo that is not active", () => {
    const todo = new Todo(todoId, title);
    const pauseTime = new Date(now.getTime() + 3600000); // 1 hour later
    const pausedTodo = todo.pause(pauseTime);

    expect(pausedTodo).toBe(todo); // Should return the same instance
  });

  test("should update priority", () => {
    const todo = new Todo(todoId, title);
    const updatedTodo = todo.updatePriority(PriorityLevel.HIGH);

    expect(updatedTodo.id).toBe(todoId);
    expect(updatedTodo.priority).toBe(PriorityLevel.HIGH);
    expect(updatedTodo.updatedAt).not.toBe(todo.updatedAt);
  });

  test("should not update priority if it's the same", () => {
    const todo = new Todo(todoId, title);
    const updatedTodo = todo.updatePriority(PriorityLevel.MEDIUM);

    expect(updatedTodo).toBe(todo); // Should return the same instance
  });

  test("should assign to project", () => {
    const todo = new Todo(todoId, title);
    const projectId = "test-project-id";
    const updatedTodo = todo.assignToProject(projectId);

    expect(updatedTodo.id).toBe(todoId);
    expect(updatedTodo.projectId).toBe(projectId);
    expect(updatedTodo.updatedAt).not.toBe(todo.updatedAt);
  });

  test("should not assign to project if it's the same", () => {
    const projectId = "test-project-id";
    const todo = new Todo(
      todoId,
      title,
      TodoStatus.PENDING,
      WorkState.IDLE,
      0,
      now,
      now,
      now,
      PriorityLevel.MEDIUM,
      projectId,
    );
    const updatedTodo = todo.assignToProject(projectId);

    expect(updatedTodo).toBe(todo); // Should return the same instance
  });

  test("should remove from project", () => {
    const projectId = "test-project-id";
    const todo = new Todo(
      todoId,
      title,
      TodoStatus.PENDING,
      WorkState.IDLE,
      0,
      now,
      now,
      now,
      PriorityLevel.MEDIUM,
      projectId,
    );
    const updatedTodo = todo.removeFromProject();

    expect(updatedTodo.id).toBe(todoId);
    expect(updatedTodo.projectId).toBeUndefined();
    expect(updatedTodo.updatedAt).not.toBe(todo.updatedAt);
  });

  test("should not remove from project if not assigned", () => {
    const todo = new Todo(todoId, title);
    const updatedTodo = todo.removeFromProject();

    expect(updatedTodo).toBe(todo); // Should return the same instance
  });

  test("should add subtask", () => {
    const todo = new Todo(todoId, title);
    const subtaskId = "subtask-id";
    const updatedTodo = todo.addSubtask(subtaskId);

    expect(updatedTodo.id).toBe(todoId);
    expect(updatedTodo.subtaskIds).toContain(subtaskId);
    expect(updatedTodo.updatedAt).not.toBe(todo.updatedAt);
  });

  test("should throw error when adding itself as subtask", () => {
    const todo = new Todo(todoId, title);

    expect(() => {
      todo.addSubtask(todoId);
    }).toThrow("A todo cannot be a subtask of itself");
  });

  test("should not add subtask if it's already added", () => {
    const subtaskId = "subtask-id";
    const todo = new Todo(
      todoId,
      title,
      TodoStatus.PENDING,
      WorkState.IDLE,
      0,
      now,
      now,
      now,
      PriorityLevel.MEDIUM,
      undefined,
      undefined,
      undefined,
      [],
      [],
      undefined,
      [subtaskId],
    );
    const updatedTodo = todo.addSubtask(subtaskId);

    expect(updatedTodo).toBe(todo); // Should return the same instance
  });

  test("should remove subtask", () => {
    const subtaskId = "subtask-id";
    const todo = new Todo(
      todoId,
      title,
      TodoStatus.PENDING,
      WorkState.IDLE,
      0,
      now,
      now,
      now,
      PriorityLevel.MEDIUM,
      undefined,
      undefined,
      undefined,
      [],
      [],
      undefined,
      [subtaskId],
    );
    const updatedTodo = todo.removeSubtask(subtaskId);

    expect(updatedTodo.id).toBe(todoId);
    expect(updatedTodo.subtaskIds).not.toContain(subtaskId);
    expect(updatedTodo.updatedAt).not.toBe(todo.updatedAt);
  });

  test("should not remove subtask if it's not a subtask", () => {
    const todo = new Todo(todoId, title);
    const subtaskId = "subtask-id";
    const updatedTodo = todo.removeSubtask(subtaskId);

    expect(updatedTodo).toBe(todo); // Should return the same instance
  });

  test("should set parent", () => {
    const todo = new Todo(todoId, title);
    const parentId = "parent-id";
    const updatedTodo = todo.setParent(parentId);

    expect(updatedTodo.id).toBe(todoId);
    expect(updatedTodo.parentId).toBe(parentId);
    expect(updatedTodo.updatedAt).not.toBe(todo.updatedAt);
  });

  test("should throw error when setting itself as parent", () => {
    const todo = new Todo(todoId, title);

    expect(() => {
      todo.setParent(todoId);
    }).toThrow("A todo cannot be a parent of itself");
  });

  test("should not set parent if it's the same", () => {
    const parentId = "parent-id";
    const todo = new Todo(
      todoId,
      title,
      TodoStatus.PENDING,
      WorkState.IDLE,
      0,
      now,
      now,
      now,
      PriorityLevel.MEDIUM,
      undefined,
      undefined,
      undefined,
      [],
      [],
      parentId,
    );
    const updatedTodo = todo.setParent(parentId);

    expect(updatedTodo).toBe(todo); // Should return the same instance
  });

  test("should remove parent", () => {
    const parentId = "parent-id";
    const todo = new Todo(
      todoId,
      title,
      TodoStatus.PENDING,
      WorkState.IDLE,
      0,
      now,
      now,
      now,
      PriorityLevel.MEDIUM,
      undefined,
      undefined,
      undefined,
      [],
      [],
      parentId,
    );
    const updatedTodo = todo.removeParent();

    expect(updatedTodo.id).toBe(todoId);
    expect(updatedTodo.parentId).toBeUndefined();
    expect(updatedTodo.updatedAt).not.toBe(todo.updatedAt);
  });

  test("should not remove parent if not set", () => {
    const todo = new Todo(todoId, title);
    const updatedTodo = todo.removeParent();

    expect(updatedTodo).toBe(todo); // Should return the same instance
  });

  test("should check if all subtasks are completed", () => {
    const subtask1Id = "subtask-1";
    const subtask2Id = "subtask-2";
    const todo = new Todo(
      todoId,
      title,
      TodoStatus.PENDING,
      WorkState.IDLE,
      0,
      now,
      now,
      now,
      PriorityLevel.MEDIUM,
      undefined,
      undefined,
      undefined,
      [],
      [],
      undefined,
      [subtask1Id, subtask2Id],
    );

    expect(todo.areAllSubtasksCompleted([subtask1Id, subtask2Id])).toBe(true);
    expect(todo.areAllSubtasksCompleted([subtask1Id])).toBe(false);
    expect(todo.areAllSubtasksCompleted([])).toBe(false);
  });

  test("should check if has subtask", () => {
    const subtaskId = "subtask-id";
    const todo = new Todo(
      todoId,
      title,
      TodoStatus.PENDING,
      WorkState.IDLE,
      0,
      now,
      now,
      now,
      PriorityLevel.MEDIUM,
      undefined,
      undefined,
      undefined,
      [],
      [],
      undefined,
      [subtaskId],
    );

    expect(todo.hasSubtask(subtaskId)).toBe(true);
    expect(todo.hasSubtask("non-existent")).toBe(false);
  });

  test("should check if has parent", () => {
    const parentId = "parent-id";
    const todoWithParent = new Todo(
      todoId,
      title,
      TodoStatus.PENDING,
      WorkState.IDLE,
      0,
      now,
      now,
      now,
      PriorityLevel.MEDIUM,
      undefined,
      undefined,
      undefined,
      [],
      [],
      parentId,
    );
    const todoWithoutParent = new Todo(todoId, title);

    expect(todoWithParent.hasParent()).toBe(true);
    expect(todoWithoutParent.hasParent()).toBe(false);
  });

  test("should check if is parent of", () => {
    const subtaskId = "subtask-id";
    const todo = new Todo(
      todoId,
      title,
      TodoStatus.PENDING,
      WorkState.IDLE,
      0,
      now,
      now,
      now,
      PriorityLevel.MEDIUM,
      undefined,
      undefined,
      undefined,
      [],
      [],
      undefined,
      [subtaskId],
    );

    expect(todo.isParentOf(subtaskId)).toBe(true);
    expect(todo.isParentOf("non-existent")).toBe(false);
  });

  test("should check if is child of", () => {
    const parentId = "parent-id";
    const todo = new Todo(
      todoId,
      title,
      TodoStatus.PENDING,
      WorkState.IDLE,
      0,
      now,
      now,
      now,
      PriorityLevel.MEDIUM,
      undefined,
      undefined,
      undefined,
      [],
      [],
      parentId,
    );

    expect(todo.isChildOf(parentId)).toBe(true);
    expect(todo.isChildOf("non-existent")).toBe(false);
  });

  test("should update due date", () => {
    const todo = new Todo(todoId, title);
    const dueDate = new Date(now.getTime() + 86400000); // Tomorrow
    const updatedTodo = todo.updateDueDate(dueDate);

    expect(updatedTodo.id).toBe(todoId);
    expect(updatedTodo.dueDate).toBe(dueDate);
    expect(updatedTodo.updatedAt).not.toBe(todo.updatedAt);
  });

  test("should not update due date if it's the same", () => {
    const dueDate = new Date(now.getTime() + 86400000); // Tomorrow
    const todo = new Todo(
      todoId,
      title,
      TodoStatus.PENDING,
      WorkState.IDLE,
      0,
      now,
      now,
      now,
      PriorityLevel.MEDIUM,
      undefined,
      undefined,
      dueDate,
    );
    const updatedTodo = todo.updateDueDate(dueDate);

    expect(updatedTodo).toBe(todo); // Should return the same instance
  });

  test("should check if todo is overdue", () => {
    const pastDate = new Date(now.getTime() - 86400000); // Yesterday
    const futureDate = new Date(now.getTime() + 86400000); // Tomorrow

    const overdueTodo = new Todo(
      todoId,
      title,
      TodoStatus.PENDING,
      WorkState.IDLE,
      0,
      now,
      now,
      now,
      PriorityLevel.MEDIUM,
      undefined,
      undefined,
      pastDate,
    );
    const notOverdueTodo = new Todo(
      todoId,
      title,
      TodoStatus.PENDING,
      WorkState.IDLE,
      0,
      now,
      now,
      now,
      PriorityLevel.MEDIUM,
      undefined,
      undefined,
      futureDate,
    );
    const completedOverdueTodo = new Todo(
      todoId,
      title,
      TodoStatus.COMPLETED,
      WorkState.COMPLETED,
      0,
      now,
      now,
      now,
      PriorityLevel.MEDIUM,
      undefined,
      undefined,
      pastDate,
    );

    expect(overdueTodo.isOverdue(now)).toBe(true);
    expect(notOverdueTodo.isOverdue(now)).toBe(false);
    expect(completedOverdueTodo.isOverdue(now)).toBe(false); // Completed todos are never overdue
  });

  test("should check if todo is due soon", () => {
    const veryCloseDate = new Date(now.getTime() + 3600000); // 1 hour from now
    const soonDate = new Date(now.getTime() + 86400000); // 1 day from now
    const farDate = new Date(now.getTime() + 86400000 * 5); // 5 days from now

    const veryCloseTodo = new Todo(
      todoId,
      title,
      TodoStatus.PENDING,
      WorkState.IDLE,
      0,
      now,
      now,
      now,
      PriorityLevel.MEDIUM,
      undefined,
      undefined,
      veryCloseDate,
    );
    const soonTodo = new Todo(
      todoId,
      title,
      TodoStatus.PENDING,
      WorkState.IDLE,
      0,
      now,
      now,
      now,
      PriorityLevel.MEDIUM,
      undefined,
      undefined,
      soonDate,
    );
    const farTodo = new Todo(
      todoId,
      title,
      TodoStatus.PENDING,
      WorkState.IDLE,
      0,
      now,
      now,
      now,
      PriorityLevel.MEDIUM,
      undefined,
      undefined,
      farDate,
    );
    const completedSoonTodo = new Todo(
      todoId,
      title,
      TodoStatus.COMPLETED,
      WorkState.COMPLETED,
      0,
      now,
      now,
      now,
      PriorityLevel.MEDIUM,
      undefined,
      undefined,
      soonDate,
    );

    expect(veryCloseTodo.isDueSoon(2, now)).toBe(true);
    expect(soonTodo.isDueSoon(2, now)).toBe(true);
    expect(farTodo.isDueSoon(2, now)).toBe(false);
    expect(completedSoonTodo.isDueSoon(2, now)).toBe(false); // Completed todos are never due soon
  });

  test("should check if todo has dependency on another todo", () => {
    const dependencyId = "dependency-id";
    const todo = new Todo(
      todoId,
      title,
      TodoStatus.PENDING,
      WorkState.IDLE,
      0,
      now,
      now,
      now,
      PriorityLevel.MEDIUM,
      undefined,
      undefined,
      undefined,
      [dependencyId],
    );

    expect(todo.hasDependencyOn(dependencyId)).toBe(true);
    expect(todo.hasDependencyOn("non-existent")).toBe(false);
  });

  test("should create a new Todo using static factory method", () => {
    const todo = Todo.createNew({
      id: todoId,
      title,
      description,
      status: TodoStatus.IN_PROGRESS,
      priority: PriorityLevel.HIGH,
    });

    expect(todo.id).toBe(todoId);
    expect(todo.title).toBe(title);
    expect(todo.description).toBe(description);
    expect(todo.status).toBe(TodoStatus.IN_PROGRESS);
    expect(todo.priority).toBe(PriorityLevel.HIGH);
  });
});
