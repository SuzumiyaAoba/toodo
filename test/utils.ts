import { v4 as uuidv4 } from "uuid";
import type { NewTask } from "../src/db/schema";

/**
 * Create mock Task data for testing (root task)
 */
export function createMockTask(override: Partial<NewTask> = {}): NewTask {
	return {
		id: uuidv4(),
		parentId: null,
		title: "Test Task",
		description: "Test Description",
		status: "incomplete",
		order: 1,
		createdAt: new Date(),
		updatedAt: new Date(),
		...override,
	};
}

/**
 * Create mock Child Task (subtask) data for testing
 */
export function createMockChildTask(
	parentId: string,
	override: Partial<NewTask> = {},
): NewTask {
	return {
		id: uuidv4(),
		parentId,
		title: "Test Child Task",
		description: "Test Child Description",
		status: "incomplete",
		order: 1,
		createdAt: new Date(),
		updatedAt: new Date(),
		...override,
	};
}
