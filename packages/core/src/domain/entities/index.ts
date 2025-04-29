export * from "./todo.js";
export * from "./todo-activity.js";
export * from "./tag.js";
export * from "./project.js";
export * from "./work-period.js";

export interface Project {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Tag {
  id: string;
  name: string;
  color?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Todo {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority?: string;
  dueDate?: Date;
  completedAt?: Date;
  parentId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TodoActivity {
  id: string;
  todoId: string;
  type: string;
  note?: string;
  workTime?: number;
  workPeriodId?: string;
  createdAt: Date;
}

export interface TodoDependency {
  id: string;
  todoId: string;
  dependencyId: string;
  createdAt: Date;
}

export interface WorkPeriod {
  id: string;
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
