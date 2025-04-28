import { Project, type ProjectId } from "../../domain/entities/project";
import type { ProjectRepository } from "../../domain/repositories/project-repository";
import { PrismaClient } from "../../generated/prisma";
import { PrismaBaseRepository } from "./prisma-base-repository";

export class PrismaProjectRepository implements ProjectRepository {
  public prisma: PrismaClient;

  constructor(prismaClient?: PrismaClient) {
    this.prisma = prismaClient || new PrismaClient();
  }

  async create(project: Project): Promise<Project> {
    const createdProject = await this.prisma.project.create({
      data: {
        id: project.id,
        name: project.name,
        description: project.description,
        color: project.color,
        status: project.status,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
      },
    });

    return this.mapToProject(createdProject);
  }

  async findById(id: ProjectId): Promise<Project | null> {
    const project = await this.prisma.project.findUnique({
      where: { id },
    });

    return project ? this.mapToProject(project) : null;
  }

  async findByName(name: string): Promise<Project | null> {
    const project = await this.prisma.project.findFirst({
      where: { name },
    });

    return project ? this.mapToProject(project) : null;
  }

  async findAll(): Promise<Project[]> {
    const projects = await this.prisma.project.findMany();
    return projects.map((project) => this.mapToProject(project));
  }

  async update(project: Project): Promise<Project> {
    const updatedProject = await this.prisma.project.update({
      where: { id: project.id },
      data: {
        name: project.name,
        description: project.description,
        color: project.color,
        status: project.status,
        updatedAt: project.updatedAt,
      },
    });

    return this.mapToProject(updatedProject);
  }

  async delete(id: ProjectId): Promise<void> {
    await this.prisma.project.delete({
      where: { id },
    });
  }

  async findTodosByProjectId(id: ProjectId): Promise<string[]> {
    const todos = await this.prisma.todo.findMany({
      where: { projectId: id },
      select: { id: true },
    });

    return todos.map((todo) => todo.id);
  }

  async addTodo(projectId: ProjectId, todoId: string): Promise<void> {
    // Update the projectId field of the todo
    await this.prisma.todo.update({
      where: { id: todoId },
      data: { projectId },
    });
  }

  async removeTodo(projectId: ProjectId, todoId: string): Promise<void> {
    // Remove projectId from todo
    await this.prisma.todo.update({
      where: { id: todoId },
      data: { projectId: null },
    });
  }

  private mapToProject(data: {
    id: string;
    name: string;
    description: string | null;
    color: string | null;
    status: string;
    createdAt: Date;
    updatedAt: Date;
  }): Project {
    return new Project(
      data.id,
      data.name,
      data.status as "active" | "archived",
      data.description || undefined,
      data.color || undefined,
      data.createdAt,
      data.updatedAt,
    );
  }
}
