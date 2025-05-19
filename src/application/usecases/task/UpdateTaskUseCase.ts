import { inject, injectable, singleton } from "tsyringe";
import { Task, type TaskStatus } from "../../../domain/models/Task";
import type { Task as TaskType } from "../../../domain/models/Task";
import type { TaskRepository } from "../../../domain/repositories/TaskRepository";
import { TOKENS } from "../../services/DependencyTokens";

type UpdateTaskParams = {
  readonly id: string;
  readonly title?: string;
  readonly description?: string | null;
  readonly status?: TaskStatus;
};

@injectable()
@singleton()
export class UpdateTaskUseCase {
  constructor(
    @inject(TOKENS.TaskRepository)
    private readonly taskRepository: TaskRepository,
  ) {}

  async execute(params: UpdateTaskParams): Promise<TaskType | null> {
    const { id, title, description, status } = params;

    // Find the task
    const task = await this.taskRepository.findById(id, true);
    if (!task) {
      return null;
    }

    // イミュータブルな方法でタスクを更新
    // 更新する値がない場合は元のタスクを返す
    if (title === undefined && description === undefined && status === undefined) {
      return task;
    }

    // 関数合成を使用してイミュータブルに変更を適用
    let updatedTask = task;

    if (title !== undefined) {
      updatedTask = Task.updateTitle(updatedTask, title);
    }

    if (description !== undefined) {
      updatedTask = Task.updateDescription(updatedTask, description);
    }

    if (status !== undefined) {
      updatedTask = status === "completed" ? Task.markAsCompleted(updatedTask) : Task.markAsIncomplete(updatedTask);
    }

    // Save the updated task
    return this.taskRepository.save(updatedTask);
  }
}
