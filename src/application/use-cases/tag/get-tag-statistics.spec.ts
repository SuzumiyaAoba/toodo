import { describe, expect, it, mock } from "bun:test";
import { GetTagStatisticsUseCase } from "./get-tag-statistics";

describe("GetTagStatisticsUseCase", () => {
  const mockStatistics = [
    {
      id: "tag1",
      name: "Work",
      color: null,
      usageCount: 3,
      pendingTodoCount: 2,
      completedTodoCount: 1,
    },
    {
      id: "tag2",
      name: "Personal",
      color: null,
      usageCount: 2,
      pendingTodoCount: 1,
      completedTodoCount: 1,
    },
    {
      id: "tag3",
      name: "Urgent",
      color: null,
      usageCount: 1,
      pendingTodoCount: 1,
      completedTodoCount: 0,
    },
  ];

  const mockTagRepository = {
    createTag: mock(() => Promise.resolve({ id: "tag1", name: "Work", createdAt: new Date(), updatedAt: new Date() })),
    getTagById: mock(() => Promise.resolve({ id: "tag1", name: "Work", createdAt: new Date(), updatedAt: new Date() })),
    getTagByName: mock(() => Promise.resolve(null)),
    getAllTags: mock(() =>
      Promise.resolve([
        { id: "tag1", name: "Work", createdAt: new Date(), updatedAt: new Date() },
        { id: "tag2", name: "Personal", createdAt: new Date(), updatedAt: new Date() },
        { id: "tag3", name: "Urgent", createdAt: new Date(), updatedAt: new Date() },
      ]),
    ),
    updateTag: mock(() => Promise.resolve({ id: "tag1", name: "Work", createdAt: new Date(), updatedAt: new Date() })),
    deleteTag: mock(() => Promise.resolve()),
    assignTagToTodo: mock(() => Promise.resolve()),
    removeTagFromTodo: mock(() => Promise.resolve()),
    getTagsForTodo: mock(() => Promise.resolve([])),
    getTodoIdsForTag: mock(() => Promise.resolve([])),
    bulkAssignTagToTodos: mock(() => Promise.resolve(0)),
    bulkRemoveTagFromTodos: mock(() => Promise.resolve(0)),
    getTodoIdsWithAllTags: mock(() => Promise.resolve([])),
    getTodoIdsWithAnyTag: mock(() => Promise.resolve([])),
    getTagStatistics: mock(() =>
      Promise.resolve([
        { id: "tag1", name: "Work", color: null, usageCount: 3, pendingTodoCount: 2, completedTodoCount: 1 },
        { id: "tag2", name: "Personal", color: null, usageCount: 2, pendingTodoCount: 1, completedTodoCount: 1 },
        { id: "tag3", name: "Urgent", color: null, usageCount: 1, pendingTodoCount: 1, completedTodoCount: 0 },
      ]),
    ),
  };

  const useCase = new GetTagStatisticsUseCase(mockTagRepository);

  it("should get tag statistics", async () => {
    const result = await useCase.execute();

    expect(result).toEqual(mockStatistics);
    expect(mockTagRepository.getTagStatistics).toHaveBeenCalled();
  });

  it("should return empty array when no tags exist", async () => {
    // Override mock for this test
    mockTagRepository.getTagStatistics.mockImplementationOnce(() => Promise.resolve([]));

    const result = await useCase.execute();

    expect(result).toEqual([]);
    expect(mockTagRepository.getTagStatistics).toHaveBeenCalled();
  });
});
