import * as v from "valibot";
import { TodoStatus, WorkState } from "../../domain/entities/todo";
import { ActivityType } from "../../domain/entities/todo-activity";

const ISO8601_DATE_REGEX = /^\d{4}-?\d\d-?\d\d(?:T\d\d(?::?\d\d(?::?\d\d(?:\.\d+)?)?)?(?:Z|[+-]\d\d:?\d\d)?)?$/;

/**
 * Schema for converting ISO8601 dates to Date objects
 */
export const DateSchema = v.pipe(
  v.string(),
  v.regex(ISO8601_DATE_REGEX),
  v.transform((date) => new Date(date)),
);

/**
 * Schema for Todo entity responses
 */
export const TodoSchema = v.object({
  id: v.pipe(v.string(), v.uuid()),
  title: v.pipe(v.string(), v.minLength(1), v.maxLength(100)),
  description: v.optional(v.pipe(v.string(), v.maxLength(1000))),
  status: v.picklist([TodoStatus.PENDING, TodoStatus.COMPLETED]),
  workState: v.picklist([WorkState.IDLE, WorkState.ACTIVE, WorkState.PAUSED, WorkState.COMPLETED]),
  totalWorkTime: v.number(),
  lastStateChangeAt: DateSchema,
  createdAt: DateSchema,
  updatedAt: DateSchema,
  dependencies: v.optional(v.array(v.pipe(v.string(), v.uuid()))), // 依存するTodoのIDリスト
  dependents: v.optional(v.array(v.pipe(v.string(), v.uuid()))), // このTodoに依存するTodoのIDリスト
});

/**
 * Type for Todo entity responses
 */
export type TodoResponse = v.InferOutput<typeof TodoSchema>;

/**
 * Schema for creating a Todo
 */
export const CreateTodoSchema = v.object({
  title: v.pipe(v.string(), v.minLength(1), v.maxLength(100)),
  description: v.optional(v.pipe(v.string(), v.maxLength(1000))),
  status: v.optional(v.picklist([TodoStatus.PENDING, TodoStatus.COMPLETED])),
  workState: v.optional(v.picklist([WorkState.IDLE, WorkState.ACTIVE, WorkState.PAUSED, WorkState.COMPLETED])),
});

/**
 * Type for creating a Todo
 */
export type CreateTodoRequest = v.InferOutput<typeof CreateTodoSchema>;

/**
 * Schema for updating a Todo
 */
export const UpdateTodoSchema = v.object({
  title: v.optional(v.pipe(v.string(), v.minLength(1), v.maxLength(100))),
  description: v.optional(v.pipe(v.string(), v.maxLength(1000))),
  status: v.optional(v.picklist([TodoStatus.PENDING, TodoStatus.COMPLETED])),
  workState: v.optional(v.picklist([WorkState.IDLE, WorkState.ACTIVE, WorkState.PAUSED, WorkState.COMPLETED])),
});

/**
 * Type for updating a Todo
 */
export type UpdateTodoRequest = v.InferOutput<typeof UpdateTodoSchema>;

/**
 * Schema for Todo list response
 */
export const TodoListSchema = v.array(TodoSchema);

/**
 * Type for Todo list response
 */
export type TodoListResponse = v.InferOutput<typeof TodoListSchema>;

/**
 * Schema for TodoActivity entity responses
 */
export const TodoActivitySchema = v.object({
  id: v.pipe(v.string(), v.uuid()),
  todoId: v.pipe(v.string(), v.uuid()),
  type: v.picklist([ActivityType.STARTED, ActivityType.PAUSED, ActivityType.COMPLETED, ActivityType.DISCARDED]),
  workTime: v.optional(v.number()),
  previousState: v.optional(v.picklist([WorkState.IDLE, WorkState.ACTIVE, WorkState.PAUSED, WorkState.COMPLETED])),
  note: v.optional(v.pipe(v.string(), v.maxLength(500))),
  createdAt: DateSchema,
});

/**
 * Type for TodoActivity entity responses
 */
export type TodoActivityResponse = v.InferOutput<typeof TodoActivitySchema>;

/**
 * Schema for creating a TodoActivity
 */
