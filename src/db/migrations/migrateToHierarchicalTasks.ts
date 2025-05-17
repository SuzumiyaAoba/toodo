import { Database } from "bun:sqlite";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
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
    // Run migration SQL to create tasks table (only if it doesn't exist)
    if (!(await tableExists(sqlite, "tasks"))) {
      logger.info("Creating tasks table...");
      const migrationPath = resolve(process.cwd(), "src/db/migrations/0003_hierarchical_tasks.sql");
      const migrationSQL = readFileSync(migrationPath, "utf-8");

      sqlite.exec(migrationSQL);
      logger.info("Tasks table created successfully");
    } else {
      logger.info("Tasks table already exists, skipping creation");
    }

    // Check if the table exists and has data
    logger.info("Checking if tasks table exists...");
    try {
      const tasksExists = await db.select().from(schema.tasks).all();
      logger.info(`Tasks table exists with ${tasksExists.length} records`);
    } catch (error) {
      logger.error("Error accessing tasks table:", error);
      throw new Error("Failed to access tasks table");
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
