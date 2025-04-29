import type { Tag } from "@toodo/core";
import type { TagRepository as TagRepositoryInterface } from "../../domain/repositories/tag-repository";
import type { PrismaClient } from "../../generated/prisma";

export class TagRepository implements TagRepositoryInterface {
  constructor(private readonly prisma: PrismaClient = {} as PrismaClient) {}

  async createTag(name: string, color?: string | null): Promise<Tag> {
    return this.prisma.tag.create({
      data: {
        name,
        color: color ?? null,
      },
    });
  }

  async getTagById(id: string): Promise<Tag | null> {
    return this.prisma.tag.findUnique({
      where: { id },
    });
  }

  async getTagByName(name: string): Promise<Tag | null> {
    return this.prisma.tag.findUnique({
      where: { name },
    });
  }

  async getAllTags(): Promise<Tag[]> {
    return this.prisma.tag.findMany();
  }

  async updateTag(id: string, name?: string, color?: string | null): Promise<Tag> {
    return this.prisma.tag.update({
      where: { id },
      data: {
        name,
        color,
      },
    });
  }

  async deleteTag(id: string): Promise<void> {
    await this.prisma.tag.delete({
      where: { id },
    });
  }

  async assignTagToTodo(todoId: string, tagId: string): Promise<void> {
    await this.prisma.todoTag.create({
      data: {
        todoId,
        tagId,
      },
    });
  }

  async removeTagFromTodo(todoId: string, tagId: string): Promise<void> {
    await this.prisma.todoTag.delete({
      where: {
        todoId_tagId: {
          todoId,
          tagId,
        },
      },
    });
  }

  async getTagsForTodo(todoId: string): Promise<Tag[]> {
    const todoTags = await this.prisma.todoTag.findMany({
      where: { todoId },
      select: {
        tag: {
          select: {
            id: true,
            name: true,
            color: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });
    return todoTags.map((todoTag) => todoTag.tag);
  }

  async getTodoIdsForTag(tagId: string): Promise<string[]> {
    const todoTags = await this.prisma.todoTag.findMany({
      where: { tagId },
      select: { todoId: true },
    });
    return todoTags.map((todoTag) => todoTag.todoId);
  }

  async getTodoIdsWithAllTags(tagIds: string[]): Promise<string[]> {
    const todos = await this.prisma.todo.findMany({
      where: {
        tags: {
          every: {
            tagId: {
              in: tagIds,
            },
          },
        },
      },
      select: { id: true },
    });
    return todos.map((todo) => todo.id);
  }

  async getTodoIdsWithAnyTag(tagIds: string[]): Promise<string[]> {
    const todos = await this.prisma.todo.findMany({
      where: {
        tags: {
          some: {
            tagId: {
              in: tagIds,
            },
          },
        },
      },
      select: { id: true },
    });
    return todos.map((todo) => todo.id);
  }

  async bulkAssignTagToTodos(tagId: string, todoIds: string[]): Promise<number> {
    const result = await this.prisma.todoTag.createMany({
      data: todoIds.map((todoId) => ({
        todoId,
        tagId,
      })),
    });
    return result.count;
  }

  async bulkRemoveTagFromTodos(tagId: string, todoIds: string[]): Promise<number> {
    const result = await this.prisma.todoTag.deleteMany({
      where: {
        tagId,
        todoId: {
          in: todoIds,
        },
      },
    });
    return result.count;
  }

  async getTagStatistics(): Promise<
    Array<{
      id: string;
      name: string;
      color: string | null;
      usageCount: number;
      pendingTodoCount: number;
      completedTodoCount: number;
    }>
  > {
    const tags = await this.prisma.tag.findMany({
      select: {
        id: true,
        name: true,
        color: true,
        todos: {
          select: {
            todo: {
              select: {
                status: true,
              },
            },
          },
        },
        _count: {
          select: {
            todos: true,
          },
        },
      },
    });

    return tags.map((tag) => ({
      id: tag.id,
      name: tag.name,
      color: tag.color,
      usageCount: tag._count.todos,
      pendingTodoCount: tag.todos.filter((todoTag) => todoTag.todo.status === "pending").length,
      completedTodoCount: tag.todos.filter((todoTag) => todoTag.todo.status === "completed").length,
    }));
  }

  // Legacy methods
  async findAll(): Promise<Tag[]> {
    return this.getAllTags();
  }

  async findById(id: string): Promise<Tag | null> {
    return this.getTagById(id);
  }

  async create(tag: Tag): Promise<Tag> {
    return this.createTag(tag.name, tag.color);
  }

  async update(tag: Tag): Promise<Tag> {
    return this.updateTag(tag.id, tag.name, tag.color);
  }

  async delete(id: string): Promise<void> {
    return this.deleteTag(id);
  }

  async findByName(name: string): Promise<Tag | null> {
    return this.getTagByName(name);
  }

  async getTodosByTagId(id: string): Promise<string[]> {
    return this.getTodoIdsForTag(id);
  }

  async addTagToTodo(tagId: string, todoId: string): Promise<void> {
    return this.assignTagToTodo(todoId, tagId);
  }
}
