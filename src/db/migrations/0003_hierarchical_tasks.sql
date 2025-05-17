-- Create the new hierarchical tasks table
CREATE TABLE `tasks` (
	`id` text PRIMARY KEY NOT NULL,
	`parent_id` text REFERENCES `tasks`(`id`) ON DELETE CASCADE,
	`title` text NOT NULL,
	`description` text,
	`status` text DEFAULT 'incomplete' NOT NULL,
	`order` integer DEFAULT 1 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer
);

-- Migration function to move data from todos/subtasks to the new tasks table
-- This is executed separately via application code
-- Here's a general outline of the migration logic:
-- 1. Insert all todos as root tasks (parent_id = NULL)
-- 2. Insert all subtasks as child tasks with parent_id = todo_id
-- 3. Update status on parent tasks based on subtask completion 