import { type Tag, mapToDomainTag } from "../../domain/entities/tag";
import type { TagRepository } from "../../domain/repositories/tag-repository";
import type { PrismaClient } from "../../generated/prisma";

/**
 * Prisma implementation of TagRepository
 */
export class PrismaTagRepository implements TagRepository {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async createTag(name: string, color?: string): Promise<Tag> {
    const tag = await this.prisma.tag.create({
      data: {
        name,
        color,
      },
    });

    return mapToDomainTag(tag);
  }

  async getTagById(id: string): Promise<Tag | null> {
    const tag = await this.prisma.tag.findUnique({
      where: {
        id,
      },
    });

    return tag ? mapToDomainTag(tag) : null;
  }

  async getTagByName(name: string): Promise<Tag | null> {
    const tag = await this.prisma.tag.findUnique({
      where: {
        name,
      },
    });

    return tag ? mapToDomainTag(tag) : null;
  }

  async getAllTags(): Promise<Tag[]> {
    const tags = await this.prisma.tag.findMany({
      orderBy: {
        name: "asc",
      },
    });

    return tags.map(mapToDomainTag);
  }

  async updateTag(id: string, name?: string, color?: string): Promise<Tag> {
    const tag = await this.prisma.tag.update({
      where: {
        id,
      },
      data: {
        ...(name && { name }),
        ...(color !== undefined && { color }),
      },
    });

    return mapToDomainTag(tag);
  }

  async deleteTag(id: string): Promise<void> {
    await this.prisma.tag.delete({
      where: {
        id,
      },
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
      where: {
        todoId,
      },
      include: {
        tag: true,
      },
    });

    return todoTags.map((todoTag) => mapToDomainTag(todoTag.tag));
  }

  async getTodoIdsForTag(tagId: string): Promise<string[]> {
    const todoTags = await this.prisma.todoTag.findMany({
      where: {
        tagId,
      },
      select: {
        todoId: true,
      },
    });

    return todoTags.map((todoTag) => todoTag.todoId);
  }
}
