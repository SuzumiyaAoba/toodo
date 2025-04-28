// filepath: /Users/suzumiyaaoba/ghq/github.com/SuzumiyaAoba/toodo/src/infrastructure/db.ts
import { PrismaClient } from "../generated/prisma";

/**
 * Singleton instance of the Prisma client
 */
export const prisma = new PrismaClient();
