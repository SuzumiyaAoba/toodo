export class TaskNotFoundError extends Error {
	constructor(taskId: string) {
		super(`Task ${taskId} not found`);
		this.name = "TaskNotFoundError";
	}
}

export class ParentTaskNotFoundError extends Error {
	constructor(parentId: string) {
		super(`Parent task ${parentId} not found`);
		this.name = "ParentTaskNotFoundError";
	}
}

export class CircularReferenceError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "CircularReferenceError";
	}
}

export class SelfReferenceError extends Error {
	constructor(taskId: string) {
		super(`Cannot set a task as its own parent: ${taskId}`);
		this.name = "SelfReferenceError";
	}
}

export class InvalidOrderError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "InvalidOrderError";
	}
}
