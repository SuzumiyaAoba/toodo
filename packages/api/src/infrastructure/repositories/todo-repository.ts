import type { Todo } from "@toodo/core";
import type { TodoRepository as TodoRepositoryInterface } from "../../domain/repositories/todo-repository";
import type { PrismaClient } from "../../generated/prisma";

export class TodoRepository implements TodoRepositoryInterface {
  constructor(private readonly prisma: PrismaClient = {} as PrismaClient) {}

  async findAll(): Promise<Todo[]> {
    return [];
  }

  async findById(id: string): Promise<Todo | null> {
    return null;
  }

  async create(todo: Todo): Promise<Todo> {
    return todo;
  }

  async update(id: string, todo: Partial<Omit<Todo, "id" | "createdAt" | "updatedAt">>): Promise<Todo | null> {
    return { ...todo, id } as Todo;
  }

  async delete(id: string): Promise<void> {
    // 削除処理
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

  async findSubtasks(parentId: string): Promise<Todo[]> {
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

  async findByParent(parentId: string): Promise<Todo[]> {
    return [];
  }

  async findChildrenTree(parentId: string, maxDepth?: number): Promise<Todo[]> {
    return [];
  }

  async updateParent(todoId: string, parentId: string | null): Promise<Todo> {
    return { id: todoId } as Todo;
  }

  async addSubtask(parentId: string, subtaskId: string): Promise<void> {
    // 実装
  }

  async removeSubtask(parentId: string, subtaskId: string): Promise<void> {
    // 実装
  }

  async checkForHierarchyCycle(todoId: string, potentialParentId: string): Promise<boolean> {
    return false;
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
    return false;
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

  async findByProjectId(projectId: string): Promise<Todo[]> {
    return this.findByProject(projectId);
  }

  async findByTagId(tagId: string): Promise<Todo[]> {
    return this.findByTag(tagId);
  }
}
