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

  const db = drizzle(sqlite, { schema });

  logger.info("Applying SQL migration...");

  // Execute SQL directly to create tables
  db.run(sql`
    CREATE TABLE IF NOT EXISTS todos (
      id TEXT PRIMARY KEY NOT NULL,
      content TEXT NOT NULL,
      completed INTEGER DEFAULT 0 NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER
    );
  `);

  logger.info("Database setup completed successfully!");
  process.exit(0);
}

main().catch((e) => {
  logger.error("Database setup failed!", e);
  process.exit(1);
});
