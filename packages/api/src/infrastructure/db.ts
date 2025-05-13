// filepath: /Users/suzumiyaaoba/ghq/github.com/SuzumiyaAoba/toodo/src/infrastructure/db.ts
import { PrismaClient } from "../generated/prisma";

/**
 * Prismaクライアントのシングルトンインスタンス
 */
export const prisma = new PrismaClient();
