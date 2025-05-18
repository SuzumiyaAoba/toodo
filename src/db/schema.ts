import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

// Self-referencing table definition
export const tasks = sqliteTable("tasks", {
	id: text("id").primaryKey(),
	parentId: text("parent_id"),
	title: text("title").notNull(),
	description: text("description"),
	status: text("status", { enum: ["completed", "incomplete"] })
		.notNull()
		.default("incomplete"),
	order: integer("order").notNull().default(1),
	createdAt: integer("created_at", { mode: "timestamp" })
		.notNull()
		.$defaultFn(() => new Date()),
	updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(
		() => new Date(),
	),
});

// Self-referencing foreign key constraint is defined in migrate.ts
// with `FOREIGN KEY (parent_id) REFERENCES tasks(id) ON DELETE CASCADE`

export type Task = typeof tasks.$inferSelect;
export type NewTask = typeof tasks.$inferInsert;
