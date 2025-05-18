# Toodo

シンプルで効率的な DDD アプローチを使用したタスク管理アプリケーション

## 技術スタック

- [Bun](https://bun.sh) - JavaScript ランタイムとパッケージマネージャー
- [Hono](https://hono.dev) - 高速で軽量なウェブフレームワーク
- [SQLite](https://www.sqlite.org) - データベース (Bun SQLite 経由)
- [Drizzle ORM](https://orm.drizzle.team) - TypeScript ORM でデータベース操作
- [tslog](https://tslog.js.org) - ロギングライブラリ
- [UUID](https://www.npmjs.com/package/uuid) - ユニーク ID の生成

## 設計アプローチ

このプロジェクトは次の設計原則に従っています：

### ドメイン駆動設計 (DDD)

- コアドメインとドメインロジックに焦点を当てる
- 複雑な設計はドメインモデルに基づく
- ドメインの専門家と協力して、アプリケーションモデルを改善
- 開発者とドメインの専門家の間で共通言語を確立
- ドメインの概念を中心にコードを構成
  - エンティティ：ID と ライフサイクルを持つオブジェクト
  - 値オブジェクト：ID を持たない不変なオブジェクト
  - 集約：エンティティと値オブジェクトのクラスター
  - リポジトリ：ドメインオブジェクトへのアクセスするインターフェース
  - サービス：エンティティに属さないドメイン操作

### レコード志向設計

- クラスの代わりにプレーンなレコードオブジェクトを使用
- TypeScript の型でレコードの構造を定義
- コンストラクタの代わりにファクトリ関数でオブジェクト作成
- レコードを操作する純粋関数としてドメインロジックを実装
- サービスモジュールで関数を整理することでデータと振る舞いを分離
- 不変データ構造と関数型プログラミングの原則を採用

## 開発セットアップ

### 依存関係のインストール

```bash
bun install
```

### データベースのセットアップ

```bash
bun run migrate
```

### 開発サーバーの起動

```bash
bun run dev
```

### テストの実行

```bash
bun test
```

### Lint とフォーマット

```bash
bun run format
```

### Drizzle Studio の起動

```bash
bun run studio
```

## API エンドポイント

- `GET /api/tasks` - すべてのルートタスク（親を持たないタスク）を取得
- `GET /api/tasks/:id` - ID 指定でタスクを取得
- `POST /api/tasks` - 新しいタスクを作成
- `PATCH /api/tasks/:id` - タスクを更新
- `DELETE /api/tasks/:id` - タスクを削除
- `PATCH /api/tasks/:id/move` - タスクを別の親タスクに移動
- `PUT /api/tasks/reorder` - 同じ親を持つタスクの順序を変更

## API ドキュメント

Swagger UI と OpenAPI ドキュメントが利用可能です：

- Swagger UI: `http://localhost:3001/swagger`
- OpenAPI ドキュメント: `http://localhost:3001/api/docs`

## コントリビューション

プルリクエストを作成する前に:

1. テストを実行して確認すること: `bun test`
2. リンターを実行して問題がないことを確認: `bun run format`

## Project Structure

```
src/
├── application/          # Application layer
│   ├── services/         # Services
│   └── usecases/         # Use cases
│       └── task/         # Task-related use cases
├── domain/               # Domain layer
│   ├── models/           # Domain models
│   └── repositories/     # Repository interfaces
├── infrastructure/       # Infrastructure layer
│   ├── controllers/      # Controllers
│   └── repositories/     # Repository implementations
└── db/                   # Database related
    ├── migrations/       # Migration files
    ├── schema.ts         # Database schema
    └── migrate.ts        # Migration script
```

## Key Features

- Hierarchical task management (parent and child tasks)
- Create, update, and delete tasks
- Task status management (completed/incomplete)
- Task reordering
- Task movement (changing parent tasks)

## Code Conventions

- Use Biome for code linting and formatting
- Use 2 spaces for indentation
- Maximum line length: 120 characters
- Prefer `type` over `interface` for TypeScript type definitions
- Run `bun run format` before committing

## License

This project is licensed under the MIT License.
