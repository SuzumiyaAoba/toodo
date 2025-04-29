import type { Project } from "@toodo/core";
import type { ProjectRepository } from "../../domain/repositories/project-repository";
import type { PrismaClient } from "../../generated/prisma";

export class ProjectRepositoryImpl implements ProjectRepository {
  constructor(private readonly prisma: PrismaClient = {} as PrismaClient) {}

  async findAll(): Promise<Project[]> {
    return [];
  }

  async findById(id: string): Promise<Project | null> {
    return null;
  }

  async create(project: Project): Promise<Project> {
    return project;
  }

  async update(project: Project): Promise<Project> {
    return project;
  }

  async delete(id: string): Promise<void> {
    // 削除処理
  }

  async findByName(name: string): Promise<Project | null> {
    return null;
  }

  async addTodo(projectId: string, todoId: string): Promise<void> {
    // Todo追加処理
  }

  async removeTodo(projectId: string, todoId: string): Promise<void> {
    // Todo削除処理
  }

  async getTodosByProject(projectId: string): Promise<string[]> {
    return [];
  }

  async findTodosByProjectId(id: string): Promise<string[]> {
    return [];
  }
}
