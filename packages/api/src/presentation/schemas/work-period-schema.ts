import * as v from "valibot";
import { CommonSchemas, DateSchema } from "./todo-schemas";

// 稼働時間作成スキーマ
export const createWorkPeriodSchema = {
  body: v.object({
    name: v.string(),
    date: v.optional(DateSchema),
    startTime: DateSchema,
    endTime: DateSchema,
  }),
};

// 稼働時間作成のレスポンススキーマ
export const workPeriodResponseSchema = v.object({
  id: CommonSchemas.uuid(),
  name: v.string(),
  date: DateSchema,
  startTime: DateSchema,
  endTime: DateSchema,
  createdAt: DateSchema,
  updatedAt: DateSchema,
});

// 稼働時間一覧取得スキーマ
export const getWorkPeriodsSchema = {
  query: v.object({
    startDate: v.optional(DateSchema),
    endDate: v.optional(DateSchema),
  }),
};

// 稼働時間一覧レスポンススキーマ
export const workPeriodsResponseSchema = v.array(workPeriodResponseSchema);

// 稼働時間更新スキーマ
export const updateWorkPeriodSchema = {
  params: v.object({
    id: CommonSchemas.uuid(),
  }),
  body: v.object({
    name: v.optional(v.string()),
    date: v.optional(DateSchema),
    startTime: v.optional(DateSchema),
    endTime: v.optional(DateSchema),
  }),
};

// 稼働時間削除スキーマ
export const deleteWorkPeriodSchema = {
  params: v.object({
    id: CommonSchemas.uuid(),
  }),
};

// 稼働時間統計情報取得スキーマ
export const getWorkPeriodStatisticsSchema = {
  query: v.object({
    startDate: v.optional(DateSchema),
    endDate: v.optional(DateSchema),
    tagIds: v.optional(v.array(CommonSchemas.uuid())),
    todoIds: v.optional(v.array(CommonSchemas.uuid())),
    workPeriodIds: v.optional(v.array(CommonSchemas.uuid())),
  }),
};

// 稼働時間統計情報レスポンススキーマ
export const workPeriodStatisticsResponseSchema = v.object({
  totalWorkPeriodTime: v.number(),
  totalActivityTime: v.number(),
  utilizationRate: v.number(),
  activitiesByTag: v.record(v.string(), v.number()),
  activitiesByTodo: v.record(v.string(), v.number()),
});

// 型定義のエクスポート
export type CreateWorkPeriodRequest = v.InferOutput<typeof createWorkPeriodSchema.body>;
export type WorkPeriodResponse = v.InferOutput<typeof workPeriodResponseSchema>;
export type WorkPeriodsResponse = v.InferOutput<typeof workPeriodsResponseSchema>;
export type UpdateWorkPeriodRequest = v.InferOutput<typeof updateWorkPeriodSchema.body>;
export type WorkPeriodStatisticsResponse = v.InferOutput<typeof workPeriodStatisticsResponseSchema>;
export type GetWorkPeriodsQuery = v.InferOutput<typeof getWorkPeriodsSchema.query>;
export type GetWorkPeriodStatisticsQuery = v.InferOutput<typeof getWorkPeriodStatisticsSchema.query>;
