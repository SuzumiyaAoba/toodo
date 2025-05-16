import { Database } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";
import { BunSQLiteDatabase } from "drizzle-orm/bun-sqlite";
import * as schema from "../src/db/schema";

/**
 * テスト用のインメモリデータベースとDrizzleインスタンスを作成する
 */
export function createTestDb() {
  // インメモリSQLiteデータベースを作成
  const db = new Database(":memory:");

  // テーブルを作成
  db.exec(`
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

  // Drizzle ORMインスタンスを作成
  return drizzle(db, { schema });
}

/**
 * テスト用のHonoアプリを作成する
 */
export async function createTestApp() {
  const { default: app } = await import("../src/index");
  return app;
}
