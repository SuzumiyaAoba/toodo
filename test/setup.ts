import { Database } from "bun:sqlite";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/bun-sqlite";
import * as schema from "../src/db/schema";

/**
 * テスト用のインメモリデータベースとDrizzleインスタンスを作成する
 */
export function createTestDb() {
  // インメモリSQLiteデータベースを作成
  const db = new Database(":memory:");

  // Drizzle ORMインスタンスを作成
  const drizzleDb = drizzle(db, { schema });

  // テーブルを作成
  drizzleDb.run(sql`
    CREATE TABLE IF NOT EXISTS todos (
      id TEXT PRIMARY KEY NOT NULL,
      content TEXT NOT NULL,
      completed INTEGER DEFAULT 0 NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER
    );

    CREATE TABLE IF NOT EXISTS subtasks (
      id TEXT PRIMARY KEY NOT NULL,
      todo_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      status TEXT DEFAULT 'incomplete' NOT NULL,
      "order" INTEGER NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER,
      FOREIGN KEY (todo_id) REFERENCES todos(id) ON UPDATE NO ACTION ON DELETE NO ACTION
    );
  `);

  // テスト用にスキーマをdbオブジェクトに追加
  return {
    ...drizzleDb,
    todos: schema.todos,
    subtasks: schema.subtasks,
  };
}

/**
 * テスト用のHonoアプリを作成する
 */
export async function createTestApp() {
  const { default: app } = await import("../src/index");
  return app;
}
