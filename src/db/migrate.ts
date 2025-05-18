import { Database } from "bun:sqlite";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/bun-sqlite";
import { Logger } from "tslog";
import * as schema from "./schema";

const logger = new Logger({ name: "migrate" });

async function main() {
	logger.info("Starting database setup...");

	// Create a Bun SQLite database connection
	const sqlite = new Database("data.db");

	// Enable foreign key constraints
	sqlite.exec("PRAGMA foreign_keys = ON;");

	const db = drizzle(sqlite, { schema });

	logger.info("Applying SQL migration...");

	// Execute SQL directly to create the tasks table
	db.run(sql`
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

	logger.info("Database setup completed successfully!");
	process.exit(0);
}

main().catch((error) => {
	logger.error("Failed to setup database:", error);
	process.exit(1);
});
