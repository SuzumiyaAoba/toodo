import { type Tag, mapToDomainTag } from "../../domain/entities/tag";
import { TodoStatus } from "../../domain/entities/todo";
import { TagNotFoundError } from "../../domain/errors/tag-errors";
import type { TagRepository } from "../../domain/repositories/tag-repository";
import type { PrismaClient, Tag as PrismaTag } from "../../generated/prisma";
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
  protected mapToDomain(prismaTag: PrismaTag): Tag {
    return mapToDomainTag(prismaTag);
  }

  async createTag(name: string, color?: string): Promise<Tag> {
    return this.executePrismaOperation(async () => {
      const tag = await this.prisma.tag.create({
        data: {
          name,
          color,
        },
      });
      return this.mapToDomain(tag);
    });
  }

  async getTagById(id: string): Promise<Tag | null> {
    return this.executePrismaOperation(async () => {
      const tag = await this.prisma.tag.findUnique({
        where: { id },
      });
      return tag ? this.mapToDomain(tag) : null;
    }, id);
  }

  async getTagByName(name: string): Promise<Tag | null> {
    return this.executePrismaOperation(async () => {
      const tag = await this.prisma.tag.findUnique({
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
      return this.mapToDomainArray(tags);
    });
  }

  async updateTag(id: string, name?: string, color?: string): Promise<Tag> {
    return this.executePrismaOperation(async () => {
      const tag = await this.prisma.tag.update({
        where: { id },
        data: {
          ...(name !== undefined && { name }),
          ...(color !== undefined && { color }),
        },
      });
      return this.mapToDomain(tag);
    }, id);
  }

  async deleteTag(id: string): Promise<void> {
    return this.executePrismaOperation(async () => {
      // Check if tag exists before deleting
      const tag = await this.prisma.tag.findUnique({
        where: { id },
      });

      if (!tag) {
        throw new TagNotFoundError(id);
      }

      await this.prisma.tag.delete({
        where: { id },
      });
    }, id);
  }

  async assignTagToTodo(todoId: string, tagId: string): Promise<void> {
    return this.executePrismaOperation(async () => {
      await this.prisma.todoTag.create({
        data: {
          todoId,
          tagId,
        },
      });
    });
  }

  async removeTagFromTodo(todoId: string, tagId: string): Promise<void> {
    return this.executePrismaOperation(async () => {
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
        where: { todoId },
        include: { tag: true },
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
    }, tagId);
  }

  async getTodoIdsWithAllTags(tagIds: string[]): Promise<string[]> {
    return this.executePrismaOperation(async () => {
      // 効率的な実装のためにRaw SQLを使用
      // 指定されたすべてのタグを持つTodoを取得
      const todos = await this.prisma.$queryRaw<Array<{ todoId: string }>>`
        SELECT tt.todoId
        FROM TodoTag tt
        WHERE tt.tagId IN (${tagIds.join(",")})
        GROUP BY tt.todoId
        HAVING COUNT(DISTINCT tt.tagId) = ${tagIds.length}
      `;

      return todos.map((todo) => todo.todoId);
    });
  }

  async getTodoIdsWithAnyTag(tagIds: string[]): Promise<string[]> {
    return this.executePrismaOperation(async () => {
      const todoTags = await this.prisma.todoTag.findMany({
        where: {
          tagId: {
            in: tagIds,
          },
        },
        distinct: ["todoId"],
        select: {
          todoId: true,
        },
      });

      return todoTags.map((todoTag) => todoTag.todoId);
    });
  }

  async bulkAssignTagToTodos(tagId: string, todoIds: string[]): Promise<number> {
    return this.executePrismaOperation(async () => {
      // 既存の関連を取得して、重複を避ける
      const existingRelations = await this.prisma.todoTag.findMany({
        where: {
          tagId,
          todoId: {
            in: todoIds,
          },
        },
        select: {
          todoId: true,
        },
      });

      const existingTodoIds = new Set(existingRelations.map((rel) => rel.todoId));
      const newTodoIds = todoIds.filter((id) => !existingTodoIds.has(id));

      if (newTodoIds.length === 0) {
        return 0;
      }

      // 新しい関連を一括作成
      const result = await this.prisma.todoTag.createMany({
        data: newTodoIds.map((todoId) => ({
          todoId,
          tagId,
        })),
      });

      return result.count;
    });
  }

  async bulkRemoveTagFromTodos(tagId: string, todoIds: string[]): Promise<number> {
    return this.executePrismaOperation(async () => {
      // 削除対象の関連を取得
      const relations = await this.prisma.todoTag.findMany({
        where: {
          tagId,
          todoId: {
            in: todoIds,
          },
        },
      });

      if (relations.length === 0) {
        return 0;
      }

      // 関連を一括削除
      await this.prisma.todoTag.deleteMany({
        where: {
          tagId,
          todoId: {
            in: todoIds,
          },
        },
      });

      return relations.length;
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
      // すべてのタグを取得
      const tags = await this.prisma.tag.findMany();

      // タグごとの統計情報を収集
      const statistics = await Promise.all(
        tags.map(async (tag) => {
          // タグが付けられたすべてのTodoを取得
          const todoTags = await this.prisma.todoTag.findMany({
            where: { tagId: tag.id },
            include: { todo: true },
          });

          const usageCount = todoTags.length;
          const pendingTodoCount = todoTags.filter((tt) => tt.todo.status === TodoStatus.PENDING).length;
          const completedTodoCount = todoTags.filter((tt) => tt.todo.status === TodoStatus.COMPLETED).length;

          return {
            id: tag.id,
            name: tag.name,
            color: tag.color,
            usageCount,
            pendingTodoCount,
            completedTodoCount,
          };
        }),
      );

      // 使用頻度順にソート
      return statistics.sort((a, b) => b.usageCount - a.usageCount);
    });
  }
}
