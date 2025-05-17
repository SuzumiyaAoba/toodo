import { Database } from "bun:sqlite";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/bun-sqlite";
import { Logger } from "tslog";
import * as schema from "../schema";

const logger = new Logger({ name: "migration-hierarchical-tasks" });

// Helper function to check if a table exists
async function tableExists(db: Database, tableName: string): Promise<boolean> {
  const result = db
    .query(`SELECT name FROM sqlite_master WHERE type='table' AND name = $tableName;`)
    .get({ $tableName: tableName });

  return !!result;
}

async function migrateToHierarchicalTasks() {
  logger.info("Starting migration to hierarchical tasks...");

  // Connect to database
  const sqlite = new Database("data.db");
  const db = drizzle(sqlite, { schema });

  try {
    // Step 1: Run migration SQL to create tables (only if they don't exist)
    if (!(await tableExists(sqlite, "tasks"))) {
      logger.info("Creating tasks table...");
      const migrationPath = resolve(process.cwd(), "src/db/migrations/0003_hierarchical_tasks.sql");
      const migrationSQL = readFileSync(migrationPath, "utf-8");

      // SQLiteで実行
      sqlite.exec(migrationSQL);
      logger.info("Tasks table created successfully");
    } else {
      logger.info("Tasks table already exists, skipping creation");
    }

    // Step 2: Check if the table exists
    logger.info("Checking if tasks table exists...");
    try {
      const tasksExists = await db.select().from(schema.tasks).all();
      logger.info(`Tasks table exists with ${tasksExists.length} records`);

      // Skip migration if the table already has data
      if (tasksExists.length > 0) {
        logger.info("Tasks table already has data. Skipping data migration.");
        return;
      }
    } catch (error) {
      logger.error("Error accessing tasks table:", error);
      throw new Error("Failed to access tasks table");
    }

    // Step 3: Migrate Todo records
    logger.info("Migrating todos to root tasks...");

    // todosテーブルが存在するか確認
    if (!(await tableExists(sqlite, "todos"))) {
      logger.warn("The todos table does not exist yet. Skipping data migration.");
      logger.info("Migration completed. Only schema has been created.");
      return;
    }

    const todos = await db.select().from(schema.todos).all();
    logger.info(`Found ${todos.length} todos to migrate`);

    for (const todo of todos) {
      // Create a root task for each todo
      await db.insert(schema.tasks).values({
        id: todo.id,
        parentId: null,
        title: todo.content, // Map content to title
        description: null,
        status: todo.completed ? "completed" : "incomplete",
        order: 1, // All root tasks start with order 1
        createdAt: todo.createdAt,
        updatedAt: todo.updatedAt,
      });

      logger.info(`Migrated todo ${todo.id}`);

      // Step 4: Migrate subtasks
      // subtasksテーブルが存在するか確認
      if (!(await tableExists(sqlite, "subtasks"))) {
        logger.warn("The subtasks table does not exist yet. Skipping subtask migration.");
        continue;
      }

      const subtasks = await db
        .select()
        .from(schema.subtasks)
        .where(eq(schema.subtasks.todoId, todo.id))
        .orderBy(schema.subtasks.order)
        .all();

      logger.info(`Found ${subtasks.length} subtasks for todo ${todo.id}`);

      for (const subtask of subtasks) {
        await db.insert(schema.tasks).values({
          id: subtask.id,
          parentId: todo.id,
          title: subtask.title,
          description: subtask.description,
          status: subtask.status,
          order: subtask.order,
          createdAt: subtask.createdAt,
          updatedAt: subtask.updatedAt,
        });

        logger.info(`Migrated subtask ${subtask.id}`);
      }
    }

    logger.info("Migration completed successfully!");
  } catch (error) {
    logger.error("Error during migration:", error);
    throw error;
  } finally {
    sqlite.close();
  }
}

// Run the migration
migrateToHierarchicalTasks().catch((error) => {
  logger.fatal("Migration failed:", error);
  process.exit(1);
});
