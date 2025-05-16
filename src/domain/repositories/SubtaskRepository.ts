import { Subtask } from "../models/Subtask";

export interface SubtaskRepository {
  findByTodoId(todoId: string): Promise<Subtask[]>;
  findById(id: string): Promise<Subtask | null>;
  save(subtask: Subtask): Promise<Subtask>;
  delete(id: string): Promise<void>;
  updateOrder(subtasks: Subtask[]): Promise<Subtask[]>;
}
