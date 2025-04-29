import type { TodoDependency } from "../entities/todo-dependency";

export interface TodoDependencyRepository {
  create(todoId: string, dependencyId: string): Promise<TodoDependency>;
  delete(todoId: string, dependencyId: string): Promise<void>;
  findByTodoId(todoId: string): Promise<TodoDependency[]>;
  findByDependencyId(dependencyId: string): Promise<TodoDependency[]>;
  exists(todoId: string, dependencyId: string): Promise<boolean>;
  checkForCycle(todoId: string, dependencyId: string): Promise<boolean>;
  getTodoDependencyTree(todoId: string, direction: "dependencies" | "dependents"): Promise<string[]>;
}
