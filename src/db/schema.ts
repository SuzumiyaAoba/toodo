import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

// 自己参照テーブルの定義
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
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

// 自己参照の設定は SQLite migration で直接設定します
// DrizzleでのSQLiteの自己参照は型エラーになるため、SQL側で対応

// Legacy tables for reference/migration
export const todos = sqliteTable("todos", {
  id: text("id").primaryKey(),
  content: text("content").notNull(),
  completed: integer("completed", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export const subtasks = sqliteTable("subtasks", {
  id: text("id").primaryKey(),
  todoId: text("todo_id")
    .notNull()
    .references(() => todos.id),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status", { enum: ["completed", "incomplete"] })
    .notNull()
    .default("incomplete"),
  order: integer("order").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export type Task = typeof tasks.$inferSelect;
export type NewTask = typeof tasks.$inferInsert;

// Legacy types for reference/migration
export type Todo = typeof todos.$inferSelect;
export type NewTodo = typeof todos.$inferInsert;

export type Subtask = typeof subtasks.$inferSelect;
export type NewSubtask = typeof subtasks.$inferInsert;
