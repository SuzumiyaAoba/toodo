import type { Todo } from "../../../domain/entities/todo";
import type { PriorityLevel } from "../../../domain/entities/todo";
import { TodoNotFoundError } from "../../../domain/errors/todo-errors";
import type { TodoRepository } from "../../../domain/repositories/todo-repository";

/**
 * TODO依存関係ツリーのノード
 */
export interface TodoDependencyNode {
  id: string;
  title: string;
  status: string;
  priority: PriorityLevel | null;
  dependencies: TodoDependencyNode[];
}

/**
 * TODOの依存関係をツリー構造として取得するユースケース
 */
export class GetTodoDependencyTreeUseCase {
  private todoRepository: TodoRepository;

  constructor(todoRepository: TodoRepository) {
    this.todoRepository = todoRepository;
  }

  /**
   * 指定されたTODOの依存関係をツリー構造として取得する
   * @param id 取得対象のTODO ID
   * @param maxDepth 最大深度 (無限ループを防ぐため)
   * @returns 依存関係ツリー
   */
  async execute(id: string, maxDepth = 10): Promise<TodoDependencyNode> {
    const todo = await this.todoRepository.findById(id);

    if (!todo) {
      throw new TodoNotFoundError(id);
    }

    return this.buildDependencyTree(todo, maxDepth, new Set<string>());
  }

  /**
   * 依存関係ツリーを再帰的に構築する
   * @param todo 対象のTODO
   * @param maxDepth 最大深度
   * @param visited 訪問済みのTODO IDセット (循環参照防止)
   * @returns 依存関係ノード
   */
  private async buildDependencyTree(todo: Todo, maxDepth: number, visited: Set<string>): Promise<TodoDependencyNode> {
    // 訪問済みに追加
    visited.add(todo.id);

    // 基本ノード情報を作成
    const node: TodoDependencyNode = {
      id: todo.id,
      title: todo.title,
      status: todo.status,
      priority: todo.priority,
      dependencies: [],
    };

    // 深度制限に達した場合は子ノードを展開せずに返す
    if (maxDepth <= 0) {
      return node;
    }

    // 依存関係を取得
    const dependencies = await this.todoRepository.findDependencies(todo.id);

    // 各依存関係を再帰的に処理
    for (const dependency of dependencies) {
      // 循環参照を防ぐため、訪問済みのノードはスキップ
      if (visited.has(dependency.id)) {
        continue;
      }

      // 子ノードを再帰的に構築
      const childNode = await this.buildDependencyTree(
        dependency,
        maxDepth - 1,
        new Set(visited), // 新しいセットを作成して渡す (親の訪問履歴をコピー)
      );

      node.dependencies.push(childNode);
    }

    return node;
  }
}
