import { PriorityLevel, TodoStatus, WorkState } from "@toodo/core";
import * as v from "valibot";
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
 * Common schema parts that are reused across different schemas
 */
export const CommonSchemas = {
  uuid: () => v.pipe(v.string(), v.uuid()),
  title: () => v.pipe(v.string(), v.minLength(1), v.maxLength(100)),
  description: () => v.optional(v.pipe(v.string(), v.maxLength(1000))),
  note: () => v.optional(v.pipe(v.string(), v.maxLength(500))),
  todoStatus: () => v.picklist([TodoStatus.PENDING, TodoStatus.IN_PROGRESS, TodoStatus.COMPLETED]),
  workState: () => v.picklist([WorkState.IDLE, WorkState.ACTIVE, WorkState.PAUSED, WorkState.COMPLETED]),
  activityType: () =>
    v.picklist([ActivityType.STARTED, ActivityType.PAUSED, ActivityType.COMPLETED, ActivityType.DISCARDED]),
  dueDate: () => v.optional(DateSchema),
  priorityLevel: () => v.picklist([PriorityLevel.LOW, PriorityLevel.MEDIUM, PriorityLevel.HIGH]),
};

/**
 * Base schema for entities with ID and timestamps
 */
export const BaseEntitySchema = v.object({
  id: CommonSchemas.uuid(),
  createdAt: DateSchema,
  updatedAt: DateSchema,
});

/**
 * Schema for Todo entity responses
 */
export const TodoSchema = v.object({
  id: CommonSchemas.uuid(),
  title: CommonSchemas.title(),
  description: CommonSchemas.description(),
  status: CommonSchemas.todoStatus(),
  workState: CommonSchemas.workState(),
  totalWorkTime: v.number(),
  lastStateChangeAt: DateSchema,
  dueDate: CommonSchemas.dueDate(),
  createdAt: DateSchema,
  updatedAt: DateSchema,
  priority: CommonSchemas.priorityLevel(), // Using common schema
  projectId: v.optional(CommonSchemas.uuid()),
  dependencies: v.optional(v.array(CommonSchemas.uuid())), // List of IDs of dependent Todos
  dependents: v.optional(v.array(CommonSchemas.uuid())), // List of IDs of Todos dependent on this Todo
});

/**
 * Type for Todo entity responses
 */
export type TodoResponse = v.InferOutput<typeof TodoSchema>;

/**
 * Schema for creating a Todo
 */
export const CreateTodoSchema = v.object({
  title: CommonSchemas.title(),
  description: CommonSchemas.description(),
  status: v.optional(v.picklist([TodoStatus.PENDING, TodoStatus.COMPLETED])),
  workState: v.optional(CommonSchemas.workState()),
  priority: v.optional(CommonSchemas.priorityLevel()), // Using common schema
  dueDate: CommonSchemas.dueDate(),
  projectId: v.optional(CommonSchemas.uuid()),
});

/**
 * Type for creating a Todo
 */
export type CreateTodoRequest = v.InferOutput<typeof CreateTodoSchema>;

/**
 * Schema for updating a Todo
 */
export const UpdateTodoSchema = v.object({
  title: v.optional(CommonSchemas.title()),
  description: CommonSchemas.description(),
  status: v.optional(v.picklist([TodoStatus.PENDING, TodoStatus.COMPLETED])),
  workState: v.optional(CommonSchemas.workState()),
  priority: v.optional(CommonSchemas.priorityLevel()), // Using common schema
  dueDate: CommonSchemas.dueDate(),
  projectId: v.optional(CommonSchemas.uuid()),
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
  id: CommonSchemas.uuid(),
  todoId: CommonSchemas.uuid(),
  type: CommonSchemas.activityType(),
  workTime: v.optional(v.number()),
  previousState: v.optional(CommonSchemas.workState()),
  note: CommonSchemas.note(),
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
  type: CommonSchemas.activityType(),
  note: CommonSchemas.note(),
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
  id: CommonSchemas.uuid(),
  totalWorkTime: v.number(),
  workState: CommonSchemas.workState(),
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
  id: CommonSchemas.uuid(),
});

/**
 * Type for ID path parameters
 */
export type IdParam = v.InferOutput<typeof IdParamSchema>;

/**
 * Schema for Todo and Activity ID path parameters
 */
export const TodoActivityIdParamSchema = v.object({
  id: CommonSchemas.uuid(),
  activityId: CommonSchemas.uuid(),
});

/**
 * Type for Todo and Activity ID path parameters
 */
export type TodoActivityIdParam = v.InferOutput<typeof TodoActivityIdParamSchema>;