export const CreateTodoActivitySchema = v.object({
  type: v.picklist([ActivityType.STARTED, ActivityType.PAUSED, ActivityType.COMPLETED, ActivityType.DISCARDED]),
  note: v.optional(v.pipe(v.string(), v.maxLength(500))),
});

/**
 * Type for creating a TodoActivity
 */
export type CreateTodoActivityRequest = v.InferOutput<typeof CreateTodoActivitySchema>;

/**
 * Schema for TodoActivity list response
 */
export const TodoActivityListSchema = v.array(TodoActivitySchema);

/**
 * Type for TodoActivity list response
 */
export type TodoActivityListResponse = v.InferOutput<typeof TodoActivityListSchema>;

/**
 * Schema for work time response
 */
export const WorkTimeResponseSchema = v.object({
  id: v.pipe(v.string(), v.uuid()),
  totalWorkTime: v.number(),
  workState: v.picklist([WorkState.IDLE, WorkState.ACTIVE, WorkState.PAUSED, WorkState.COMPLETED]),
  formattedTime: v.string(),
});

/**
 * Type for work time response
 */
export type WorkTimeResponse = v.InferOutput<typeof WorkTimeResponseSchema>;

/**
 * Schema for error responses
 */
export const ErrorResponseSchema = v.object({
  error: v.string(),
});

/**
 * Type for error responses
 */
export type ErrorResponse = v.InferOutput<typeof ErrorResponseSchema>;

/**
 * Schema for ID path parameters
 */
export const IdParamSchema = v.object({
  id: v.pipe(v.string(), v.uuid()),
});

/**
 * Type for ID path parameters
 */
export type IdParam = v.InferOutput<typeof IdParamSchema>;

/**
 * Schema for Todo and Activity ID path parameters
 */
export const TodoActivityIdParamSchema = v.object({
  id: v.pipe(v.string(), v.uuid()),
  activityId: v.pipe(v.string(), v.uuid()),
});

/**
 * Type for Todo and Activity ID path parameters
 */
export type TodoActivityIdParam = v.InferOutput<typeof TodoActivityIdParamSchema>;

/**
 * Schema for Todo and Tag ID path parameters
 */
export const TodoTagParamSchema = v.object({
  id: v.pipe(v.string(), v.uuid()),
  tagId: v.pipe(v.string(), v.uuid()),
});

/**
 * Type for Todo and Tag ID path parameters
 */
export type TodoTagParam = v.InferOutput<typeof TodoTagParamSchema>;

/**
 * Schema for Todo dependency path parameters
 */
export const TodoDependencyParamSchema = v.object({
  id: v.pipe(v.string(), v.uuid()),
  dependencyId: v.pipe(v.string(), v.uuid()),
});

/**
 * Type for Todo dependency path parameters
 */
export type TodoDependencyParam = v.InferOutput<typeof TodoDependencyParamSchema>;

/**
 * Schema for Todo dependency list response
 */
export const TodoDependencyListSchema = v.object({
  dependencies: v.array(
    v.object({
      id: v.pipe(v.string(), v.uuid()),
      title: v.string(),
      status: v.picklist([TodoStatus.PENDING, TodoStatus.IN_PROGRESS, TodoStatus.COMPLETED]),
      priority: v.string(),
    }),
  ),
});

/**
 * Type for Todo dependency list response
 */
export type TodoDependencyListResponse = v.InferOutput<typeof TodoDependencyListSchema>;

/**
 * Schema for Todo dependents list response
 */
export const TodoDependentListSchema = v.object({
  dependents: v.array(
    v.object({
      id: v.pipe(v.string(), v.uuid()),
      title: v.string(),
      status: v.picklist([TodoStatus.PENDING, TodoStatus.IN_PROGRESS, TodoStatus.COMPLETED]),
      priority: v.string(),
    }),
  ),
});

/**
 * Type for Todo dependents list response
 */
export type TodoDependentListResponse = v.InferOutput<typeof TodoDependentListSchema>;

/**
 * Schema for Project and Todo ID path parameters
 */
export const ProjectTodoParamSchema = v.object({
  id: v.pipe(v.string(), v.uuid()),
  todoId: v.pipe(v.string(), v.uuid()),
});

/**
 * Type for Project and Todo ID path parameters
 */
export type ProjectTodoParam = v.InferOutput<typeof ProjectTodoParamSchema>;
