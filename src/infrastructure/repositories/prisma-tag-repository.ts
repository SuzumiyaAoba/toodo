import { type Tag, mapToDomainTag } from "../../domain/entities/tag";
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
}