/**
 * Schema for Todo and Tag ID path parameters
 */
export const TodoTagParamSchema = v.object({
  id: CommonSchemas.uuid(),
  tagId: CommonSchemas.uuid(),
});

/**
 * Type for Todo and Tag ID path parameters
 */
export type TodoTagParam = v.InferOutput<typeof TodoTagParamSchema>;

/**
 * Schema for Todo dependency path parameters
 */
export const TodoDependencyParamSchema = v.object({
  id: CommonSchemas.uuid(),
  dependencyId: CommonSchemas.uuid(),
});

/**
 * Type for Todo dependency path parameters
 */
export type TodoDependencyParam = v.InferOutput<typeof TodoDependencyParamSchema>;

/**
 * Basic Todo info schema used in dependencies and dependents lists
 */
export const BasicTodoInfoSchema = v.object({
  id: CommonSchemas.uuid(),
  title: v.string(),
  status: CommonSchemas.todoStatus(),
  priority: CommonSchemas.priorityLevel(), // Using common schema
});

type TodoDependencyNode = {
  id: string;
  title: string;
  status: TodoStatus;
  priority: PriorityLevel | null; // Changed from number type to PriorityLevel type
  dependencies: TodoDependencyNode[];
};

/**
 * Schema for Todo dependency tree node response
 */
export const TodoDependencyNodeSchema: v.GenericSchema<TodoDependencyNode> = v.object({
  id: CommonSchemas.uuid(),
  title: v.string(),
  status: CommonSchemas.todoStatus(),
  priority: v.nullable(CommonSchemas.priorityLevel()), // Using common schema
  dependencies: v.array(v.lazy(() => TodoDependencyNodeSchema)),
});

/**
 * Type for Todo dependency tree node response
 */
export type TodoDependencyNodeResponse = v.InferOutput<typeof TodoDependencyNodeSchema>;

/**
 * Schema for dependency tree query parameters
 */
export const DependencyTreeQuerySchema = v.object({
  maxDepth: v.optional(
    v.pipe(
      v.string(),
      v.transform((val) => Number.parseInt(val, 10)),
      v.number(),
    ),
  ),
});

/**
 * Type for dependency tree query parameters
 */
export type DependencyTreeQuery = v.InferOutput<typeof DependencyTreeQuerySchema>;

/**
 * Schema for due date query parameters
 */
export const DueDateQuerySchema = v.object({
  days: v.optional(
    v.pipe(
      v.string(),
      v.transform((val) => Number.parseInt(val, 10)),
      v.number(),
    ),
  ),
});

/**
 * Type for due date query parameters
 */
export type DueDateQuery = v.InferOutput<typeof DueDateQuerySchema>;

/**
 * Schema for due date range query parameters
 */
export const DueDateRangeQuerySchema = v.object({
  startDate: v.pipe(
    v.string(),
    v.regex(ISO8601_DATE_REGEX),
    v.transform((date) => new Date(date)),
  ),
  endDate: v.pipe(
    v.string(),
    v.regex(ISO8601_DATE_REGEX),
    v.transform((date) => new Date(date)),
  ),
});

/**
 * Type for due date range query parameters
 */
export type DueDateRangeQuery = v.InferOutput<typeof DueDateRangeQuerySchema>;

/**
 * Schema for bulk due date update request
 */
export const BulkDueDateUpdateSchema = v.object({
  todoIds: v.array(CommonSchemas.uuid()),
  dueDate: CommonSchemas.dueDate(),
});

/**
 * Type for bulk due date update request
 */
export type BulkDueDateUpdate = v.InferOutput<typeof BulkDueDateUpdateSchema>;

/**
 * Schema for Project and Todo ID path parameters
 */
export const ProjectTodoParamSchema = v.object({
  id: CommonSchemas.uuid(),
  todoId: CommonSchemas.uuid(),
});

/**
 * Type for Project and Todo ID path parameters
 */
export type ProjectTodoParam = v.InferOutput<typeof ProjectTodoParamSchema>;

/**
 * Schema for Todo dependency list response
 */
export const TodoDependencyListSchema = v.object({
  dependencies: v.array(BasicTodoInfoSchema),
});

/**
 * Type for Todo dependency list response
 */
export type TodoDependencyListResponse = v.InferOutput<typeof TodoDependencyListSchema>;

/**
 * Schema for Todo dependents list response
 */
export const TodoDependentListSchema = v.object({
  dependents: v.array(BasicTodoInfoSchema),
});

/**
 * Type for Todo dependents list response
 */
export type TodoDependentListResponse = v.InferOutput<typeof TodoDependentListSchema>;
