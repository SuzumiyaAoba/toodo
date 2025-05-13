import type { Tag as PrismaTag } from "../../generated/prisma";

/**
 * Tag entity
 */
export interface Tag {
  id: string;
  name: string;
  color?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Convert PrismaTag to Tag domain entity
 */
export function mapToDomainTag(prismaTag: PrismaTag): Tag {
  return {
    id: prismaTag.id,
    name: prismaTag.name,
    color: prismaTag.color || undefined, // nullの場合はundefinedに変換
    createdAt: prismaTag.createdAt,
    updatedAt: prismaTag.updatedAt,
  };
}
