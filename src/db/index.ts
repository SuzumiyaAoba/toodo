import { Database } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";
import { Logger } from "tslog";
import * as schema from "./schema";

const logger = new Logger({ name: "db" });

/**
 * Create a SQLite database connection
 * This is a singleton instance of the database connection
 */
function createDatabaseConnection() {
	try {
		// Create a Bun SQLite database connection
		const sqlite = new Database("data.db");

		// Enable foreign key constraints for data integrity
		sqlite.exec("PRAGMA foreign_keys = ON;");

		return sqlite;
	} catch (error) {
		logger.fatal("Failed to create database connection:", error);
		throw error;
	}
}

// Database singleton instance
const sqlite = createDatabaseConnection();

/**
 * Create a Drizzle ORM instance using Bun SQLite
 * This provides a type-safe interface to the database
 */
export const db = drizzle(sqlite, {
	schema,
	logger: {
		logQuery: (query, params) => {
			logger.debug("Query:", query, "Params:", params);
		},
	},
});

export * from "./schema";
