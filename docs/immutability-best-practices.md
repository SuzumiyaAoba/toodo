# 不変性（Immutability）のベストプラクティス

このドキュメントでは、Toodo プロジェクトで採用している不変性（Immutability）に関するベストプラクティスを説明します。不変性を適用することで、コードの信頼性、予測可能性、保守性が向上します。

## 基本原則

1. **すべてのデータ構造は不変であるべき**

   - オブジェクトの状態を変更するのではなく、新しいオブジェクトを作成する
   - ミューテーション（変更）ではなく、変換を使用する
   - 副作用を最小限に抑え、純粋関数の使用を優先する

2. **TypeScript の型システムを活用する**

   - `readonly` 修飾子を使用して不変性を強制する
   - `Readonly<T>` や `readonly T[]` などの型を使用する
   - 型の定義時に不変性を考慮する

3. **不変性を保証するパターン**
   - ファクトリ関数を使用してオブジェクトを作成する
   - コピーと修正を使用して新しいオブジェクトを作成する
   - コレクションを操作する際は常に新しいコレクションを返す

## 実装パターン

### 1. ドメインモデルの定義

```typescript
// 不変性を型レベルで強制
export type Task = Readonly<{
  id: string;
  title: string;
  // ...その他のプロパティ
  subtasks: readonly Task[]; // 不変の配列
}>;
```

### 2. ファクトリ関数の使用

```typescript
// ファクトリ関数はバリデーションを含み、新しいオブジェクトを返す
export function create(...): Task {
  // バリデーション
  if (!title.trim()) {
    throw new Error("Task title cannot be empty");
  }

  // 新しいオブジェクトを返す
  return {
    id: id || uuidv4(),
    // ...その他のプロパティ
    subtasks: [...subtasks], // コピーを作成
  };
}
```

### 3. 変更操作のパターン

```typescript
// 変更関数は元のオブジェクトを変更せず、新しいオブジェクトを返す
export function updateTitle(task: Task, title: string): Task {
  return {
    ...task, // スプレッド構文でコピー
    title, // 新しい値を設定
    updatedAt: new Date(),
  };
}
```

### 4. コレクション操作

```typescript
// 変更可能な配列の代わりに、常に新しい配列を返す
function reorderSubtasks(task: Task, orderMap: Record<string, number>): Task {
  // 新しい配列をマップで作成
  const updatedSubtasks = task.subtasks.map((subtask) => {
    const orderValue = orderMap[subtask.id];
    if (orderValue !== undefined) {
      return updateOrder(subtask, orderValue);
    }
    return subtask;
  });

  // ソートも新しい配列を作成
  const sortedSubtasks = [...updatedSubtasks].sort((a, b) => a.order - b.order);

  // 新しいタスクオブジェクトを返す
  return {
    ...task,
    updatedAt: new Date(),
    subtasks: sortedSubtasks,
  };
}
```

### 5. 関数型パラダイムの活用

```typescript
// filter、map、reduceなどの関数型メソッドを使用
const tasksToUpdate = tasks
  .filter((task) => orderMap[task.id] !== undefined)
  .map((task) => {
    // 変更を適用した新しいオブジェクトを返す
    return Task.updateOrder(task, orderMap[task.id]);
  });
```

### 6. 型安全なフィルタリング

```typescript
// 型の絞り込みを使用した型安全なフィルタリング
const tasksWithOrderValues = tasks
  .map((task) => {
    const newOrder = orderMap[task.id];
    return { task, newOrder };
  })
  .filter(
    (item): item is { task: TaskType; newOrder: number } =>
      item.newOrder !== undefined
  );
```

### 7. トランザクション的アプローチ

```typescript
// 複数の変更を段階的に適用する
let updatedTask = task;
if (title !== undefined) {
  updatedTask = Task.updateTitle(updatedTask, title);
}
if (description !== undefined) {
  updatedTask = Task.updateDescription(updatedTask, description);
}
```

## 不変性の利点

1. **予測可能性**: 状態変更が制御されるため、動作が予測しやすくなる
2. **デバッグのしやすさ**: オブジェクトの状態が変わらないため、変更箇所を特定しやすい
3. **並行処理**: 不変オブジェクトは安全に並行処理できる
4. **参照の透明性**: 関数の結果が入力だけに依存するため、テストや最適化が容易になる
5. **設計の簡素化**: 不変性を前提とすることで、全体的な設計がよりシンプルに

## 注意点

1. **パフォーマンス**: 大量のオブジェクト生成が必要な場合、メモリ使用量と GC の負荷に注意
2. **複雑な更新**: 深くネストされたオブジェクトの更新には、イミュータブルなヘルパーライブラリの使用を検討する
3. **チーム教育**: 不変性のパラダイムは、命令型プログラミングの経験者には馴染みがないかもしれない
