import type { Project } from "@toodo/core";

export interface ProjectRepository {
  findAll(): Promise<Project[]>;
  findById(id: string): Promise<Project | null>;
  create(project: Project): Promise<Project>;
  update(project: Project): Promise<Project>;
  delete(id: string): Promise<void>;
  findByName(name: string): Promise<Project | null>;
  findTodosByProjectId(id: string): Promise<string[]>;
  addTodo(projectId: string, todoId: string): Promise<void>;
  removeTodo(projectId: string, todoId: string): Promise<void>;
  getTodosByProject(projectId: string): Promise<string[]>;
}
