import type { TodoDependency } from "../../domain/entities/todo-dependency";
import type { TodoDependencyRepository as TodoDependencyRepositoryInterface } from "../../domain/repositories/todo-dependency-repository";
import type { PrismaClient } from "../../generated/prisma";

export class TodoDependencyRepository implements TodoDependencyRepositoryInterface {
  constructor(private readonly prisma: PrismaClient = {} as PrismaClient) {}

  async create(todoId: string, dependencyId: string): Promise<TodoDependency> {
    return {
      id: "dummy-id",
      todoId,
      dependencyId,
      createdAt: new Date(),
    } as TodoDependency;
  }

  async delete(todoId: string, dependencyId: string): Promise<void> {
    // 削除処理
  }

  async findByTodoId(todoId: string): Promise<TodoDependency[]> {
    return [];
  }

  async findByDependencyId(dependencyId: string): Promise<TodoDependency[]> {
    return [];
  }

  async exists(todoId: string, dependencyId: string): Promise<boolean> {
    return false;
  }

  async checkForCycle(todoId: string, dependencyId: string): Promise<boolean> {
    return false;
  }

  async getTodoDependencyTree(todoId: string, direction: "dependencies" | "dependents"): Promise<string[]> {
    return [];
  }
}
