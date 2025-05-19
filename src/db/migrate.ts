import { Database } from "bun:sqlite";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/bun-sqlite";
import { Logger } from "tslog";
import * as schema from "./schema";

const logger = new Logger({ name: "migrate" });

/**
 * Applies database migrations to create the required schema
 */
async function applyMigrations(db: ReturnType<typeof drizzle>) {
  logger.info("Applying SQL migration...");

  try {
    // Execute SQL directly to create the tasks table
    await db.run(sql`
			CREATE TABLE IF NOT EXISTS tasks (
				id TEXT PRIMARY KEY NOT NULL,
				parent_id TEXT,
				title TEXT NOT NULL,
				description TEXT,
				status TEXT DEFAULT 'incomplete' NOT NULL,
				"order" INTEGER DEFAULT 1 NOT NULL,
				created_at INTEGER NOT NULL,
				updated_at INTEGER,
				FOREIGN KEY (parent_id) REFERENCES tasks(id) ON DELETE CASCADE
			);

			-- Create index on parent_id for better query performance
			CREATE INDEX IF NOT EXISTS idx_tasks_parent_id ON tasks(parent_id);
		`);

    logger.info("Migration applied successfully");
    return true;
  } catch (error) {
    logger.error("Failed to apply migration:", error);
    return false;
  }
}

/**
 * Main migration function
 */
async function main() {
  logger.info("Starting database setup...");

  try {
    // Create a Bun SQLite database connection
    const sqlite = new Database("data.db");

    // Enable foreign key constraints
    sqlite.exec("PRAGMA foreign_keys = ON;");

    const db = drizzle(sqlite, { schema });

    const success = await applyMigrations(db);

    if (success) {
      logger.info("Database setup completed successfully!");
      process.exit(0);
    } else {
      logger.error("Database setup failed");
      process.exit(1);
    }
  } catch (error) {
    logger.error("Database connection error:", error);
    process.exit(1);
  }
}

// Run migration if this script is executed directly
if (import.meta.main) {
  main().catch((error) => {
    logger.fatal("Unhandled error during migration:", error);
    process.exit(1);
  });
}
