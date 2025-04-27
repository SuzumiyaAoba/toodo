import type { PriorityLevel, Todo, TodoId } from "../../domain/entities/todo";
import { TodoStatus, mapToDomainTodo } from "../../domain/entities/todo";
import {
  DependencyCycleError,
  DependencyExistsError,
  DependencyNotFoundError,
  SelfDependencyError,
  TodoNotFoundError,
} from "../../domain/errors/todo-errors";
import type { TodoRepository } from "../../domain/repositories/todo-repository";
import type { PrismaClient, Todo as PrismaTodo } from "../../generated/prisma";
import { PrismaBaseRepository } from "./prisma-base-repository";

/**
 * PrismaTodoRepository implements TodoRepository using Prisma ORM
 */
export class PrismaTodoRepository extends PrismaBaseRepository<Todo, PrismaTodo> implements TodoRepository {
  constructor(prisma: PrismaClient) {
    super(prisma, "Todo");
  }

  /**
   * Map a Prisma Todo model to a domain Todo entity
   */
  protected mapToDomain(
    prismaTodo: PrismaTodo & {
      dependsOn?: { dependencyId: string }[];
      dependents?: { dependentId: string }[];
    },
  ): Todo {
    return mapToDomainTodo(prismaTodo);
  }

  async findAll(): Promise<Todo[]> {
    return this.executePrismaOperation(async () => {
      const todos = await this.prisma.todo.findMany({
        include: {
          dependsOn: true,
          dependents: true,
        },
      });
      return this.mapToDomainArray(todos);
    });
  }

  async findById(id: string): Promise<Todo | null> {
    return this.executePrismaOperation(async () => {
      const todo = await this.prisma.todo.findUnique({
        where: { id },
        include: {
          dependsOn: true,
          dependents: true,
        },
      });
      return todo ? this.mapToDomain(todo) : null;
    }, id);
  }

  async create(todo: Omit<Todo, "id" | "createdAt" | "updatedAt">): Promise<Todo> {
    return this.executePrismaOperation(async () => {
      const createdTodo = await this.prisma.todo.create({
        data: {
          title: todo.title,
          description: todo.description,
          status: todo.status,
          workState: todo.workState,
          totalWorkTime: todo.totalWorkTime,
          lastStateChangeAt: todo.lastStateChangeAt,
          priority: todo.priority,
          projectId: todo.projectId,
        },
        include: {
          dependsOn: true,
          dependents: true,
        },
      });
      return this.mapToDomain(createdTodo);
    });
  }

  async update(id: string, todo: Partial<Todo>): Promise<Todo | null> {
    return this.executePrismaOperation(async () => {
      // Check if todo exists
      const existingTodo = await this.prisma.todo.findUnique({ where: { id } });
      if (!existingTodo) {
        return null;
      }

      const updatedTodo = await this.prisma.todo.update({
        where: { id },
        data: {
          ...(todo.title !== undefined && { title: todo.title }),
          ...(todo.description !== undefined && {
            description: todo.description,
          }),
          ...(todo.status !== undefined && { status: todo.status }),
          ...(todo.workState !== undefined && { workState: todo.workState }),
          ...(todo.totalWorkTime !== undefined && {
            totalWorkTime: todo.totalWorkTime,
          }),
          ...(todo.lastStateChangeAt !== undefined && {
            lastStateChangeAt: todo.lastStateChangeAt,
          }),
          ...(todo.priority !== undefined && { priority: todo.priority }),
          ...(todo.projectId !== undefined && { projectId: todo.projectId }),
        },
        include: {
          dependsOn: true,
          dependents: true,
        },
      });
      return this.mapToDomain(updatedTodo);
    }, id);
  }

  async delete(id: string): Promise<void> {
    return this.executePrismaOperation(async () => {
      // Check if todo exists
      const existingTodo = await this.prisma.todo.findUnique({ where: { id } });
      if (!existingTodo) {
        throw new TodoNotFoundError(id);
      }

      await this.prisma.todo.delete({ where: { id } });
    }, id);
  }

