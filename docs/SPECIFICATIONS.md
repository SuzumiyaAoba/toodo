# Functional Specifications

## Overview

This document provides detailed functional and non-functional requirements for the Toodo application.

## Terminology

- **Task**: The basic unit representing a task created by a user
- **Status**: The state of a Task (incomplete, completed)
- **Order**: A numeric value that determines the display order of tasks at the same hierarchical level
- **Subtask**: A task that is hierarchically nested under a parent task

## Functional Requirements

### 1. Task Management

#### 1.1 Creating Tasks

- Users can create tasks by entering a title and description (optional)
- Users can create subtasks under existing tasks
- Newly created tasks have a default status of "incomplete"
- Tasks are assigned an order value based on their position in the list

#### 1.2 Listing Tasks

- Users can view a list of all their root-level tasks (tasks without parents)
- Tasks are displayed in order according to their order property
- Subtasks are displayed under their parent tasks in a hierarchical view

#### 1.3 Viewing Task Details

- Users can view detailed information about a task
- Details include title, description, creation date/time, update date/time, status, and subtasks

#### 1.4 Updating Tasks

- Users can update the title and description of a task
- Status can be changed to "completed" or "incomplete"
- Marking a parent task as completed will mark all subtasks as completed

#### 1.5 Moving Tasks

- Users can move tasks in the hierarchy
- Tasks can be moved to be subtasks of another task
- Tasks can be moved from being a subtask to a root-level task

#### 1.6 Reordering Tasks

- Users can change the display order of tasks at the same level
- Reordering updates the order property of affected tasks

#### 1.7 Deleting Tasks

- Users can delete tasks
- Deleting a task also deletes all of its subtasks

## API Endpoint Specifications

### Task API

#### `GET /api/tasks`

- **Function**: Retrieve a list of root-level tasks
- **Response**: Array of Task objects with their subtasks

#### `GET /api/tasks/:id`

- **Function**: Retrieve a specific task with its subtasks
- **Path Parameters**:
  - `id`: Task ID
- **Response**: Task object with nested subtasks

#### `POST /api/tasks`

- **Function**: Create a new task
- **Request Body**:
  - `title`: Task title (required)
  - `description`: Task description (optional)
  - `parentId`: Parent task ID (optional, for creating subtasks)
- **Response**: Created Task object

#### `PATCH /api/tasks/:id`

- **Function**: Update a specific task
- **Path Parameters**:
  - `id`: Task ID
- **Request Body**:
  - `title`: Task title (optional)
  - `description`: Task description (optional)
  - `status`: Status (optional)
- **Response**: Updated Task object

#### `PATCH /api/tasks/:id/move`

- **Function**: Move a task in the hierarchy
- **Path Parameters**:
  - `id`: Task ID
- **Request Body**:
  - `parentId`: New parent task ID or null for root-level
- **Response**: Updated Task object

#### `PUT /api/tasks/reorder`

- **Function**: Reorder root-level tasks
- **Request Body**:
  - `orderMap`: Object mapping task IDs to new order values
- **Response**: Success confirmation

#### `PUT /api/tasks/:parentId/reorder`

- **Function**: Reorder subtasks under a specific parent
- **Path Parameters**:
  - `parentId`: Parent task ID
- **Request Body**:
  - `orderMap`: Object mapping task IDs to new order values
- **Response**: Success confirmation

#### `DELETE /api/tasks/:id`

- **Function**: Delete a specific task and all its subtasks
- **Path Parameters**:
  - `id`: Task ID
- **Response**: Deletion confirmation

## Data Models

### Task

```typescript
type Task = Readonly<{
  id: string; // Unique identifier for the task
  parentId: string | null; // Parent task ID or null for root tasks
  title: string; // Title
  description: string | null; // Description (optional)
  status: "completed" | "incomplete"; // Status
  order: number; // Display order within the same level
  createdAt: Date; // Creation date/time
  updatedAt: Date; // Update date/time
  subtasks: readonly Task[]; // Nested subtasks
}>;
```

## Task Domain Operations

### Creation and Structure

```typescript
// Create a new task
function create(
  title: string,
  parentId?: string | null,
  description?: string | null
): Task;

// Add a subtask to an existing task
function addSubtask(
  task: Task,
  title: string,
  description?: string | null
): Task;
```

### Updates and Status Management

```typescript
// Update task properties
function updateTitle(task: Task, title: string): Task;
function updateDescription(task: Task, description: string | null): Task;
function updateStatus(task: Task): Task;
function updateOrder(task: Task, order: number): Task;

// Status changes
function markAsCompleted(task: Task): Task;
function markAsIncomplete(task: Task): Task;
```

### Task Organization

```typescript
// Reordering tasks
function reorderSubtasks(task: Task, orderMap: Record<string, number>): Task;

// Task hierarchy operations
function getTaskHierarchy(task: Task): Task[];
function findTaskById(task: Task, id: string): Task | null;
function getDepth(task: Task): number;
```

## Non-Functional Requirements

### 1. Performance

- API response time should average below 200ms
- System should handle requests from 100 simultaneous users

### 2. Security

- All API requests must be validated
- Input data must be sanitized to prevent injection attacks

### 3. Availability

- System uptime target is 99.9% or higher
- Regular backups should be performed

### 4. Scalability

- Design should accommodate future user growth
- Architecture should allow for easy feature expansion

### 5. Maintainability

- Code should include clear documentation and appropriate comments
- Test coverage target is 80% or higher
- Domain models should be immutable to prevent unexpected state changes
