import type { MiddlewareHandler } from "hono";
import * as v from "valibot";

/**
 * リクエストのバリデーションを行うミドルウェア
 * @param target バリデーション対象（"json", "query", "param"のいずれか）
 * @param schema Valibotのスキーマ
 * @returns バリデーション結果をc.req.valid()で取得できるようにするミドルウェア
 */
export const validate = <TInput, TOutput>(
  target: "json" | "query" | "param",
  schema: v.BaseSchema<TInput, TOutput, v.BaseIssue<unknown>>,
) => {
  const middleware: MiddlewareHandler = async (c, next) => {
    let data: unknown;

    // リクエストの種類に応じてデータを取得
    try {
      if (target === "json") {
        data = await c.req.json();
      } else if (target === "query") {
        data = c.req.query();
      } else if (target === "param") {
        data = c.req.param();
      } else {
        return c.json({ error: "Invalid validation target" }, 400);
      }

      // スキーマによるバリデーション
      const validatedData = v.parse(schema, data);

      // バリデーション済みデータをリクエストオブジェクトに保存
      // @ts-ignore - 型拡張による一時的な回避策
      if (!c.req.validatedData) {
        // @ts-ignore - 型拡張による一時的な回避策
        c.req.validatedData = {};
      }
      // @ts-ignore - 型拡張による一時的な回避策
      c.req.validatedData[target] = validatedData;

      // @ts-ignore - 型拡張による一時的な回避策
      c.req.valid = (requestedTarget?: string) => {
        if (requestedTarget) {
          // @ts-ignore - 型拡張による一時的な回避策
          return c.req.validatedData[requestedTarget];
        }
        // @ts-ignore - 型拡張による一時的な回避策
        return c.req.validatedData[target];
      };

      await next();
    } catch (error) {
      if (error instanceof v.ValiError) {
        // エラーハンドリング
        const issues = error.issues || [];
        const formattedIssues = issues.map((issue) => ({
          path: issue.path?.map((p: { key: string }) => p.key).join("."),
          message: issue.message,
        }));

        return c.json({ error: "Validation Error", issues: formattedIssues }, 400);
      }

      if (error instanceof SyntaxError && target === "json") {
        return c.json({ error: "Invalid JSON format" }, 400);
      }

      return c.json({ error: "Validation Failed" }, 400);
    }
  };

  return middleware;
};

// Honoのリクエストオブジェクトに型拡張
declare module "hono" {
  interface HonoRequest {
    valid<T = unknown>(key?: string): T;
    validatedData?: Record<string, unknown>;
  }
}
