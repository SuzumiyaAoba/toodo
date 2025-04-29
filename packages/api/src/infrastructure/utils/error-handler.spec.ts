import { describe, expect, it } from "bun:test";
import { ProjectNameExistsError, ProjectNotFoundError } from "../../domain/errors/project-errors";
import { TagNameExistsError, TagNotFoundError } from "../../domain/errors/tag-errors";
import { TodoActivityNotFoundError, TodoNotFoundError } from "../../domain/errors/todo-errors";
import { PrismaClientKnownRequestError } from "../../generated/prisma/runtime/library";
import { handlePrismaError } from "./error-handler";

describe("handlePrismaError", () => {
  it("should convert P2025 error to TodoNotFoundError for Todo entity", () => {
    // Arrange
    const error = new PrismaClientKnownRequestError("Record not found", {
      code: "P2025",
      clientVersion: "4.0.0",
    });
    const entityId = "test-todo-id";

    // Act & Assert
    expect(() => {
      handlePrismaError(error, "Todo", entityId);
    }).toThrow(TodoNotFoundError);
  });

  it("should convert P2025 error to TodoActivityNotFoundError for TodoActivity entity", () => {
    // Arrange
    const error = new PrismaClientKnownRequestError("Record not found", {
      code: "P2025",
      clientVersion: "4.0.0",
    });
    const entityId = "test-activity-id";

    // Act & Assert
    expect(() => {
      handlePrismaError(error, "TodoActivity", entityId);
    }).toThrow(TodoActivityNotFoundError);
  });

  it("should convert P2025 error to TagNotFoundError for Tag entity", () => {
    // Arrange
    const error = new PrismaClientKnownRequestError("Record not found", {
      code: "P2025",
      clientVersion: "4.0.0",
    });
    const entityId = "test-tag-id";

    // Act & Assert
    expect(() => {
      handlePrismaError(error, "Tag", entityId);
    }).toThrow(TagNotFoundError);
  });

  it("should convert P2025 error to ProjectNotFoundError for Project entity", () => {
    // Arrange
    const error = new PrismaClientKnownRequestError("Record not found", {
      code: "P2025",
      clientVersion: "4.0.0",
    });
    const entityId = "test-project-id";

    // Act & Assert
    expect(() => {
      handlePrismaError(error, "Project", entityId);
    }).toThrow(ProjectNotFoundError);
  });

  it("should convert P2002 error to TagNameExistsError for Tag entity with name constraint", () => {
    // Arrange
    const error = new PrismaClientKnownRequestError("Unique constraint violation", {
      code: "P2002",
      clientVersion: "4.0.0",
      meta: { target: ["name"] },
    });

    // Act & Assert
    expect(() => {
      handlePrismaError(error, "Tag");
    }).toThrow(TagNameExistsError);
  });

  it("should convert P2002 error to ProjectNameExistsError for Project entity with name constraint", () => {
    // Arrange
    const error = new PrismaClientKnownRequestError("Unique constraint violation", {
      code: "P2002",
      clientVersion: "4.0.0",
      meta: { target: ["name"] },
    });

    // Act & Assert
    expect(() => {
      handlePrismaError(error, "Project");
    }).toThrow(ProjectNameExistsError);
  });

  it("should rethrow unknown errors", () => {
    // Arrange
    const error = new Error("Unknown error");

    // Act & Assert
    expect(() => {
      handlePrismaError(error, "Todo");
    }).toThrow(error);
  });
});
