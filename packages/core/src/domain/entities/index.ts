export * from "./todo";
export * from "./todo-activity";
export * from "./tag";
export * from "./project";
export * from "./work-period";

export type TodoId = string;
export type ProjectId = string;
export type TagId = string;
export type TodoActivityId = string;
export type WorkPeriodId = string;

export interface Tag {
  id: TagId;
  name: string;
  color?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TodoDependency {
  id: string;
  todoId: TodoId;
  dependencyId: TodoId;
  createdAt: Date;
}

export interface WorkPeriod {
  id: WorkPeriodId;
  name: string;
  date: Date;
  startTime: Date;
  endTime: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkPeriodCreateInput {
  name: string;
  date?: Date;
  startTime: Date;
  endTime: Date;
}
