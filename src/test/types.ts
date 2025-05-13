import type { mock } from "bun:test";

/**
 * モック関数の型を拡張した型定義
 * T: モック化したい関数の型
 *
 * Bunのモック関数メソッドと、元の関数の機能を両方持つ型
 */
export type MockedFunction<T> = {
  [K in keyof ReturnType<typeof mock>]: ReturnType<typeof mock>[K];
} & T;
