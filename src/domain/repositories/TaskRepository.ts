import type { Task } from "../models/Task";

export type PaginationParams = {
	readonly page: number;
	readonly limit: number;
};

export type TaskRepository = {
	/**
	 * Find all root tasks (tasks with no parent)
	 */
	findRootTasks(): Promise<readonly Task[]>;

	/**
	 * Find root tasks with pagination
	 */
	findRootTasksWithPagination(
		params: PaginationParams,
	): Promise<readonly Task[]>;

	/**
	 * Find all subtasks for a given parent task ID
	 */
	findByParentId(parentId: string): Promise<readonly Task[]>;

	/**
	 * Find a task by its ID with all its subtasks loaded hierarchically
	 */
	findById(id: string, loadHierarchy?: boolean): Promise<Task | null>;

	/**
	 * Save a task and all its subtasks in the hierarchy
	 */
	save(task: Task, saveHierarchy?: boolean): Promise<Task>;

	/**
	 * Delete a task and all its subtasks
	 */
	delete(id: string): Promise<void>;

	/**
	 * Update task orders for a set of sibling tasks
	 */
	updateOrder(tasks: readonly Task[]): Promise<readonly Task[]>;

	/**
	 * Find the entire task tree starting from the given root task ID
	 */
	findTaskTree(rootId: string): Promise<Task | null>;

	/**
	 * Move a task to become a child of another task
	 */
	moveTask(taskId: string, newParentId: string | null): Promise<Task | null>;
};
