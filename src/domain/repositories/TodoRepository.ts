import type { Todo } from "../models/Todo";

export type TodoRepository = {
  findAll(): Promise<Todo[]>;
  findById(id: string): Promise<Todo | null>;
  save(todo: Todo): Promise<Todo>;
  delete(id: string): Promise<void>;
};
