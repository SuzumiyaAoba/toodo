# Toodo - タスク管理アプリケーション

Toodo は、階層的なタスク管理を可能にするシンプルなアプリケーションです。ドメイン駆動設計（DDD）とテスト駆動開発（TDD）の原則に基づいて開発されています。

## 技術スタック

- [Bun](https://bun.sh) - JavaScript ランタイムとパッケージマネージャー
- [Hono](https://hono.dev) - 高速で軽量な Web フレームワーク
- [SQLite](https://www.sqlite.org) - データベース (Bun SQLite 経由)
- [Drizzle ORM](https://orm.drizzle.team) - データベース操作用 TypeScript ORM
- [tslog](https://tslog.js.org) - ロギングライブラリ
- [UUID](https://www.npmjs.com/package/uuid) - 一意の ID 生成

## プロジェクト構造

```
src/
├── application/          # アプリケーション層
│   ├── services/         # サービス
│   └── usecases/         # ユースケース
│       └── task/         # タスク関連のユースケース
├── domain/               # ドメイン層
│   ├── models/           # ドメインモデル
│   └── repositories/     # リポジトリインターフェース
├── infrastructure/       # インフラストラクチャ層
│   ├── controllers/      # コントローラー
│   └── repositories/     # リポジトリ実装
└── db/                   # データベース関連
    ├── migrations/       # マイグレーションファイル
    ├── schema.ts         # データベーススキーマ
    └── migrate.ts        # マイグレーションスクリプト
```

## 主な機能

- 階層的なタスク管理（親タスクと子タスク）
- タスクの作成、更新、削除
- タスクのステータス管理（完了/未完了）
- タスクの並べ替え
- タスクの移動（親タスクの変更）

## API

| エンドポイント                 | メソッド | 説明                                             |
| ------------------------------ | -------- | ------------------------------------------------ |
| `/api/tasks`                   | GET      | すべてのルートタスク（親を持たないタスク）を取得 |
| `/api/tasks/:id`               | GET      | 指定された ID のタスクを取得                     |
| `/api/tasks`                   | POST     | 新しいタスクを作成                               |
| `/api/tasks/:id`               | PATCH    | タスクを更新                                     |
| `/api/tasks/:id`               | DELETE   | タスクを削除                                     |
| `/api/tasks/:id/move`          | PATCH    | タスクを別の親タスクに移動                       |
| `/api/tasks/reorder`           | PUT      | ルートタスクの順序を更新                         |
| `/api/tasks/:parentId/reorder` | PUT      | 特定の親タスクの子タスクの順序を更新             |

## 開発

### 環境のセットアップ

1. リポジトリをクローン：

   ```
   git clone <repository-url>
   cd toodo
   ```

2. 依存関係をインストール：

   ```
   bun install
   ```

3. データベースをセットアップ：

   ```
   bun run migrate
   ```

4. 開発サーバーを起動：
   ```
   bun run dev
   ```
   アプリケーションはデフォルトで `http://localhost:3001` で実行されます。

### 開発コマンド

- `bun run dev` - 開発サーバーを起動
- `bun run test` - テストを実行
- `bun run format` - コードをフォーマット
- `bun run lint` - コードをリント
- `bun run migrate` - データベースマイグレーションを実行
- `bun run studio` - Drizzle Studio でデータベースを管理

## ドメインモデル

このプロジェクトでは、レコードとファクトリ関数を使用した不変のドメインモデルを採用しています。
クラスではなくレコードを使用し、オブジェクトの変更には常に新しいインスタンスを作成します。

### タスクモデル

タスクは以下の属性を持ちます：

- `id` - タスクの一意の識別子
- `parentId` - 親タスクの ID（ルートタスクの場合は null）
- `title` - タスクのタイトル
- `description` - タスクの説明（オプション）
- `status` - タスクの状態（"completed"または"incomplete"）
- `order` - 同じ階層内でのタスクの順序
- `createdAt` - タスク作成日時
- `updatedAt` - タスク更新日時
- `subtasks` - 子タスクの配列

## コード規約

- Biome を使用してコードをリントおよびフォーマット
- インデントには 2 スペースを使用
- 最大行長：120 文字
- TypeScript の型定義には`interface`よりも`type`を優先
- コミット前に`bun run format`を実行

## 貢献

プルリクエストを提出する前に、すべてのテストが通過していることと、コードがフォーマットされていることを確認してください。

## License

This project is licensed under the MIT License.