  async addDependency(todoId: TodoId, dependencyId: TodoId): Promise<void> {
    return this.executePrismaOperation(async () => {
      // 自分自身への依存関係は作成できない
      if (todoId === dependencyId) {
        throw new SelfDependencyError(todoId);
      }

      // 両方のTodoが存在するか確認
      const todo = await this.prisma.todo.findUnique({ where: { id: todoId } });
      const dependency = await this.prisma.todo.findUnique({ where: { id: dependencyId } });

      if (!todo) {
        throw new TodoNotFoundError(todoId);
      }
      if (!dependency) {
        throw new TodoNotFoundError(dependencyId);
      }

      // 既存の依存関係を確認
      const existingDependency = await this.prisma.todoDependency.findUnique({
        where: {
          dependentId_dependencyId: {
            dependentId: todoId,
            dependencyId: dependencyId,
          },
        },
      });

      if (existingDependency) {
        throw new DependencyExistsError(todoId, dependencyId);
      }

      // 依存関係の追加によって循環依存が発生しないか確認
      const wouldCreateCycle = await this.wouldCreateDependencyCycle(todoId, dependencyId);
      if (wouldCreateCycle) {
        throw new DependencyCycleError(todoId, dependencyId);
      }

      // 依存関係を追加
      await this.prisma.todoDependency.create({
        data: {
          dependentId: todoId,
          dependencyId: dependencyId,
        },
      });
    }, `${todoId}-${dependencyId}`);
  }

  async removeDependency(todoId: TodoId, dependencyId: TodoId): Promise<void> {
    return this.executePrismaOperation(async () => {
      // 依存関係が存在するか確認
      const existingDependency = await this.prisma.todoDependency.findUnique({
        where: {
          dependentId_dependencyId: {
            dependentId: todoId,
            dependencyId: dependencyId,
          },
        },
      });

      if (!existingDependency) {
        throw new DependencyNotFoundError(todoId, dependencyId);
      }

      // 依存関係を削除
      await this.prisma.todoDependency.delete({
        where: {
          dependentId_dependencyId: {
            dependentId: todoId,
            dependencyId: dependencyId,
          },
        },
      });
    }, `${todoId}-${dependencyId}`);
  }

  async findDependents(todoId: TodoId): Promise<Todo[]> {
    return this.executePrismaOperation(async () => {
      // Todoが存在するか確認
      const todo = await this.prisma.todo.findUnique({ where: { id: todoId } });
      if (!todo) {
        throw new TodoNotFoundError(todoId);
      }

      // このTodoに依存しているTodoを取得
      const dependents = await this.prisma.todo.findMany({
        where: {
          dependsOn: {
            some: {
              dependencyId: todoId,
            },
          },
        },
        include: {
          dependsOn: true,
          dependents: true,
        },
      });

      return this.mapToDomainArray(dependents);
    }, todoId);
  }

  async findDependencies(todoId: TodoId): Promise<Todo[]> {
    return this.executePrismaOperation(async () => {
      // Todoが存在するか確認
      const todo = await this.prisma.todo.findUnique({ where: { id: todoId } });
      if (!todo) {
        throw new TodoNotFoundError(todoId);
      }

      // このTodoが依存しているTodoを取得
      const dependencies = await this.prisma.todo.findMany({
        where: {
          dependents: {
            some: {
              dependentId: todoId,
            },
          },
        },
        include: {
          dependsOn: true,
          dependents: true,
        },
      });

      return this.mapToDomainArray(dependencies);
    }, todoId);
  }

  async wouldCreateDependencyCycle(todoId: TodoId, dependencyId: TodoId): Promise<boolean> {
    return this.executePrismaOperation(async () => {
      // 自分自身への依存は循環依存
      if (todoId === dependencyId) {
        return true;
      }

      // 依存関係をたどって循環を探す
      // 深さ優先探索で実装
      const visited = new Set<string>();
      const visiting = new Set<string>();

      const hasCycle = async (currentId: string): Promise<boolean> => {
        // 既に訪問済みなら循環なし
        if (visited.has(currentId)) {
          return false;
        }

        // 現在探索中のノードなら循環あり
        if (visiting.has(currentId)) {
          return true;
        }

        visiting.add(currentId);

        // 現在のノードの依存先を取得
        const currentDependencies = await this.prisma.todoDependency.findMany({
          where: { dependentId: currentId },
          select: { dependencyId: true },
        });

        // 新しい依存関係を仮想的に追加
        if (currentId === todoId) {
          currentDependencies.push({ dependencyId });
        }

        // 依存先をたどって循環を探索
        for (const { dependencyId: nextId } of currentDependencies) {
          if (await hasCycle(nextId)) {
            return true;
          }
        }

        // 探索完了
        visiting.delete(currentId);
        visited.add(currentId);
        return false;
      };

      return hasCycle(todoId);
    }, `${todoId}-${dependencyId}`);
  }

  async findAllCompleted(): Promise<Todo[]> {
    return this.executePrismaOperation(async () => {
      const todos = await this.prisma.todo.findMany({
        where: { status: TodoStatus.COMPLETED },
        include: {
          dependsOn: true,
          dependents: true,
        },
      });
      return this.mapToDomainArray(todos);
    });
  }
}
