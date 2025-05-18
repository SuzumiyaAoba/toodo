/**
 * DIコンテナのトークン定義
 * シンボルを使用した識別子を提供します
 */
export const TOKENS = {
	// インフラストラクチャ
	DB: Symbol.for("DB"),

	// リポジトリ
	TaskRepository: Symbol.for("TaskRepository"),

	// ユースケース
	GetRootTasksUseCase: Symbol.for("GetRootTasksUseCase"),
	GetTaskByIdUseCase: Symbol.for("GetTaskByIdUseCase"),
	CreateTaskUseCase: Symbol.for("CreateTaskUseCase"),
	UpdateTaskUseCase: Symbol.for("UpdateTaskUseCase"),
	DeleteTaskUseCase: Symbol.for("DeleteTaskUseCase"),
	MoveTaskUseCase: Symbol.for("MoveTaskUseCase"),
	ReorderTasksUseCase: Symbol.for("ReorderTasksUseCase"),

	// コントローラー
	TaskController: Symbol.for("TaskController"),
};
