import * as v from "valibot";

/**
 * ドメインオブジェクトをレスポンススキーマに変換する関数
 * @param entity 変換元となるドメインオブジェクト
 * @param schema 変換先となるValibotスキーマ
 * @returns スキーマに合わせた形式に変換されたオブジェクト
 */
export function convertToResponseSchema<T, TInput, TOutput>(
  entity: T,
  schema: v.BaseSchema<TInput, TOutput, v.BaseIssue<unknown>>,
): TOutput {
  try {
    // スキーマのプロパティ情報を取得
    const result: Record<string, unknown> = {};

    // ドメインオブジェクトから安全にプロパティを抽出
    if (typeof entity === "object" && entity !== null) {
      for (const key in entity) {
        if (Object.prototype.hasOwnProperty.call(entity, key)) {
          result[key] = (entity as Record<string, unknown>)[key];
        }
      }
    }

    // バリデーションを実行して一貫性を確保
    return v.parse(schema, result);
  } catch (error) {
    console.error("Error converting entity to response schema:", error);
    throw new Error("Failed to convert entity to response schema");
  }
}
