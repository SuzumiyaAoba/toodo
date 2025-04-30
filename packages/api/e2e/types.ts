// Type definitions for Todo
export interface Todo {
  id: string;
  title: string;
  description: string | null;
  status: "pending" | "in_progress" | "completed";
  workState: "idle" | "active" | "paused" | "completed";
  totalWorkTime: number;
  lastStateChangeAt: string;
  createdAt: string;
  updatedAt: string;
  priority: "low" | "medium" | "high";
  projectId: string | null;
  dueDate: string | null;
  dependencies: string[];
  dependents: string[];
  tags: Tag[];
}

// Type definitions for TodoActivity
export interface TodoActivity {
  id: string;
  todoId: string;
  type: "started" | "paused" | "completed" | "discarded";
  workTime: number | null;
  previousState: "idle" | "active" | "paused" | "completed" | null;
  note: string | null;
  createdAt: string;
  workPeriodId: string | null;
}

// Type definitions for Tag
export interface Tag {
  id: string;
  name: string;
  color: string | null;
  createdAt: string;
  updatedAt: string;
}

// Type definitions for Project
export interface Project {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
  status: "active" | "archived";
  createdAt: string;
  updatedAt: string;
}

// Type definitions for TodoWorkTime
export interface TodoWorkTime {
  id: string;
  totalWorkTime: number;
  formattedTime: string;
}

// Type definitions for WorkPeriod
export interface WorkPeriod {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  createdAt: string;
  updatedAt: string;
  activities: TodoActivity[];
}

// Type definitions for error responses
export interface ErrorResponse {
  error: {
    code: string;
    message: string;
  };
}

// Type definitions for bulk operation responses
export interface BulkOperationResponse {
  successCount: number;
  failedCount: number;
}
