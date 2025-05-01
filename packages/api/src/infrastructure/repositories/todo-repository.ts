import type { Todo } from "@toodo/core";
import { mapToDomainTodo } from "@toodo/core";
import { DependencyCycleError, SelfDependencyError, TodoNotFoundError } from "../../domain/errors/todo-errors";
import type { TodoRepository as TodoRepositoryInterface } from "../../domain/repositories/todo-repository";
import type { PrismaClient } from "../../generated/prisma";
import { handlePrismaError } from "../utils/error-handler";

export class TodoRepository implements TodoRepositoryInterface {
  constructor(private readonly prisma: PrismaClient = {} as PrismaClient) {}

  private async executePrismaOperation<T>(operation: () => Promise<T>, id?: string): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      throw handlePrismaError(error, "Todo", id);
    }
  }

  async findAll(): Promise<Todo[]> {
    return this.executePrismaOperation(async () => {
      const todos = await this.prisma.todo.findMany();
      return todos.map(mapToDomainTodo);
    });
  }

  async findById(id: string): Promise<Todo | null> {
    return this.executePrismaOperation(async () => {
      const todo = await this.prisma.todo.findUnique({
        where: { id },
      });
      return todo ? mapToDomainTodo(todo) : null;
    }, id);
  }

  async create(todo: Todo): Promise<Todo> {
    return this.executePrismaOperation(async () => {
      const created = await this.prisma.todo.create({
        data: {
          id: todo.id,
          title: todo.title,
          description: todo.description,
          status: todo.status,
          workState: todo.workState,
          totalWorkTime: todo.totalWorkTime,
          lastStateChangeAt: todo.lastStateChangeAt,
          priority: todo.priority,
          dueDate: todo.dueDate,
          createdAt: todo.createdAt,
          updatedAt: todo.updatedAt,
        },
      });
      return mapToDomainTodo(created);
    });
  }

  async update(id: string, todo: Partial<Omit<Todo, "id" | "createdAt" | "updatedAt">>): Promise<Todo | null> {
    return this.executePrismaOperation(async () => {
      const updated = await this.prisma.todo.update({
        where: { id },
        data: {
          title: todo.title,
          description: todo.description,
          status: todo.status,
          workState: todo.workState,
          totalWorkTime: todo.totalWorkTime,
          lastStateChangeAt: todo.lastStateChangeAt,
          priority: todo.priority,
          dueDate: todo.dueDate,
          updatedAt: new Date(),
        },
      });
      return mapToDomainTodo(updated);
    }, id);
  }

  async delete(id: string): Promise<void> {
    await this.executePrismaOperation(async () => {
      await this.prisma.todo.delete({
        where: { id },
      });
    }, id);
  }

  async findByProjectId(projectId: string): Promise<Todo[]> {
    return this.executePrismaOperation(async () => {
      const todos = await this.prisma.todo.findMany({
        where: { projectId },
      });
      return todos.map(mapToDomainTodo);
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
      });
      return todos.map(mapToDomainTodo);
    });
  }

  async addSubtask(parentId: string, subtaskId: string): Promise<void> {
    await this.executePrismaOperation(async () => {
      // 親タスクとサブタスクの存在確認
      const [parent, subtask] = await Promise.all([
        this.prisma.todo.findUnique({ where: { id: parentId } }),
        this.prisma.todo.findUnique({ where: { id: subtaskId } }),
      ]);

      if (!parent) {
        throw new TodoNotFoundError(parentId);
      }
      if (!subtask) {
        throw new TodoNotFoundError(subtaskId);
      }

      // 自己参照のチェック
      if (parentId === subtaskId) {
        throw new SelfDependencyError(parentId);
      }

      // サブタスクの循環参照をチェック
      const wouldCreateCycle = await this.checkForHierarchyCycle(subtaskId, parentId);
      if (wouldCreateCycle) {
        throw new DependencyCycleError(subtaskId, parentId);
      }

      await this.prisma.todo.update({
        where: { id: subtaskId },
        data: { parentId },
      });
    }, `${parentId}-${subtaskId}`);
  }

  async removeSubtask(parentId: string, subtaskId: string): Promise<void> {
    await this.executePrismaOperation(async () => {
      await this.prisma.todo.update({
        where: { id: subtaskId },
        data: { parentId: null },
      });
    }, `${parentId}-${subtaskId}`);
  }

  async checkForHierarchyCycle(todoId: string, potentialParentId: string): Promise<boolean> {
    return this.executePrismaOperation(async () => {
      // 現在のtodoIdから親をたどって、potentialParentIdが見つかるかチェック
      let currentId = potentialParentId;
      const visited = new Set<string>();

      while (currentId) {
        if (currentId === todoId) {
          return true; // 循環参照が見つかった
        }

        if (visited.has(currentId)) {
          return true; // 既に訪れたノードに到達（循環参照）
        }

        visited.add(currentId);

        const parent = await this.prisma.todo.findUnique({
          where: { id: currentId },
          select: { parentId: true },
        });

        if (!parent || !parent.parentId) {
          break;
        }

        currentId = parent.parentId;
      }

      return false;
    });
  }

  async findByParent(parentId: string): Promise<Todo[]> {
    return this.executePrismaOperation(async () => {
      const todos = await this.prisma.todo.findMany({
        where: { parentId },
        include: {
          dependsOn: true,
          dependents: true,
          subtasks: true,
        },
      });
      return todos.map(mapToDomainTodo);
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
      return todos.map(mapToDomainTodo);
    });
  }

  async findParent(todoId: string): Promise<Todo | null> {
    return this.executePrismaOperation(async () => {
      const todo = await this.prisma.todo.findUnique({
        where: { id: todoId },
        include: {
          parent: {
            include: {
              dependsOn: true,
              dependents: true,
              subtasks: true,
            },
          },
        },
      });
      return todo?.parent ? mapToDomainTodo(todo.parent) : null;
    });
  }

  async findByState(state: string): Promise<Todo[]> {
    return [];
  }

  async findByProject(projectId: string): Promise<Todo[]> {
    return [];
  }

  async findByTag(tagId: string): Promise<Todo[]> {
    return [];
  }

  async findUnassignedSubtasks(): Promise<Todo[]> {
    return [];
  }

  async findByStatus(status: string): Promise<Todo[]> {
    return [];
  }

  async findByPriority(priority: string): Promise<Todo[]> {
    return [];
  }

  async findByDependency(dependencyId: string): Promise<Todo[]> {
    return [];
  }

  async findByDependent(dependentId: string): Promise<Todo[]> {
    return [];
  }

  async findWithDueDateBefore(date: Date): Promise<Todo[]> {
    return [];
  }

  async findWithDueDateBetween(startDate: Date, endDate: Date): Promise<Todo[]> {
    return [];
  }

  async findChildrenTree(parentId: string, maxDepth?: number): Promise<Todo[]> {
    return [];
  }

  async updateParent(todoId: string, parentId: string | null): Promise<Todo> {
    return { id: todoId } as Todo;
  }

  async addDependency(todoId: string, dependencyId: string): Promise<void> {
    // 実装
  }

  async removeDependency(todoId: string, dependencyId: string): Promise<void> {
    // 実装
  }

  async findDependencies(todoId: string): Promise<Todo[]> {
    return [];
  }

  async findDependents(todoId: string): Promise<Todo[]> {
    return [];
  }

  async wouldCreateDependencyCycle(todoId: string, dependencyId: string): Promise<boolean> {
    const visited = new Set<string>();

    const checkCycle = async (currentId: string): Promise<boolean> => {
      if (currentId === todoId) {
        return true; // 循環参照を検出
      }

      if (visited.has(currentId)) {
        return false; // 既に訪れたノードだが、循環参照ではない
      }

      visited.add(currentId);

      const dependencies = await this.findDependencies(currentId);
      for (const dependency of dependencies) {
        if (await checkCycle(dependency.id)) {
          return true;
        }
      }

      return false;
    };

    return checkCycle(dependencyId);
  }

  async findOverdue(currentDate: Date = new Date()): Promise<Todo[]> {
    return [];
  }

  async findDueSoon(days = 7, currentDate: Date = new Date()): Promise<Todo[]> {
    return [];
  }

  async findByDueDateRange(startDate: Date, endDate: Date): Promise<Todo[]> {
    return [];
  }

  async findAllCompleted(): Promise<Todo[]> {
    return [];
  }

  async getSubtasks(todoId: string): Promise<Todo[]> {
    return this.findSubtasks(todoId);
  }

  async getParent(todoId: string): Promise<Todo | null> {
    return this.findParent(todoId);
  }

  async updateDueDate(todoId: string, dueDate: Date | undefined): Promise<Todo> {
    const updated = await this.update(todoId, { dueDate });
    if (!updated) {
      throw new TodoNotFoundError(todoId);
    }
    return updated;
  }

  async bulkUpdateDueDate(todoIds: string[], dueDate: Date | undefined): Promise<number> {
    const updates = todoIds.map((id) => this.updateDueDate(id, dueDate));
    const results = await Promise.all(updates);
    return results.length;
  }

  async hasDependency(todoId: string, dependencyId: string): Promise<boolean> {
    const dependencies = await this.findDependencies(todoId);
    return dependencies.some((dep) => dep.id === dependencyId);
  }

  async getDependencyTree(todoId: string, maxDepth = 10): Promise<Todo[]> {
    const visited = new Set<string>();
    const result: Todo[] = [];

    const traverse = async (id: string, depth: number): Promise<void> => {
      if (depth > maxDepth || visited.has(id)) return;
      visited.add(id);

      const dependencies = await this.findDependencies(id);
      result.push(...dependencies);

      for (const dep of dependencies) {
        await traverse(dep.id, depth + 1);
      }
    };

    await traverse(todoId, 0);
    return result;
  }

  async findOverdueTodos(): Promise<Todo[]> {
    return this.findOverdue();
  }

  async findTodosDueSoon(): Promise<Todo[]> {
    return this.findDueSoon();
  }

  async findTodosByDueDateRange(startDate: Date, endDate: Date): Promise<Todo[]> {
    return this.findByDueDateRange(startDate, endDate);
  }
}
