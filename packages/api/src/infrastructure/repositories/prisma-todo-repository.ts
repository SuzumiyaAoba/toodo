import { type Todo, TodoStatus, mapToDomainTodo } from "@toodo/core";
import type { TodoId } from "@toodo/core";
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
export class PrismaTodoRepository
  extends PrismaBaseRepository<Todo, PrismaTodo>
  implements TodoRepository
{
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
    }
  ): Todo {
    return mapToDomainTodo(prismaTodo);
  }

  /**
   * ネストしたsubtasksをTodoオブジェクトとして保持するmap関数
   */
  private mapToDomainWithSubtasks(
    prismaTodo: any
  ): Todo & { subtasks?: (Todo & { subtasks?: any })[]; subtaskIds: string[] } {
    // mapToDomainTodoの戻り値は純粋なTodo型
    const { subtaskIds, ...todoBase } = mapToDomainTodo(prismaTodo) as any;
    const subtasks = prismaTodo.subtasks
      ? prismaTodo.subtasks.map((s: any) => this.mapToDomainWithSubtasks(s))
      : undefined;
    return { ...todoBase, subtaskIds, subtasks };
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
          parent: true,
        },
      });

      if (!todo) {
        return null;
      }

      return this.mapToDomain(todo);
    });
  }

  async create(
    todo: Omit<Todo, "id" | "createdAt" | "updatedAt">
  ): Promise<Todo> {
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
      // 自己参照のチェック
      if (todoId === dependencyId) {
        throw new SelfDependencyError(todoId);
      }

      // 循環参照のチェック
      const hasCycle = await this.wouldCreateDependencyCycle(
        todoId,
        dependencyId
      );
      if (hasCycle) {
        throw new DependencyCycleError(todoId, dependencyId);
      }

      // 依存関係の追加
      await this.prisma.todoDependency.create({
        data: {
          dependentId: todoId,
          dependencyId: dependencyId,
        },
      });
    });
  }

  async removeDependency(todoId: string, dependencyId: string): Promise<void> {
    // Check if dependency exists
    const existingDependency = await this.prisma.todoDependency.findUnique({
      where: {
        dependentId_dependencyId: {
          dependentId: todoId,
          dependencyId,
        },
      },
    });

    if (!existingDependency) {
      throw new DependencyNotFoundError(todoId, dependencyId);
    }

    // Remove dependency
    await this.prisma.todoDependency.delete({
      where: {
        dependentId_dependencyId: {
          dependentId: todoId,
          dependencyId,
        },
      },
    });
  }

  async getUpstreamDependencies(todoId: string): Promise<Todo[]> {
    // Check if Todo exists
    const todo = await this.prisma.todo.findUnique({ where: { id: todoId } });
    if (!todo) {
      throw new TodoNotFoundError(todoId);
    }

    // Get todos that this todo depends on
    const dependencies = await this.prisma.todoDependency.findMany({
      where: { dependentId: todoId },
      include: { dependency: true },
    });

    // Extract the dependency todos from the relation objects
    const dependencyTodos = dependencies.map((dep) => dep.dependency);

    // Convert to domain entities
    return this.mapToDomainArray(dependencyTodos);
  }

  async findDependents(todoId: TodoId): Promise<Todo[]> {
    return this.executePrismaOperation(async () => {
      // Check if Todo exists
      const todo = await this.prisma.todo.findUnique({ where: { id: todoId } });
      if (!todo) {
        throw new TodoNotFoundError(todoId);
      }

      // Get todos that depend on this todo
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
      // Check if Todo exists
      const todo = await this.prisma.todo.findUnique({ where: { id: todoId } });
      if (!todo) {
        throw new TodoNotFoundError(todoId);
      }

      // Get todos that this todo depends on
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

  async checkForHierarchyCycle(
    todoId: TodoId,
    potentialParentId: TodoId
  ): Promise<boolean> {
    return this.executePrismaOperation(async () => {
      // 自己参照は循環参照とみなす
      if (todoId === potentialParentId) {
        return true;
      }

      const visited = new Set<TodoId>();

      const checkCycle = async (
        currentId: TodoId,
        targetId: TodoId
      ): Promise<boolean> => {
        // 訪問済みのノードに到達した場合は循環参照なし
        if (visited.has(currentId)) {
          return false;
        }

        // 目標のノードに到達した場合は循環参照あり
        if (currentId === targetId) {
          return true;
        }

        visited.add(currentId);

        const todo = await this.prisma.todo.findUnique({
          where: { id: currentId },
          include: {
            parent: true,
            subtasks: true,
          },
        });

        if (!todo) {
          return false;
        }

        // 親方向の探索
        if (todo.parent) {
          const hasParentCycle = await checkCycle(todo.parent.id, targetId);
          if (hasParentCycle) {
            return true;
          }
        }

        // 子方向の探索
        for (const subtask of todo.subtasks) {
          const hasSubtaskCycle = await checkCycle(subtask.id, targetId);
          if (hasSubtaskCycle) {
            return true;
          }
        }

        return false;
      };

      return checkCycle(potentialParentId, todoId);
    });
  }

  async wouldCreateDependencyCycle(
    todoId: TodoId,
    dependencyId: TodoId
  ): Promise<boolean> {
    return this.executePrismaOperation(async () => {
      // 自己参照は循環参照とみなす
      if (todoId === dependencyId) {
        return true;
      }

      const visited = new Set<TodoId>();

      const checkCycle = async (
        currentId: TodoId,
        targetId: TodoId
      ): Promise<boolean> => {
        // 訪問済みのノードに到達した場合は循環参照なし
        if (visited.has(currentId)) {
          return false;
        }

        // 目標のノードに到達した場合は循環参照あり
        if (currentId === targetId) {
          return true;
        }

        visited.add(currentId);

        // 依存関係を取得
        const dependencies = await this.prisma.todoDependency.findMany({
          where: {
            OR: [{ dependentId: currentId }, { dependencyId: currentId }],
          },
          include: {
            dependent: true,
            dependency: true,
          },
        });

        // 依存関係の両方向を探索
        for (const dep of dependencies) {
          // 依存先の探索
          if (dep.dependencyId === currentId) {
            const hasDependentCycle = await checkCycle(
              dep.dependentId,
              targetId
            );
            if (hasDependentCycle) {
              return true;
            }
          }
          // 依存元の探索
          if (dep.dependentId === currentId) {
            const hasDependencyCycle = await checkCycle(
              dep.dependencyId,
              targetId
            );
            if (hasDependencyCycle) {
              return true;
            }
          }
        }

        return false;
      };

      return checkCycle(dependencyId, todoId);
    });
  }

  // Subtask related implementations
  async findByParent(parentId: TodoId): Promise<Todo[]> {
    return this.executePrismaOperation(async () => {
      // Check if parent task exists
      const parent = await this.prisma.todo.findUnique({
        where: { id: parentId },
      });
      if (!parent) {
        throw new TodoNotFoundError(parentId);
      }

      // Get subtasks related to parent task
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

  async findChildrenTree(
    parentId: TodoId,
    maxDepth: number = -1
  ): Promise<Todo[]> {
    return this.executePrismaOperation(async () => {
      const visited = new Set<TodoId>();

      const fetchSubtasksRecursively = async (
        currentId: TodoId,
        currentDepth: number
      ): Promise<PrismaTodo[]> => {
        // 訪問済みのノードに到達した場合は空配列を返す（循環参照の防止）
        if (visited.has(currentId)) {
          return [];
        }

        // 深さの制限に達した場合は空配列を返す
        if (maxDepth !== -1 && currentDepth > maxDepth) {
          return [];
        }

        // 現在のIDを訪問済みとして記録
        visited.add(currentId);

        const todo = await this.prisma.todo.findUnique({
          where: { id: currentId },
          include: {
            subtasks: {
              include: {
                dependsOn: true,
                dependents: true,
                subtasks: true,
              },
            },
          },
        });

        if (!todo) {
          return [];
        }

        // サブタスクを再帰的に取得
        const childrenPromises = todo.subtasks.map(async (subtask) => {
          const children = await fetchSubtasksRecursively(
            subtask.id,
            currentDepth + 1
          );
          return [subtask, ...children];
        });

        const allChildren = await Promise.all(childrenPromises);
        return allChildren.flat();
      };

      // ルートノードから探索を開始
      const result = await fetchSubtasksRecursively(parentId, 0);
      return result.map((subtask) => this.mapToDomain(subtask));
    });
  }

  async updateParent(todoId: TodoId, parentId: TodoId | null): Promise<Todo> {
    return this.executePrismaOperation(async () => {
      // Check if task exists
      const todo = await this.prisma.todo.findUnique({ where: { id: todoId } });
      if (!todo) {
        throw new TodoNotFoundError(todoId);
      }

      // Check if parent task exists when specified
      if (parentId !== null) {
        const parent = await this.prisma.todo.findUnique({
          where: { id: parentId },
        });
        if (!parent) {
          throw new TodoNotFoundError(parentId);
        }

        // Cannot set self as parent
        if (todoId === parentId) {
          throw new SelfDependencyError(todoId);
        }

        // Check for circular reference
        const wouldCreateCycle = await this.checkForHierarchyCycle(
          todoId,
          parentId
        );
        if (wouldCreateCycle) {
          throw new DependencyCycleError(todoId, parentId);
        }
      }

      // Update parent task
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

  async addSubtask(todoId: TodoId, subtaskId: TodoId): Promise<void> {
    return this.executePrismaOperation(async () => {
      // 自己参照のチェック
      if (todoId === subtaskId) {
        throw new SelfDependencyError(todoId);
      }

      // 両方のTodoが存在することを確認
      const parent = await this.prisma.todo.findUnique({
        where: { id: todoId },
      });
      const subtask = await this.prisma.todo.findUnique({
        where: { id: subtaskId },
      });

      if (!parent) {
        throw new TodoNotFoundError(todoId);
      }
      if (!subtask) {
        throw new TodoNotFoundError(subtaskId);
      }

      // 循環参照のチェック
      const hasCycle = await this.checkForHierarchyCycle(subtaskId, todoId);
      if (hasCycle) {
        throw new DependencyCycleError(todoId, subtaskId);
      }

      // サブタスクの追加
      await this.prisma.todo.update({
        where: { id: subtaskId },
        data: { parentId: todoId },
      });
    });
  }

  async removeSubtask(parentId: TodoId, subtaskId: TodoId): Promise<void> {
    return this.executePrismaOperation(async () => {
      // Check if both tasks exist
      const parent = await this.prisma.todo.findUnique({
        where: { id: parentId },
      });
      const subtask = await this.prisma.todo.findUnique({
        where: { id: subtaskId },
      });

      if (!parent) {
        throw new TodoNotFoundError(parentId);
      }
      if (!subtask) {
        throw new TodoNotFoundError(subtaskId);
      }

      // Check subtask relationship
      if (subtask.parentId !== parentId) {
        throw new SubtaskNotFoundError(subtaskId, parentId);
      }

      // Remove parent reference (explicitly set to null instead of undefined)
      await this.prisma.todo.update({
        where: { id: subtaskId },
        data: { parentId: null },
      });
    }, `${parentId}-${subtaskId}`);
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

  async findWithDueDateBetween(
    startDate: Date,
    endDate: Date
  ): Promise<Todo[]> {
    return this.findByDueDateRange(startDate, endDate);
  }

  // Existing implementation
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
          subtasks: true,
        },
        orderBy: {
          dueDate: "asc",
        },
      });
      return this.mapToDomainArray(todos);
    });
  }

  async findDueSoon(days = 7, currentDate: Date = new Date()): Promise<Todo[]> {
    return this.executePrismaOperation(async () => {
      const endDate = new Date(currentDate);
      endDate.setDate(currentDate.getDate() + days);

      const todos = await this.prisma.todo.findMany({
        where: {
          dueDate: {
            gte: currentDate,
            lte: endDate,
          },
          status: {
            not: TodoStatus.COMPLETED,
          },
        },
        include: {
          dependsOn: true,
          dependents: true,
          subtasks: true,
        },
        orderBy: {
          dueDate: "asc",
        },
      });
      return this.mapToDomainArray(todos);
    });
  }

  async findByDueDateRange(startDate: Date, endDate: Date): Promise<Todo[]> {
    if (startDate > endDate) {
      throw new Error("Start date must be before or equal to end date");
    }

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
          subtasks: true,
        },
        orderBy: {
          dueDate: "asc",
        },
      });
      return this.mapToDomainArray(todos);
    });
  }

  async findByProjectId(projectId: string): Promise<Todo[]> {
    const todos = await this.prisma.todo.findMany({
      where: { projectId },
      include: {
        parent: true,
        subtasks: true,
        dependsOn: {
          include: {
            dependency: true,
          },
        },
        dependents: {
          include: {
            dependent: true,
          },
        },
        activities: {
          include: {
            workPeriod: true,
          },
        },
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });

    return todos.map((todo) => this.mapToDomain(todo));
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

  async findByState(state: string): Promise<Todo[]> {
    return this.executePrismaOperation(async () => {
      const todos = await this.prisma.todo.findMany({
        where: { workState: state },
        include: {
          dependsOn: true,
          dependents: true,
          subtasks: true,
        },
      });
      return this.mapToDomainArray(todos);
    }, state);
  }

  async findUnassignedSubtasks(): Promise<Todo[]> {
    return this.executePrismaOperation(async () => {
      const todos = await this.prisma.todo.findMany({
        where: { parentId: null },
        include: {
          dependsOn: true,
          dependents: true,
          subtasks: true,
        },
      });
      return this.mapToDomainArray(todos);
    });
  }

  async findSubtasks(parentId: string): Promise<Todo[]> {
    return this.executePrismaOperation(async () => {
      const todos = await this.prisma.todo.findMany({
        where: { parentId },
        include: {
          dependsOn: true,
          dependents: true,
          subtasks: true,
        },
      });
      return this.mapToDomainArray(todos);
    }, parentId);
  }

  async hasDependency(todoId: string, dependencyId: string): Promise<boolean> {
    return this.executePrismaOperation(async () => {
      const dependency = await this.prisma.todoDependency.findUnique({
        where: {
          dependentId_dependencyId: {
            dependentId: todoId,
            dependencyId,
          },
        },
      });

      return dependency !== null;
    });
  }

  async getSubtasks(todoId: string): Promise<Todo[]> {
    return this.executePrismaOperation(async () => {
      const todo = await this.prisma.todo.findUnique({
        where: { id: todoId },
        include: {
          subtasks: {
            include: {
              dependsOn: true,
              dependents: true,
              subtasks: true,
              parent: true,
            },
          },
        },
      });

      if (!todo) {
        throw new TodoNotFoundError(todoId);
      }

      return todo.subtasks.map(mapToDomainTodo);
    });
  }

  async getParent(todoId: string): Promise<Todo | null> {
    return this.executePrismaOperation(async () => {
      const todo = await this.prisma.todo.findUnique({
        where: { id: todoId },
        include: {
          parent: {
            include: {
              dependsOn: true,
              dependents: true,
              subtasks: true,
              parent: true,
            },
          },
        },
      });

      if (!todo || !todo.parent) {
        return null;
      }

      return mapToDomainTodo(todo.parent);
    });
  }

  async updateDueDate(
    todoId: string,
    dueDate: Date | undefined
  ): Promise<Todo> {
    return this.executePrismaOperation(async () => {
      const todo = await this.prisma.todo.update({
        where: { id: todoId },
        data: { dueDate },
        include: {
          dependsOn: true,
          dependents: true,
          subtasks: true,
          parent: true,
        },
      });

      return mapToDomainTodo(todo);
    });
  }

  async bulkUpdateDueDate(
    todoIds: string[],
    dueDate: Date | undefined
  ): Promise<number> {
    return this.executePrismaOperation(async () => {
      const result = await this.prisma.todo.updateMany({
        where: { id: { in: todoIds } },
        data: { dueDate },
      });

      return result.count;
    });
  }

  async getDependencyTree(todoId: string, maxDepth = -1): Promise<Todo[]> {
    return this.executePrismaOperation(async () => {
      const visited = new Set<string>();
      const result: Todo[] = [];

      const traverse = async (
        currentId: string,
        depth: number
      ): Promise<void> => {
        if (visited.has(currentId) || (maxDepth !== -1 && depth > maxDepth)) {
          return;
        }

        visited.add(currentId);

        const todo = await this.prisma.todo.findUnique({
          where: { id: currentId },
          include: {
            dependsOn: {
              include: {
                dependency: {
                  include: {
                    dependsOn: true,
                    dependents: true,
                    subtasks: true,
                    parent: true,
                  },
                },
              },
            },
            dependents: true,
            subtasks: true,
            parent: true,
          },
        });

        if (!todo) {
          return;
        }

        result.push(mapToDomainTodo(todo));

        for (const dep of todo.dependsOn) {
          await traverse(dep.dependencyId, depth + 1);
        }
      };

      await traverse(todoId, 0);
      return result;
    });
  }

  async findOverdueTodos(): Promise<Todo[]> {
    return this.executePrismaOperation(async () => {
      const now = new Date();
      const todos = await this.prisma.todo.findMany({
        where: {
          dueDate: { lt: now },
          status: { not: "completed" },
        },
        include: {
          dependsOn: true,
          dependents: true,
          subtasks: true,
          parent: true,
        },
      });

      return todos.map(mapToDomainTodo);
    });
  }

  async findTodosDueSoon(): Promise<Todo[]> {
    return this.executePrismaOperation(async () => {
      const now = new Date();
      const soon = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24時間以内
      const todos = await this.prisma.todo.findMany({
        where: {
          dueDate: {
            gte: now,
            lte: soon,
          },
          status: { not: "completed" },
        },
        include: {
          dependsOn: true,
          dependents: true,
          subtasks: true,
          parent: true,
        },
      });

      return todos.map(mapToDomainTodo);
    });
  }

  async findTodosByDueDateRange(
    startDate: Date,
    endDate: Date
  ): Promise<Todo[]> {
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
          subtasks: true,
          parent: true,
        },
      });

      return todos.map(mapToDomainTodo);
    });
  }
}
