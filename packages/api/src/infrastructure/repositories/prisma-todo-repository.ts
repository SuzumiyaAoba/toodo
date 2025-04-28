import type { PriorityLevel, Todo, TodoId } from "../../domain/entities/todo";
import { TodoStatus, mapToDomainTodo } from "../../domain/entities/todo";
import {
  DependencyCycleError,
  DependencyExistsError,
  DependencyNotFoundError,
  SelfDependencyError,
  SubtaskNotFoundError,
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
      subtasks?: PrismaTodo[];
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
          subtasks: true,
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
          subtasks: true,
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
          dueDate: todo.dueDate,
          priority: todo.priority,
          projectId: todo.projectId,
          parentId: todo.parentId,
        },
        include: {
          dependsOn: true,
          dependents: true,
          subtasks: true,
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
          ...(todo.dueDate !== undefined && { dueDate: todo.dueDate }),
          ...(todo.parentId !== undefined && { parentId: todo.parentId }),
        },
        include: {
          dependsOn: true,
          dependents: true,
          subtasks: true,
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

  // サブタスク関連の実装
  async findByParent(parentId: TodoId): Promise<Todo[]> {
    return this.executePrismaOperation(async () => {
      // 親タスクが存在するか確認
      const parent = await this.prisma.todo.findUnique({ where: { id: parentId } });
      if (!parent) {
        throw new TodoNotFoundError(parentId);
      }

      // 親タスクに関連するサブタスクを取得
      const subtasks = await this.prisma.todo.findMany({
        where: { parentId },
        include: {
          dependsOn: true,
          dependents: true,
          subtasks: true,
        },
      });

      return this.mapToDomainArray(subtasks);
    }, parentId);
  }

  async findChildrenTree(parentId: TodoId, maxDepth = 10): Promise<Todo[]> {
    return this.executePrismaOperation(async () => {
      // 親タスクが存在するか確認
      const parent = await this.prisma.todo.findUnique({ where: { id: parentId } });
      if (!parent) {
        throw new TodoNotFoundError(parentId);
      }

      // 再帰的に子タスクを取得する関数
      const fetchSubtasksRecursively = async (currentParentId: TodoId, currentDepth: number): Promise<PrismaTodo[]> => {
        if (currentDepth >= maxDepth) {
          return [];
        }

        const subtasks = await this.prisma.todo.findMany({
          where: { parentId: currentParentId },
          include: {
            dependsOn: true,
            dependents: true,
          },
        });

        // 各サブタスクの子タスクを再帰的に取得
        const subtasksWithChildren = await Promise.all(
          subtasks.map(async (subtask) => {
            const children = await fetchSubtasksRecursively(subtask.id, currentDepth + 1);
            return { ...subtask, subtasks: children };
          }),
        );

        return subtasksWithChildren;
      };

      // 親タスクのサブタスクを取得（再帰的に）
      const subtasksWithNesting = await fetchSubtasksRecursively(parentId, 0);

      // ドメインモデルに変換
      return this.mapToDomainArray(subtasksWithNesting);
    }, `${parentId}-${maxDepth}`);
  }

  async updateParent(todoId: TodoId, parentId: TodoId | null): Promise<Todo> {
    return this.executePrismaOperation(async () => {
      // タスクが存在するか確認
      const todo = await this.prisma.todo.findUnique({ where: { id: todoId } });
      if (!todo) {
        throw new TodoNotFoundError(todoId);
      }

      // 親タスクが指定されている場合、存在するか確認
      if (parentId !== null) {
        const parent = await this.prisma.todo.findUnique({ where: { id: parentId } });
        if (!parent) {
          throw new TodoNotFoundError(parentId);
        }

        // 自分自身を親にはできない
        if (todoId === parentId) {
          throw new SelfDependencyError(todoId);
        }

        // 循環参照がないか確認
        const wouldCreateCycle = await this.checkForHierarchyCycle(todoId, parentId);
        if (wouldCreateCycle) {
          throw new DependencyCycleError(todoId, parentId);
        }
      }

      // 親タスクを更新
      const updatedTodo = await this.prisma.todo.update({
        where: { id: todoId },
        data: { parentId },
        include: {
          dependsOn: true,
          dependents: true,
          subtasks: true,
        },
      });

      return this.mapToDomain(updatedTodo);
    }, `${todoId}-${parentId}`);
  }

  async addSubtask(parentId: TodoId, subtaskId: TodoId): Promise<void> {
    return this.executePrismaOperation(async () => {
      // 両方のタスクが存在するか確認
      const parent = await this.prisma.todo.findUnique({ where: { id: parentId } });
      const subtask = await this.prisma.todo.findUnique({ where: { id: subtaskId } });

      if (!parent) {
        throw new TodoNotFoundError(parentId);
      }
      if (!subtask) {
        throw new TodoNotFoundError(subtaskId);
      }

      // 自分自身をサブタスクにはできない
      if (parentId === subtaskId) {
        throw new SelfDependencyError(parentId);
      }

      // 循環参照がないか確認
      const wouldCreateCycle = await this.checkForHierarchyCycle(subtaskId, parentId);
      if (wouldCreateCycle) {
        throw new DependencyCycleError(subtaskId, parentId);
      }

      // サブタスクの親を設定
      await this.prisma.todo.update({
        where: { id: subtaskId },
        data: { parentId },
      });
    }, `${parentId}-${subtaskId}`);
  }

  async removeSubtask(parentId: TodoId, subtaskId: TodoId): Promise<void> {
    return this.executePrismaOperation(async () => {
      // 両方のタスクが存在するか確認
      const parent = await this.prisma.todo.findUnique({ where: { id: parentId } });
      const subtask = await this.prisma.todo.findUnique({ where: { id: subtaskId } });

      if (!parent) {
        throw new TodoNotFoundError(parentId);
      }
      if (!subtask) {
        throw new TodoNotFoundError(subtaskId);
      }

      // サブタスクの関係を確認
      if (subtask.parentId !== parentId) {
        throw new SubtaskNotFoundError(subtaskId, parentId);
      }

      // サブタスクの親を解除（undefinedではなくnullを明示的に設定）
      await this.prisma.todo.update({
        where: { id: subtaskId },
        data: { parentId: null },
      });
    }, `${parentId}-${subtaskId}`);
  }

  async checkForHierarchyCycle(todoId: TodoId, potentialParentId: TodoId): Promise<boolean> {
    return this.executePrismaOperation(async () => {
      // 自分自身を親にはできない（直接的な循環）
      if (todoId === potentialParentId) {
        return true;
      }

      // 潜在的な親から上に向かって探索し、todoIdが現れるかを確認
      const visited = new Set<string>();
      const visiting = new Set<string>();

      const hasCycle = async (currentId: string): Promise<boolean> => {
        // 既に訪問済みならループなし
        if (visited.has(currentId)) {
          return false;
        }

        // 現在探索中のノードならループあり
        if (visiting.has(currentId)) {
          return true;
        }

        visiting.add(currentId);

        // 現在のノードの親を取得
        const current = await this.prisma.todo.findUnique({
          where: { id: currentId },
          select: { parentId: true },
        });

        // 親がある場合は親をたどる
        if (current?.parentId) {
          // 親がtodoIdと同じならループ発生
          if (current.parentId === todoId) {
            return true;
          }

          // 親を再帰的に探索
          if (await hasCycle(current.parentId)) {
            return true;
          }
        }

        // 探索完了
        visiting.delete(currentId);
        visited.add(currentId);
        return false;
      };

      return hasCycle(potentialParentId);
    }, `${todoId}-${potentialParentId}`);
  }

  // TodoRepository インターフェースの実装
  async findByStatus(status: string): Promise<Todo[]> {
    return this.executePrismaOperation(async () => {
      const todos = await this.prisma.todo.findMany({
        where: { status },
        include: {
          dependsOn: true,
          dependents: true,
          subtasks: true,
        },
      });
      return this.mapToDomainArray(todos);
    });
  }

  async findByPriority(priority: string): Promise<Todo[]> {
    return this.executePrismaOperation(async () => {
      const todos = await this.prisma.todo.findMany({
        where: { priority },
        include: {
          dependsOn: true,
          dependents: true,
          subtasks: true,
        },
      });
      return this.mapToDomainArray(todos);
    });
  }

  async findByProject(projectId: string): Promise<Todo[]> {
    return this.findByProjectId(projectId);
  }

  async findByTag(tagId: string): Promise<Todo[]> {
    return this.findByTagId(tagId);
  }

  async findByDependency(dependencyId: string): Promise<Todo[]> {
    return this.executePrismaOperation(async () => {
      const todos = await this.prisma.todo.findMany({
        where: {
          dependsOn: {
            some: {
              dependencyId,
            },
          },
        },
        include: {
          dependsOn: true,
          dependents: true,
          subtasks: true,
        },
      });
      return this.mapToDomainArray(todos);
    });
  }

  async findByDependent(dependentId: string): Promise<Todo[]> {
    return this.executePrismaOperation(async () => {
      const todos = await this.prisma.todo.findMany({
        where: {
          dependents: {
            some: {
              dependentId,
            },
          },
        },
        include: {
          dependsOn: true,
          dependents: true,
          subtasks: true,
        },
      });
      return this.mapToDomainArray(todos);
    });
  }

  async findWithDueDateBefore(date: Date): Promise<Todo[]> {
    return this.executePrismaOperation(async () => {
      const todos = await this.prisma.todo.findMany({
        where: {
          dueDate: {
            lt: date,
          },
        },
        include: {
          dependsOn: true,
          dependents: true,
          subtasks: true,
        },
      });
      return this.mapToDomainArray(todos);
    });
  }

  async findWithDueDateBetween(startDate: Date, endDate: Date): Promise<Todo[]> {
    return this.findByDueDateRange(startDate, endDate);
  }

  // 既存の実装
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

  async findOverdue(currentDate: Date = new Date()): Promise<Todo[]> {
    return this.executePrismaOperation(async () => {
      const todos = await this.prisma.todo.findMany({
        where: {
          dueDate: {
            lt: currentDate,
          },
          status: {
            not: TodoStatus.COMPLETED,
          },
        },
        include: {
          dependsOn: true,
          dependents: true,
        },
      });
      return this.mapToDomainArray(todos);
    });
  }

  async findDueSoon(days = 2, currentDate: Date = new Date()): Promise<Todo[]> {
    return this.executePrismaOperation(async () => {
      // 現在から指定日数後までの日付を計算
      const futureDate = new Date(currentDate);
      futureDate.setDate(futureDate.getDate() + days);

      const todos = await this.prisma.todo.findMany({
        where: {
          dueDate: {
            gte: currentDate,
            lte: futureDate,
          },
          status: {
            not: TodoStatus.COMPLETED,
          },
        },
        include: {
          dependsOn: true,
          dependents: true,
        },
      });
      return this.mapToDomainArray(todos);
    });
  }

  async findByDueDateRange(startDate: Date, endDate: Date): Promise<Todo[]> {
    return this.executePrismaOperation(async () => {
      const todos = await this.prisma.todo.findMany({
        where: {
          dueDate: {
            gte: startDate,
            lte: endDate,
          },
        },
        include: {
          dependsOn: true,
          dependents: true,
        },
      });
      return this.mapToDomainArray(todos);
    });
  }

  async findByProjectId(projectId: string): Promise<Todo[]> {
    return this.executePrismaOperation(async () => {
      const todos = await this.prisma.todo.findMany({
        where: { projectId },
        include: {
          dependsOn: true,
          dependents: true,
        },
      });
      return this.mapToDomainArray(todos);
    });
  }

  async findByTagId(tagId: string): Promise<Todo[]> {
    return this.executePrismaOperation(async () => {
      const todos = await this.prisma.todo.findMany({
        where: {
          tags: {
            some: {
              tagId,
            },
          },
        },
        include: {
          dependsOn: true,
          dependents: true,
        },
      });
      return this.mapToDomainArray(todos);
    });
  }
}
