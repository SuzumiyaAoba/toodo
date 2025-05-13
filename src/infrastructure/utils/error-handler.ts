import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { TagNameExistsError, TagNotFoundError } from "../../domain/errors/tag-errors";
import {
  TodoActivityNotFoundError,
  TodoNotFoundError,
  UnauthorizedActivityDeletionError,
} from "../../domain/errors/todo-errors";

type EntityType = "Todo" | "TodoActivity" | "Tag";

/**
 * Converts Prisma errors to domain-specific errors
 * @param error The error thrown by Prisma
 * @param entityType The type of entity being operated on
 * @param entityId Optional ID of the entity
 * @returns Never - this function always throws an error
 */
export function handlePrismaError(error: unknown, entityType: EntityType, entityId?: string): never {
  // Handle Prisma known errors
  if (error instanceof PrismaClientKnownRequestError) {
    // P2025: Record not found
    if (error.code === "P2025") {
      switch (entityType) {
        case "Todo":
          throw new TodoNotFoundError(entityId || "unknown");
        case "TodoActivity":
          throw new TodoActivityNotFoundError(entityId || "unknown");
        case "Tag":
          throw new TagNotFoundError(entityId || "unknown");
      }
    }

    // P2002: Unique constraint violation
    if (error.code === "P2002") {
      const target = error.meta?.target as string[] | undefined;
      if (entityType === "Tag" && target?.includes("name")) {
        // Extract the value that caused the violation from the error message or meta
        const nameValue = typeof error.meta?.target === "string" ? error.meta.target : "unknown";
        throw new TagNameExistsError(nameValue);
      }
    }
  }

  // If we couldn't handle the error specifically, re-throw it
  throw error;
}
