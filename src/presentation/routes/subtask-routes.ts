import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { AddSubtaskUseCase } from "../../application/use-cases/todo/add-subtask";
import { CreateTodoUseCase } from "../../application/use-cases/todo/create-todo";
import { GetSubtaskTreeUseCase } from "../../application/use-cases/todo/get-subtask-tree";
import { GetSubtasksUseCase } from "../../application/use-cases/todo/get-subtasks";
import { RemoveSubtaskUseCase } from "../../application/use-cases/todo/remove-subtask";
import { PriorityLevel } from "../../domain/entities/todo";
import { prisma } from "../../infrastructure/db";
import { PrismaTodoRepository } from "../../infrastructure/repositories/prisma-todo-repository";
import { validate } from "../middlewares/validate";
import {
  CreateSubtaskSchema,
  SubtaskListSchema,
  SubtaskTreeSchema,
  TodoSubtaskParamSchema,
} from "../schemas/subtask-schemas";
import { IdParamSchema, TodoSchema } from "../schemas/todo-schemas";
import { convertToResponseSchema } from "../utils/schema-converter";

// サブタスク関連のルート
const subtaskRoutes = new Hono();

// リポジトリとユースケースの初期化
const todoRepository = new PrismaTodoRepository(prisma);
const addSubtaskUseCase = new AddSubtaskUseCase(todoRepository);
const removeSubtaskUseCase = new RemoveSubtaskUseCase(todoRepository);
const getSubtasksUseCase = new GetSubtasksUseCase(todoRepository);
const getSubtaskTreeUseCase = new GetSubtaskTreeUseCase(todoRepository);
const createTodoUseCase = new CreateTodoUseCase(todoRepository);

// サブタスクのリストを取得
subtaskRoutes.get("/:id/subtasks", validate("param", IdParamSchema), async (c) => {
  const { id } = c.req.valid("param") as { id: string };

  const subtasks = await getSubtasksUseCase.execute({ todoId: id });
  const responseBody = subtasks.map((subtask) => convertToResponseSchema(subtask, TodoSchema));

  return c.json(responseBody);
});

// サブタスクのツリーを取得
subtaskRoutes.get("/:id/subtask-tree", validate("param", IdParamSchema), async (c) => {
  const { id } = c.req.valid("param") as { id: string };
  const maxDepth = c.req.query("maxDepth") ? Number.parseInt(c.req.query("maxDepth") as string, 10) : undefined;

  const subtaskTree = await getSubtaskTreeUseCase.execute({ todoId: id, maxDepth });

  // サブタスクツリーの型定義
  interface SubtaskWithIds {
    id: string;
    title: string;
    description?: string;
    status: string;
    workState: string;
    priority: string | undefined;
    dueDate?: string;
    subtaskIds: string[];
    [key: string]: unknown;
  }

  interface SubtaskTreeNode {
    id: string;
    title: string;
    description?: string;
    status: string;
    workState: string;
    priority: string | undefined;
    dueDate?: string;
    subtasks: SubtaskTreeNode[];
  }

  // サブタスクツリーの変換関数（再帰的にサブタスクを構造化）
  const convertToTreeFormat = (subtasks: SubtaskWithIds[]): SubtaskTreeNode[] => {
    return subtasks.map((subtask) => {
      const { subtaskIds, ...rest } = subtask;
      const formattedSubtask = convertToResponseSchema(rest, TodoSchema) as {
        id: string;
        title: string;
        description?: string;
        status: string;
        workState: string;
        priority: string | undefined;
        dueDate?: string;
      };

      // サブタスクIDからサブタスクを検索して再帰的に変換
      if (subtask.subtaskIds && subtask.subtaskIds.length > 0) {
        const childSubtasks = subtasks.filter((s) => subtask.subtaskIds.includes(s.id));
        return {
          id: formattedSubtask.id,
          title: formattedSubtask.title,
          description: formattedSubtask.description,
          status: formattedSubtask.status,
          workState: formattedSubtask.workState,
          priority: formattedSubtask.priority,
          dueDate: formattedSubtask.dueDate,
          subtasks: convertToTreeFormat(childSubtasks),
        };
      }

      return {
        id: formattedSubtask.id,
        title: formattedSubtask.title,
        description: formattedSubtask.description,
        status: formattedSubtask.status,
        workState: formattedSubtask.workState,
        priority: formattedSubtask.priority,
        dueDate: formattedSubtask.dueDate,
        subtasks: [],
      };
    });
  };

  // TodoエンティティをSubtaskWithIds型に変換
  const subtaskTreeWithIds = subtaskTree.map((todo) => ({
    id: todo.id,
    title: todo.title,
    description: todo.description,
    status: todo.status,
    workState: todo.workState,
    priority: todo.priority,
    dueDate: todo.dueDate ? todo.dueDate.toISOString() : undefined,
    subtaskIds: todo.subtaskIds,
  })) as SubtaskWithIds[];

  const responseBody = convertToTreeFormat(subtaskTreeWithIds);
  return c.json(responseBody);
});

// 親タスクにサブタスクを追加
subtaskRoutes.post("/:id/subtasks/:subtaskId", validate("param", TodoSubtaskParamSchema), async (c) => {
  const { id, subtaskId } = c.req.valid("param") as { id: string; subtaskId: string };

  await addSubtaskUseCase.execute({ parentId: id, subtaskId });
  return c.json({ success: true, message: "Subtask added successfully" }, 200);
});

// 親タスクからサブタスクを削除
subtaskRoutes.delete("/:id/subtasks/:subtaskId", validate("param", TodoSubtaskParamSchema), async (c) => {
  const { id, subtaskId } = c.req.valid("param") as { id: string; subtaskId: string };

  await removeSubtaskUseCase.execute({ parentId: id, subtaskId });
  return c.json({ success: true, message: "Subtask removed successfully" }, 200);
});

// 新しいサブタスクを作成して親タスクに追加
subtaskRoutes.post(
  "/:id/create-subtask",
  validate("param", IdParamSchema),
  validate("json", CreateSubtaskSchema),
  async (c) => {
    const { id } = c.req.valid("param") as { id: string };
    const { title, description, priority } = c.req.valid("json") as {
      title: string;
      description?: string;
      priority: string | undefined;
    };

    // 親タスクが存在するか確認
    const parentTodo = await todoRepository.findById(id);
    if (!parentTodo) {
      return c.json({ error: `Todo with id ${id} not found` }, 404);
    }

    // 文字列の優先度をPriorityLevel型に変換
    let priorityLevel = undefined;
    if (priority) {
      switch (priority.toLowerCase()) {
        case "low":
          priorityLevel = PriorityLevel.LOW;
          break;
        case "medium":
          priorityLevel = PriorityLevel.MEDIUM;
          break;
        case "high":
          priorityLevel = PriorityLevel.HIGH;
          break;
        default:
          priorityLevel = PriorityLevel.MEDIUM;
      }
    }

    // 新しいサブタスクを作成
    const subtask = await createTodoUseCase.execute({
      title,
      description,
      priority: priorityLevel,
      parentId: id,
    });

    const responseBody = convertToResponseSchema(subtask, TodoSchema);
    return c.json(responseBody);
  },
);

export { subtaskRoutes };
