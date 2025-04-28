import type { PrismaClient } from "../../generated/prisma";
import { handlePrismaError } from "../utils/error-handler";

type EntityType = "Todo" | "TodoActivity" | "Tag";

/**
 * Base repository class for Prisma repositories
 * Provides common functionality for all repositories
 */
export abstract class PrismaBaseRepository<TDomain, TPrisma> {
  constructor(
    protected prisma: PrismaClient,
    protected entityType: EntityType,
  ) {}

  /**
   * Map a Prisma model to a domain entity
   * @param prismaModel The Prisma model to map
   * @returns The mapped domain entity
   */
  protected abstract mapToDomain(prismaModel: TPrisma): TDomain;

  /**
   * Map an array of Prisma models to domain entities
   * @param prismaModels The Prisma models to map
   * @returns The mapped domain entities
   */
  protected mapToDomainArray(prismaModels: TPrisma[]): TDomain[] {
    return prismaModels.map((model) => this.mapToDomain(model));
  }

  /**
   * Safely execute a Prisma operation with proper error handling
   * @param operation The operation to execute
   * @param entityId Optional ID of the entity being operated on
   * @returns The result of the operation
   */
  protected async executePrismaOperation<T>(operation: () => Promise<T>, entityId?: string): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      handlePrismaError(error, this.entityType, entityId);
    }
  }
}
