import { v4 as uuidv4 } from "uuid";

export type TaskStatus = "completed" | "incomplete";

/**
 * Task domain model
 * Represents a task in the system with immutable properties
 */
export type Task = Readonly<{
	id: string;
	parentId: string | null;
	title: string;
	description: string | null;
	status: TaskStatus;
	order: number;
	createdAt: Date;
	updatedAt: Date;
	subtasks: readonly Task[];
}>;

/**
 * Task namespace containing all operations for the Task domain model
 * Following record-oriented design pattern with pure functions
 */
export namespace Task {
	/**
	 * Create a new Task with validation
	 */
	export function create(
		title: string,
		parentId: string | null = null,
		description: string | null = null,
		id?: string,
		status: TaskStatus = "incomplete",
		order = 1,
		createdAt?: Date,
		updatedAt?: Date,
		subtasks: readonly Task[] = [],
	): Task {
		validateTitle(title);
		validateOrder(order);
		validateStatus(status);

		return {
			id: id || uuidv4(),
			parentId,
			title,
			description,
			status,
			order,
			createdAt: createdAt || new Date(),
			updatedAt: updatedAt || new Date(),
			subtasks: [...subtasks], // Create a copy to ensure immutability
		};
	}

	/**
	 * Add a subtask to a task
	 */
	export function addSubtask(
		task: Task,
		title: string,
		description?: string | null,
	): Task {
		const order = getNextOrder(task.subtasks);
		const subtask = create(
			title,
			task.id,
			description || null,
			undefined,
			"incomplete",
			order,
		);
		const newSubtasks = [...task.subtasks, subtask];

		return {
			...task,
			status: calculateStatus(newSubtasks, task.status),
			updatedAt: new Date(),
			subtasks: newSubtasks,
		};
	}

	/**
	 * Update task title
	 */
	export function updateTitle(task: Task, title: string): Task {
		validateTitle(title);
		return {
			...task,
			title,
			updatedAt: new Date(),
		};
	}

	/**
	 * Update task description
	 */
	export function updateDescription(
		task: Task,
		description: string | null,
	): Task {
		return {
			...task,
			description,
			updatedAt: new Date(),
		};
	}

	/**
	 * Update task status based on subtasks
	 */
	export function updateStatus(task: Task): Task {
		const newStatus = calculateStatus(task.subtasks, task.status);
		return {
			...task,
			status: newStatus,
			updatedAt: new Date(),
		};
	}

	/**
	 * Update task order
	 */
	export function updateOrder(task: Task, order: number): Task {
		validateOrder(order);
		return {
			...task,
			order,
			updatedAt: new Date(),
		};
	}

	/**
	 * Mark task and all subtasks as completed
	 */
	export function markAsCompleted(task: Task): Task {
		// Mark all subtasks as completed as well
		const completedSubtasks = task.subtasks.map((subtask) =>
			markAsCompleted(subtask),
		);

		return {
			...task,
			status: "completed",
			updatedAt: new Date(),
			subtasks: completedSubtasks,
		};
	}

	/**
	 * Mark task as incomplete
	 */
	export function markAsIncomplete(task: Task): Task {
		return {
			...task,
			status: "incomplete",
			updatedAt: new Date(),
		};
	}

	/**
	 * Reorder subtasks
	 */
	export function reorderSubtasks(
		task: Task,
		orderMap: Record<string, number>,
	): Task {
		const updatedSubtasks: Task[] = task.subtasks.map((subtask) => {
			const orderValue = orderMap[subtask.id];
			if (orderValue !== undefined) {
				return updateOrder(subtask, orderValue);
			}
			return subtask;
		});

		const sortedSubtasks = [...updatedSubtasks].sort(
			(a, b) => a.order - b.order,
		);

		return {
			...task,
			updatedAt: new Date(),
			subtasks: sortedSubtasks,
		};
	}

	/**
	 * Get all tasks in a hierarchy as a flattened array
	 */
	export function getTaskHierarchy(task: Task): Task[] {
		const result: Task[] = [task];
		for (const subtask of task.subtasks) {
			result.push(...getTaskHierarchy(subtask));
		}
		return result;
	}

	/**
	 * Find a task by ID in a task hierarchy
	 */
	export function findTaskById(task: Task, id: string): Task | null {
		if (task.id === id) {
			return task;
		}

		for (const subtask of task.subtasks) {
			const found = findTaskById(subtask, id);
			if (found) {
				return found;
			}
		}

		return null;
	}

	/**
	 * Get the depth of a task in the hierarchy
	 */
	export function getDepth(task: Task): number {
		return task.parentId === null
			? 0
			: 1 + Math.max(...task.subtasks.map(getDepth), 0);
	}

	// Private helper functions

	/**
	 * Calculate next order for a new subtask
	 */
	function getNextOrder(subtasks: readonly Task[]): number {
		return subtasks.length > 0
			? Math.max(...subtasks.map((subtask) => subtask.order)) + 1
			: 1;
	}

	/**
	 * Calculate status based on subtasks
	 */
	function calculateStatus(
		subtasks: readonly Task[],
		currentStatus: TaskStatus,
	): TaskStatus {
		if (subtasks.length > 0) {
			return subtasks.every((subtask) => subtask.status === "completed")
				? "completed"
				: "incomplete";
		}
		return currentStatus;
	}

	/**
	 * Validate task title
	 */
	function validateTitle(title: string): void {
		if (!title.trim()) {
			throw new Error("Task title cannot be empty");
		}
	}

	/**
	 * Validate task order
	 */
	function validateOrder(order: number): void {
		if (order < 1) {
			throw new Error("Task order must be a positive number");
		}
	}

	/**
	 * Validate task status
	 */
	function validateStatus(status: TaskStatus): void {
		if (!["completed", "incomplete"].includes(status)) {
			throw new Error(
				`Task status must be "completed" or "incomplete", got "${status}"`,
			);
		}
	}
}
