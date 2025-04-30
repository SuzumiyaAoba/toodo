import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test";
import { PrismaClient } from "../../generated/prisma";
import { PrismaTagRepository } from "./prisma-tag-repository";

describe("PrismaTagRepository", () => {
  let prisma: PrismaClient;
  let repository: PrismaTagRepository;

  beforeEach(() => {
    // PrismaClientをモック
    prisma = {
      tag: {
        create: mock(() => Promise.resolve({})),
        findUnique: mock(() => Promise.resolve(null)),
        findMany: mock(() => Promise.resolve([])),
        update: mock(() => Promise.resolve({})),
        delete: mock(() => Promise.resolve({})),
      },
      todoTag: {
        create: mock(() => Promise.resolve({})),
        delete: mock(() => Promise.resolve({})),
        findMany: mock(() => Promise.resolve([])),
      },
    } as unknown as PrismaClient;

    repository = new PrismaTagRepository(prisma);
  });

  afterEach(async () => {
    mock.restore();
  });

  describe("createTag", () => {
    it("should create a tag with name and color", async () => {
      const expectedTag = {
        id: "tag-id",
        name: "Work",
        color: "#FF5733",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // モックをセットアップ
      (prisma.tag.create as any).mockReturnValue(Promise.resolve(expectedTag));

      const tag = await repository.createTag("Work", "#FF5733");

      expect(tag.id).toBe(expectedTag.id);
      expect(tag.name).toBe(expectedTag.name);
      expect(tag.color).toBe(expectedTag.color);
      expect(prisma.tag.create).toHaveBeenCalledWith({
        data: {
          name: "Work",
          color: "#FF5733",
        },
      });
    });

    it("should create a tag with name only", async () => {
      const expectedTag = {
        id: "tag-id",
        name: "Personal",
        color: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.tag.create as any).mockReturnValue(Promise.resolve(expectedTag));

      const tag = await repository.createTag("Personal");

      expect(tag.id).toBe(expectedTag.id);
      expect(tag.name).toBe(expectedTag.name);
      expect(tag.color).toBeUndefined();
      expect(prisma.tag.create).toHaveBeenCalledWith({
        data: {
          name: "Personal",
          color: null,
        },
      });
    });
  });

  describe("getTagById", () => {
    it("should return a tag when found", async () => {
      const expectedTag = {
        id: "tag-id",
        name: "Work",
        color: "#FF5733",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.tag.findUnique as any).mockReturnValue(Promise.resolve(expectedTag));

      const tag = await repository.getTagById("tag-id");
      expect(tag).not.toBeNull();
      expect(tag?.id).toBe(expectedTag.id);
      expect(prisma.tag.findUnique).toHaveBeenCalledWith({
        where: {
          id: "tag-id",
        },
      });
    });

    it("should return null when tag not found", async () => {
      (prisma.tag.findUnique as any).mockReturnValue(Promise.resolve(null));

      const tag = await repository.getTagById("non-existent-id");
      expect(tag).toBeNull();
      expect(prisma.tag.findUnique).toHaveBeenCalledWith({
        where: {
          id: "non-existent-id",
        },
      });
    });
  });

  describe("getAllTags", () => {
    it("should return all tags", async () => {
      const expectedTags = [
        {
          id: "tag-id-1",
          name: "Work",
          color: "#FF5733",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "tag-id-2",
          name: "Personal",
          color: "#33FF57",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      (prisma.tag.findMany as any).mockReturnValue(Promise.resolve(expectedTags));

      const tags = await repository.getAllTags();
      expect(tags.length).toBe(2);
      expect(tags[0]?.id).toBe(expectedTags[0]!.id);
      expect(tags[1]?.id).toBe(expectedTags[1]!.id);
      expect(prisma.tag.findMany).toHaveBeenCalledWith({
        orderBy: {
          name: "asc",
        },
      });
    });
  });

  describe("assignTagToTodo", () => {
    it("should assign a tag to a todo", async () => {
      await repository.assignTagToTodo("todo-id", "tag-id");

      expect(prisma.todoTag.create).toHaveBeenCalledWith({
        data: {
          todoId: "todo-id",
          tagId: "tag-id",
        },
      });
    });
  });

  describe("getTagsForTodo", () => {
    it("should return tags for a todo", async () => {
      const todoTags = [
        {
          todoId: "todo-id",
          tagId: "tag-id-1",
          assignedAt: new Date(),
          tag: {
            id: "tag-id-1",
            name: "Work",
            color: "#FF5733",
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        },
        {
          todoId: "todo-id",
          tagId: "tag-id-2",
          assignedAt: new Date(),
          tag: {
            id: "tag-id-2",
            name: "Personal",
            color: "#33FF57",
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        },
      ];

      (prisma.todoTag.findMany as any).mockReturnValue(Promise.resolve(todoTags));

      const tags = await repository.getTagsForTodo("todo-id");
      expect(tags.length).toBe(2);
      expect(tags[0]?.id).toBe("tag-id-1");
      expect(tags[1]?.id).toBe("tag-id-2");
      expect(prisma.todoTag.findMany).toHaveBeenCalledWith({
        where: {
          todoId: "todo-id",
        },
        include: {
          tag: true,
        },
      });
    });
  });
});
