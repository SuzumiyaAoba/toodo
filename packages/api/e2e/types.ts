// Todo関連の型定義
export interface Todo {
  id: string;
  title: string;
  description?: string;
  status: string;
  workState: string;
  totalWorkTime: number;
  dueDate?: string;
  priority: string;
  createdAt: string;
  updatedAt: string;
  projectId?: string;
}

// TodoActivity関連の型定義
export interface TodoActivity {
  id: string;
  todoId: string;
  type: string;
  note?: string;
  createdAt: string;
  previousState?: string;
  workTime?: number;
}

// Tag関連の型定義
export interface Tag {
  id: string;
  name: string;
  color?: string;
  createdAt: string;
  updatedAt: string;
}

// Project関連の型定義
export interface Project {
  id: string;
  name: string;
  description?: string;
  color?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

// TodoWorkTime関連の型定義
export interface TodoWorkTime {
  id: string;
  totalWorkTime: number;
  formattedTime: string;
}
