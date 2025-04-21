import { beforeEach, describe, expect, it, mock, spyOn } from "bun:test";
import { PrismaClient } from "../../generated/prisma";
import * as errorHandler from "../utils/error-handler";
import { PrismaBaseRepository } from "./prisma-base-repository";

// Create a concrete implementation of the abstract class for testing
class TestPrismaRepository<T> extends PrismaBaseRepository<T, T> {
  constructor(prisma: PrismaClient, entityType: "Todo" | "TodoActivity" | "Tag") {
    super(prisma, entityType);
  }

  protected mapToDomain(prismaModel: T): T {
    return prismaModel;
  }

  // Expose protected methods for testing
  public async testExecutePrismaOperation<R>(operation: () => Promise<R>, entityId?: string): Promise<R> {
    return this.executePrismaOperation(operation, entityId);
  }

  public testMapToDomainArray(prismaModels: T[]): T[] {
    return this.mapToDomainArray(prismaModels);
  }
}

describe("PrismaBaseRepository", () => {
  let prisma: PrismaClient;
  let repository: TestPrismaRepository<{ id: string; name: string }>;

  beforeEach(() => {
    prisma = {
      // TypeScriptの型エラーを回避するために必要最小限のモックオブジェクトを作成
    } as unknown as PrismaClient;

    repository = new TestPrismaRepository(prisma, "Todo");
  });

  describe("mapToDomainArray", () => {
    it("should map an array of Prisma models to domain entities", () => {
      // Arrange
      const mockModels = [
        { id: "1", name: "Item 1" },
        { id: "2", name: "Item 2" },
      ];
      const mapToDomainSpy = spyOn(repository, "mapToDomain");

      // Act
      const result = repository.testMapToDomainArray(mockModels);

      // Assert
      expect(result).toEqual(mockModels);
      expect(mapToDomainSpy).toHaveBeenCalledTimes(2);
      expect(mapToDomainSpy).toHaveBeenCalledWith(mockModels[0]);
      expect(mapToDomainSpy).toHaveBeenCalledWith(mockModels[1]);
    });
  });

  describe("executePrismaOperation", () => {
    it("should execute the operation and return its result when successful", async () => {
      // Arrange
      const expectedResult = { id: "1", name: "Success" };
      const operation = mock(() => Promise.resolve(expectedResult));

      // Act
      const result = await repository.testExecutePrismaOperation(operation);

      // Assert
      expect(result).toEqual(expectedResult);
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it("should handle errors by calling handlePrismaError", async () => {
      // Arrange
      const error = new Error("Test error");
      const operation = mock(() => Promise.reject(error));
      const entityId = "test-id";

      // spyを使ってhandlePrismaErrorをテスト
      const handlePrismaErrorSpy = spyOn(errorHandler, "handlePrismaError").mockImplementation(() => {
        throw new Error("Mocked error");
      });

      // Act & Assert
      await expect(repository.testExecutePrismaOperation(operation, entityId)).rejects.toThrow("Mocked error");

      // Verify handlePrismaError was called with correct parameters
      expect(handlePrismaErrorSpy).toHaveBeenCalledWith(error, "Todo", entityId);

      // Clean up the spy
      handlePrismaErrorSpy.mockRestore();
    });
  });
});
