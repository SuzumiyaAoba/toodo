import { Database } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";
import * as schema from "../src/db/schema";

/**
 * Create an in-memory database and Drizzle instance for testing
 */
export function createTestDb() {
	// Create in-memory SQLite database
	const db = new Database(":memory:");

	// Enable foreign key constraints
	db.exec("PRAGMA foreign_keys = ON;");

	// Create tasks table
	db.exec(`
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY NOT NULL,
      parent_id TEXT REFERENCES tasks(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      description TEXT,
      status TEXT DEFAULT 'incomplete' NOT NULL,
      "order" INTEGER DEFAULT 1 NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER
    );
  `);

	// Create Drizzle ORM instance
	return drizzle(db, { schema });
}

/**
 * Create a Hono app for testing
 */
export async function createTestApp() {
	const { default: app } = await import("../src/index");
	return app;
}
