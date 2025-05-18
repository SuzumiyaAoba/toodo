import { Database } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";
import { Logger } from "tslog";
import * as schema from "./schema";

const logger = new Logger({ name: "db" });

// Create a Bun SQLite database connection
const sqlite = new Database("data.db");

// Create a Drizzle ORM instance using Bun SQLite
export const db = drizzle(sqlite, {
	schema,
	logger: {
		logQuery: (query, params) => {
			logger.debug("Query:", query, "Params:", params);
		},
	},
});

export * from "./schema";
