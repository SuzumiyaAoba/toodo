import type { Tag as CoreTag } from "@toodo/core";
import type { Tag as PrismaTag } from "../../generated/prisma";

/**
 * Tag ID type
 */
export type TagId = string;

/**
 * Tag entity
 */
export interface Tag extends CoreTag {
  id: string;
  name: string;
  color?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Convert PrismaTag to Tag domain entity
 */
export const mapToDomainTag = (prismaTag: PrismaTag): Tag => ({
  id: prismaTag.id,
  name: prismaTag.name,
  color: prismaTag.color ?? undefined,
  createdAt: prismaTag.createdAt,
  updatedAt: prismaTag.updatedAt,
});
