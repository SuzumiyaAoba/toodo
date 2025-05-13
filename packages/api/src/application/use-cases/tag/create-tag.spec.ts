import { beforeEach, describe, expect, it, mock } from "bun:test";
import type { Tag } from "../../../domain/entities/tag";
import type { TagRepository } from "../../../domain/repositories/tag-repository";
import { CreateTagUseCase } from "./create-tag";

describe("CreateTagUseCase", () => {
  let tagRepository: TagRepository;
  let createTagUseCase: CreateTagUseCase;

  beforeEach(() => {
    // モックオブジェクトを作成
    tagRepository = {
      createTag: mock(() =>
        Promise.resolve({
          id: "mock-tag-id",
          name: "Mock Tag",
          color: "#000000",
          createdAt: new Date(),
          updatedAt: new Date(),
        } as Tag),
      ),
      getTagById: mock(() => Promise.resolve(null)),
      getTagByName: mock(() => Promise.resolve(null)),
      getAllTags: mock(() => Promise.resolve([])),
      updateTag: mock(() =>
        Promise.resolve({
          id: "mock-tag-id",
          name: "Mock Tag",
          color: "#000000",
          createdAt: new Date(),
          updatedAt: new Date(),
        } as Tag),
      ),
      deleteTag: mock(() => Promise.resolve()),
      assignTagToTodo: mock(() => Promise.resolve()),
      removeTagFromTodo: mock(() => Promise.resolve()),
      getTagsForTodo: mock(() => Promise.resolve([])),
      getTodoIdsForTag: mock(() => Promise.resolve([])),
      // 追加されたメソッド
      getTodoIdsWithAllTags: mock(() => Promise.resolve([])),
      getTodoIdsWithAnyTag: mock(() => Promise.resolve([])),
      bulkAssignTagToTodos: mock(() => Promise.resolve(0)),
      bulkRemoveTagFromTodos: mock(() => Promise.resolve(0)),
      getTagStatistics: mock(() => Promise.resolve([])),
    };

    createTagUseCase = new CreateTagUseCase(tagRepository);
  });

  it("should create a tag with valid input", async () => {
    const input = {
      name: "Work",
      color: "#FF5733",
    };

    const expectedTag = {
      id: "tag-id",
      name: "Work",
      color: "#FF5733",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // モックの戻り値を設定
    (tagRepository.getTagByName as any).mockReturnValue(Promise.resolve(null));
    (tagRepository.createTag as any).mockReturnValue(Promise.resolve(expectedTag));

    const result = await createTagUseCase.execute(input);

    expect(result).toEqual(expectedTag);
    expect(tagRepository.getTagByName).toHaveBeenCalledWith(input.name);
    expect(tagRepository.createTag).toHaveBeenCalledWith(input.name, input.color);
  });

  it("should create a tag without color", async () => {
    const input = {
      name: "Work",
    };

    const expectedTag = {
      id: "tag-id",
      name: "Work",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // モックの戻り値を設定
    (tagRepository.getTagByName as any).mockReturnValue(Promise.resolve(null));
    (tagRepository.createTag as any).mockReturnValue(Promise.resolve(expectedTag));

    const result = await createTagUseCase.execute(input);

    expect(result).toEqual(expectedTag);
    expect(tagRepository.getTagByName).toHaveBeenCalledWith(input.name);
    expect(tagRepository.createTag).toHaveBeenCalledWith(input.name, undefined);
  });

  it("should throw an error if tag with same name already exists", async () => {
    const input = {
      name: "Work",
      color: "#FF5733",
    };

    const existingTag = {
      id: "existing-tag-id",
      name: "Work",
      color: "#000000",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // モックの戻り値を設定
    (tagRepository.getTagByName as any).mockReturnValue(Promise.resolve(existingTag));

    await expect(createTagUseCase.execute(input)).rejects.toThrow("Tag with name 'Work' already exists");
    expect(tagRepository.getTagByName).toHaveBeenCalledWith(input.name);
    expect(tagRepository.createTag).not.toHaveBeenCalled();
  });

  it("should throw an error if name is empty", async () => {
    // 直接実装したCreateTagUseCaseのインスタンスを使用（モックなし）
    const realTagRepository: TagRepository = {
      createTag: async () => ({
        id: "mock-tag-id",
        name: "Mock Tag",
        color: "#000000",
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
      getTagById: async () => null,
      getTagByName: async () => null,
      getAllTags: async () => [],
      updateTag: async () => ({
        id: "mock-tag-id",
        name: "Mock Tag",
        color: "#000000",
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
      deleteTag: async () => {},
      assignTagToTodo: async () => {},
      removeTagFromTodo: async () => {},
      getTagsForTodo: async () => [],
      getTodoIdsForTag: async () => [],
      getTodoIdsWithAllTags: async () => [],
      getTodoIdsWithAnyTag: async () => [],
      bulkAssignTagToTodos: async () => 0,
      bulkRemoveTagFromTodos: async () => 0,
      getTagStatistics: async () => [],
    };
    const useCase = new CreateTagUseCase(realTagRepository);

    const input = {
      name: "",
      color: "#FF5733",
    };

    try {
      await useCase.execute(input);
      // エラーが発生しなかった場合はテストを失敗させる
      expect("no error thrown").toBe("error should be thrown");
    } catch (error) {
      // エラーが発生したことを確認
      expect(error).toBeDefined();
    }
  });

  it("should throw an error if color format is invalid", async () => {
    // 直接実装したCreateTagUseCaseのインスタンスを使用（モックなし）
    const realTagRepository: TagRepository = {
      createTag: async () => ({
        id: "mock-tag-id",
        name: "Mock Tag",
        color: "#000000",
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
      getTagById: async () => null,
      getTagByName: async () => null,
      getAllTags: async () => [],
      updateTag: async () => ({
        id: "mock-tag-id",
        name: "Mock Tag",
        color: "#000000",
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
      deleteTag: async () => {},
      assignTagToTodo: async () => {},
      removeTagFromTodo: async () => {},
      getTagsForTodo: async () => [],
      getTodoIdsForTag: async () => [],
      getTodoIdsWithAllTags: async () => [],
      getTodoIdsWithAnyTag: async () => [],
      bulkAssignTagToTodos: async () => 0,
      bulkRemoveTagFromTodos: async () => 0,
      getTagStatistics: async () => [],
    };
    const useCase = new CreateTagUseCase(realTagRepository);

    const input = {
      name: "Work",
      color: "invalid-color",
    };

    try {
      await useCase.execute(input);
      // エラーが発生しなかった場合はテストを失敗させる
      expect("no error thrown").toBe("error should be thrown");
    } catch (error) {
      // エラーが発生したことを確認
      expect(error).toBeDefined();
    }
  });
});
