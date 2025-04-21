import { describe, expect, it } from "bun:test";

import { mapToDomainTag } from "./tag";

describe("Tag Entity", () => {
  describe("mapToDomainTag", () => {
    it("should map PrismaTag to Tag domain entity", () => {
      const prismaTag = {
        id: "tag-id",
        name: "Work",
        color: "#FF5733",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const tag = mapToDomainTag(prismaTag);

      expect(tag.id).toBe(prismaTag.id);
      expect(tag.name).toBe(prismaTag.name);
      expect(tag.color).toBe(prismaTag.color);
      expect(tag.createdAt).toBe(prismaTag.createdAt);
      expect(tag.updatedAt).toBe(prismaTag.updatedAt);
    });

    it("should handle undefined color", () => {
      const prismaTag = {
        id: "tag-id",
        name: "Home",
        color: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const tag = mapToDomainTag(prismaTag);

      expect(tag.id).toBe(prismaTag.id);
      expect(tag.name).toBe(prismaTag.name);
      expect(tag.color).toBeUndefined();
      expect(tag.createdAt).toBe(prismaTag.createdAt);
      expect(tag.updatedAt).toBe(prismaTag.updatedAt);
    });
  });
});
