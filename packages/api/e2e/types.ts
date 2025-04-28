// Type definitions for Todo
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

// Type definitions for TodoActivity
export interface TodoActivity {
  id: string;
  todoId: string;
  type: string;
  note?: string;
  createdAt: string;
  previousState?: string;
  workTime?: number;
}

// Type definitions for Tag
export interface Tag {
  id: string;
  name: string;
  color?: string;
  createdAt: string;
  updatedAt: string;
}

// Type definitions for Project
export interface Project {
  id: string;
  name: string;
  description?: string;
  color?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

// Type definitions for TodoWorkTime
export interface TodoWorkTime {
  id: string;
  totalWorkTime: number;
  formattedTime: string;
}
