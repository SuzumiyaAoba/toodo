import type { Tag } from "@toodo/core";
import type { TagRepository } from "../../domain/repositories/tag-repository";
import type { PrismaClient } from "../../generated/prisma";
import type { Tag as PrismaTag } from "../../generated/prisma";
import { PrismaBaseRepository } from "./prisma-base-repository";

/**
 * Prisma implementation of TagRepository
 */
export class PrismaTagRepository extends PrismaBaseRepository<Tag, PrismaTag> implements TagRepository {
  constructor(prisma: PrismaClient) {
    super(prisma, "Tag");
  }

  /**
   * Map a Prisma Tag model to a domain Tag entity
   */
  protected mapToDomain(entity: PrismaTag): Tag {
    return {
      id: entity.id,
      name: entity.name,
      color: entity.color ?? undefined,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  protected mapToPrisma(entity: Tag): Omit<PrismaTag, "todos"> {
    return {
      id: entity.id,
      name: entity.name,
      color: entity.color ?? null,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  async createTag(name: string, color?: string): Promise<Tag> {
    return this.executePrismaOperation(async () => {
      const tag = await this.prisma.tag.create({
        data: {
          name,
          color: color ?? null,
        },
      });

      return this.mapToDomain(tag);
    });
  }

  async getTagByName(name: string): Promise<Tag | null> {
    return this.executePrismaOperation(async () => {
      const tag = await this.prisma.tag.findFirst({
        where: { name },
      });

      return tag ? this.mapToDomain(tag) : null;
    });
  }

  async getAllTags(): Promise<Tag[]> {
    return this.executePrismaOperation(async () => {
      const tags = await this.prisma.tag.findMany({
        orderBy: {
          name: "asc",
        },
      });
      return tags.map((tag) => this.mapToDomain(tag));
    });
  }

  async updateTag(id: string, name?: string, color?: string): Promise<Tag> {
    return this.executePrismaOperation(async () => {
      const tag = await this.prisma.tag.update({
        where: { id },
        data: {
          name,
          color: color ?? null,
        },
      });

      return this.mapToDomain(tag);
    });
  }

  async deleteTag(id: string): Promise<void> {
    await this.executePrismaOperation(async () => {
      await this.prisma.tag.delete({
        where: { id },
      });
    });
  }

  async assignTagToTodo(todoId: string, tagId: string): Promise<void> {
    await this.executePrismaOperation(async () => {
      await this.prisma.todoTag.create({
        data: {
          todoId,
          tagId,
        },
      });
    });
  }

  async removeTagFromTodo(todoId: string, tagId: string): Promise<void> {
    await this.executePrismaOperation(async () => {
      await this.prisma.todoTag.delete({
        where: {
          todoId_tagId: {
            todoId,
            tagId,
          },
        },
      });
    });
  }

  async getTagsForTodo(todoId: string): Promise<Tag[]> {
    return this.executePrismaOperation(async () => {
      const todoTags = await this.prisma.todoTag.findMany({
        where: {
          todoId,
        },
        include: {
          tag: true,
        },
      });

      return todoTags.map((todoTag) => this.mapToDomain(todoTag.tag));
    });
  }

  async getTodoIdsForTag(tagId: string): Promise<string[]> {
    return this.executePrismaOperation(async () => {
      const todoTags = await this.prisma.todoTag.findMany({
        where: { tagId },
        select: { todoId: true },
      });

      return todoTags.map((todoTag) => todoTag.todoId);
    });
  }

  async getTodoIdsWithAllTags(tagIds: string[]): Promise<string[]> {
    return this.executePrismaOperation(async () => {
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
    });
  }

  async getTodoIdsWithAnyTag(tagIds: string[]): Promise<string[]> {
    return this.executePrismaOperation(async () => {
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
    });
  }

  async bulkAssignTagToTodos(tagId: string, todoIds: string[]): Promise<number> {
    return this.executePrismaOperation(async () => {
      const result = await this.prisma.$transaction(async (tx) => {
        // 存在するTodoのみを取得
        const existingTodos = await tx.todo.findMany({
          where: {
            id: {
              in: todoIds,
            },
          },
          select: {
            id: true,
          },
        });

        const validTodoIds = existingTodos.map((todo) => todo.id);

        // 既存の関連を取得
        const existingTags = await tx.todoTag.findMany({
          where: {
            todoId: {
              in: validTodoIds,
            },
            tagId,
          },
          select: {
            todoId: true,
          },
        });

        const existingTodoIds = new Set(existingTags.map((tag) => tag.todoId));

        // 新しい関連のみを作成
        const createPromises = validTodoIds
          .filter((todoId) => !existingTodoIds.has(todoId))
          .map((todoId) =>
            tx.todoTag.create({
              data: {
                todoId,
                tagId,
              },
            }),
          );

        await Promise.all(createPromises);
        return validTodoIds.length;
      });

      return result;
    });
  }

  async bulkRemoveTagFromTodos(tagId: string, todoIds: string[]): Promise<number> {
    return this.executePrismaOperation(async () => {
      const result = await this.prisma.$transaction(async (tx) => {
        // 存在する関連のみを削除
        const existingTags = await tx.todoTag.findMany({
          where: {
            todoId: {
              in: todoIds,
            },
            tagId,
          },
          select: {
            todoId: true,
          },
        });

        const successCount = existingTags.length;

        if (successCount > 0) {
          await tx.todoTag.deleteMany({
            where: {
              todoId: {
                in: existingTags.map((tag) => tag.todoId),
              },
              tagId,
            },
          });
        }

        return successCount;
      });

      return result;
    });
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
    return this.executePrismaOperation(async () => {
      const tags = await this.prisma.tag.findMany({
        include: {
          _count: {
            select: {
              todos: true,
            },
          },
          todos: {
            include: {
              todo: {
                select: {
                  status: true,
                },
              },
            },
          },
        },
      });

      return tags.map((tag) => ({
        id: tag.id,
        name: tag.name,
        color: tag.color,
        usageCount: tag._count.todos,
        pendingTodoCount: tag.todos.filter((todoTag) => todoTag.todo.status === "PENDING").length,
        completedTodoCount: tag.todos.filter((todoTag) => todoTag.todo.status === "COMPLETED").length,
      }));
    });
  }

  // --- TagRepository interface compatibility methods ---
  async findAll(): Promise<Tag[]> {
    return this.executePrismaOperation(async () => {
      const tags = await this.prisma.tag.findMany();
      return tags.map((tag) => this.mapToDomain(tag));
    });
  }

  async findById(id: string): Promise<Tag | null> {
    return this.executePrismaOperation(async () => {
      const tag = await this.prisma.tag.findUnique({
        where: { id },
      });

      return tag ? this.mapToDomain(tag) : null;
    });
  }

  async create(tag: Tag): Promise<Tag> {
    return this.executePrismaOperation(async () => {
      const createdTag = await this.prisma.tag.create({
        data: this.mapToPrisma(tag),
      });

      return this.mapToDomain(createdTag);
    });
  }

  async update(tag: Tag): Promise<Tag> {
    return this.executePrismaOperation(async () => {
      const updatedTag = await this.prisma.tag.update({
        where: { id: tag.id },
        data: this.mapToPrisma(tag),
      });

      return this.mapToDomain(updatedTag);
    });
  }

  async delete(id: string): Promise<void> {
    await this.executePrismaOperation(async () => {
      await this.prisma.tag.delete({
        where: { id },
      });
    });
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

  // getTagByIdをfindByIdのエイリアスにする
  getTagById = this.findById;
}
