import { beforeEach, describe, expect, it, mock } from "bun:test";
import type { Tag } from "../../../domain/entities/tag";
import { TagNameExistsError, TagNotFoundError } from "../../../domain/errors/tag-errors";
import type { TagRepository } from "../../../domain/repositories/tag-repository";
import { UpdateTagUseCase } from "./update-tag";

describe("UpdateTagUseCase", () => {
  let tagRepository: TagRepository;
  let updateTagUseCase: UpdateTagUseCase;
  let mockTag: Tag;

  beforeEach(() => {
    mockTag = {
      id: "123e4567-e89b-12d3-a456-426614174000", // 有効なUUIDフォーマット
      name: "Mock Tag",
      color: "#000000",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

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
      getTodoIdsWithAllTags: mock(() => Promise.resolve([])),
      getTodoIdsWithAnyTag: mock(() => Promise.resolve([])),
      bulkAssignTagToTodos: mock(() => Promise.resolve(0)),
      bulkRemoveTagFromTodos: mock(() => Promise.resolve(0)),
      getTagStatistics: mock(() => Promise.resolve([])),
      findAll: mock(() => Promise.resolve([])),
      findById: mock(() => Promise.resolve(null)),
      create: mock(() =>
        Promise.resolve({
          id: "mock-tag-id",
          name: "Mock Tag",
          color: "#000000",
          createdAt: new Date(),
          updatedAt: new Date(),
        } as Tag),
      ),
      update: mock(() =>
        Promise.resolve({
          id: "mock-tag-id",
          name: "Mock Tag",
          color: "#000000",
          createdAt: new Date(),
          updatedAt: new Date(),
        } as Tag),
      ),
      delete: mock(() => Promise.resolve()),
      findByName: mock(() => Promise.resolve(null)),
      getTodosByTagId: mock(() => Promise.resolve([])),
      addTagToTodo: mock(() => Promise.resolve()),
    };

    updateTagUseCase = new UpdateTagUseCase(tagRepository);
  });

  it("should update a tag with valid input", async () => {
    const input = {
      id: "123e4567-e89b-12d3-a456-426614174000",
      name: "Updated Tag",
      color: "#FF5733",
    };

    const expectedTag = {
      ...mockTag,
      name: "Updated Tag",
      color: "#FF5733",
      updatedAt: new Date(),
    };

    (tagRepository.getTagById as any).mockReturnValue(Promise.resolve(mockTag));
    (tagRepository.getTagByName as any).mockReturnValue(Promise.resolve(null));
    (tagRepository.updateTag as any).mockReturnValue(Promise.resolve(expectedTag));

    const result = await updateTagUseCase.execute(input);

    expect(result).toEqual(expectedTag);
    expect(tagRepository.getTagById).toHaveBeenCalledWith(input.id);
    expect(tagRepository.getTagByName).toHaveBeenCalledWith(input.name);
    expect(tagRepository.updateTag).toHaveBeenCalledWith(input.id, input.name, input.color);
  });

  it("should update only the name of a tag", async () => {
    const input = {
      id: "123e4567-e89b-12d3-a456-426614174000",
      name: "Updated Tag",
    };

    const expectedTag = {
      ...mockTag,
      name: "Updated Tag",
      updatedAt: new Date(),
    };

    (tagRepository.getTagById as any).mockReturnValue(Promise.resolve(mockTag));
    (tagRepository.getTagByName as any).mockReturnValue(Promise.resolve(null));
    (tagRepository.updateTag as any).mockReturnValue(Promise.resolve(expectedTag));

    const result = await updateTagUseCase.execute(input);

    expect(result).toEqual(expectedTag);
    expect(tagRepository.getTagById).toHaveBeenCalledWith(input.id);
    expect(tagRepository.getTagByName).toHaveBeenCalledWith(input.name);
    expect(tagRepository.updateTag).toHaveBeenCalledWith(input.id, input.name, undefined);
  });

  it("should update only the color of a tag", async () => {
    const input = {
      id: "123e4567-e89b-12d3-a456-426614174000",
      color: "#FF5733",
    };

    const expectedTag = {
      ...mockTag,
      color: "#FF5733",
      updatedAt: new Date(),
    };

    (tagRepository.getTagById as any).mockReturnValue(Promise.resolve(mockTag));
    (tagRepository.updateTag as any).mockReturnValue(Promise.resolve(expectedTag));

    const result = await updateTagUseCase.execute(input);

    expect(result).toEqual(expectedTag);
    expect(tagRepository.getTagById).toHaveBeenCalledWith(input.id);
    expect(tagRepository.getTagByName).not.toHaveBeenCalled();
    expect(tagRepository.updateTag).toHaveBeenCalledWith(input.id, undefined, input.color);
  });

  it("should set color to null if specified", async () => {
    const input = {
      id: "123e4567-e89b-12d3-a456-426614174000",
      color: null,
    };

    const expectedTag = {
      ...mockTag,
      color: null,
      updatedAt: new Date(),
    };

    (tagRepository.getTagById as any).mockReturnValue(Promise.resolve(mockTag));
    (tagRepository.updateTag as any).mockReturnValue(Promise.resolve(expectedTag));

    const result = await updateTagUseCase.execute(input);

    expect(result).toEqual(expectedTag);
    // nullがundefinedに変換されずにそのまま渡されることを確認
    expect(tagRepository.updateTag).toHaveBeenCalledWith(input.id, undefined, null);
  });

  it("should throw TagNotFoundError if tag does not exist", async () => {
    const input = {
      id: "123e4567-e89b-12d3-a456-426614174001", // 異なるID
      name: "Updated Tag",
    };

    (tagRepository.getTagById as any).mockReturnValue(Promise.resolve(null));

    await expect(updateTagUseCase.execute(input)).rejects.toThrow(TagNotFoundError);
    expect(tagRepository.getTagById).toHaveBeenCalledWith(input.id);
    expect(tagRepository.updateTag).not.toHaveBeenCalled();
  });

  it("should throw TagNameExistsError if tag with same name already exists", async () => {
    const input = {
      id: "123e4567-e89b-12d3-a456-426614174000",
      name: "Existing Tag",
    };

    const existingTag = {
      id: "123e4567-e89b-12d3-a456-426614174002", // 別のタグのID
      name: "Existing Tag",
      color: "#000000",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    (tagRepository.getTagById as any).mockReturnValue(Promise.resolve(mockTag));
    (tagRepository.getTagByName as any).mockReturnValue(Promise.resolve(existingTag));

    await expect(updateTagUseCase.execute(input)).rejects.toThrow(TagNameExistsError);
    expect(tagRepository.getTagById).toHaveBeenCalledWith(input.id);
    expect(tagRepository.getTagByName).toHaveBeenCalledWith(input.name);
    expect(tagRepository.updateTag).not.toHaveBeenCalled();
  });

  it("should allow updating to the same name", async () => {
    const input = {
      id: "123e4567-e89b-12d3-a456-426614174000",
      name: "Mock Tag", // Same name as current
      color: "#FF5733",
    };

    const expectedTag = {
      ...mockTag,
      color: "#FF5733",
      updatedAt: new Date(),
    };

    (tagRepository.getTagById as any).mockReturnValue(Promise.resolve(mockTag));
    (tagRepository.updateTag as any).mockReturnValue(Promise.resolve(expectedTag));

    const result = await updateTagUseCase.execute(input);

    expect(result).toEqual(expectedTag);
    // getTagByNameは呼ばれるべきではない（同じ名前の場合は重複チェック不要）
    expect(tagRepository.getTagByName).not.toHaveBeenCalled();
    expect(tagRepository.updateTag).toHaveBeenCalledWith(input.id, input.name, input.color);
  });

  it("should throw an error if ID is invalid", async () => {
    const input = {
      id: "invalid-uuid",
      name: "Updated Tag",
    };

    try {
      await updateTagUseCase.execute(input);
      // エラーが発生しなかった場合はテストを失敗させる
      expect("no error thrown").toBe("error should be thrown");
    } catch (error) {
      // エラーが発生したことを確認
      expect(error).toBeDefined();
    }
  });

  it("should throw an error if name format is invalid", async () => {
    const input = {
      id: "123e4567-e89b-12d3-a456-426614174000", // 有効なUUID形式
      name: "", // 空の名前は無効
    };

    try {
      await updateTagUseCase.execute(input);
      // エラーが発生しなかった場合はテストを失敗させる
      expect("no error thrown").toBe("error should be thrown");
    } catch (error) {
      // エラーが発生したことを確認
      expect(error).toBeDefined();
    }
  });

  it("should throw an error if color format is invalid", async () => {
    const input = {
      id: "123e4567-e89b-12d3-a456-426614174000", // 有効なUUID形式
      color: "invalid-color",
    };

    try {
      await updateTagUseCase.execute(input);
      // エラーが発生しなかった場合はテストを失敗させる
      expect("no error thrown").toBe("error should be thrown");
    } catch (error) {
      // エラーが発生したことを確認
      expect(error).toBeDefined();
    }
  });
});
