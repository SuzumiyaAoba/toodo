# Toodo Application Architecture Design

## 1. Overview

The Toodo application is a RESTful API system for managing TODO items. This document outlines the architecture implemented in the application.

### 1.1 Technology Stack

📚 **Core Technologies**

- 🟦 **TypeScript** - Strongly typed programming language
- 🌐 **Hono** - Lightweight, fast web framework
- ✅ **Valibot** - Runtime validation library
- 🔄 **Prisma** - Type-safe database ORM
- 🗄️ **SQLite** - Embedded database
- 🏃 **Bun** - JavaScript/TypeScript runtime and test framework

## 2. Architecture Principles

- 🔍 **Separation of Concerns**: Each part of the code has a single responsibility
- 🧩 **Modularity**: Split into independent modules to improve maintainability
- 🧪 **Testability**: Design code structure that facilitates unit testing
- 🏛️ **Clean Architecture**: Keep business logic independent from infrastructure details
- 🔒 **Immutability**: Core entities are implemented as immutable objects to ensure data integrity

## 3. Architecture Structure

### 3.1 Layered Structure

The application follows a clean architecture pattern with the following layers:

```
┌───────────────────────────────────────────────────────────────┐
│                      🌐 Presentation Layer                     │
│                  (Controllers, Routes, Schemas)                │
├───────────────────────────────────────────────────────────────┤
│                     🔄 Application Layer                       │
│                        (Use Cases)                             │
├───────────────────────────────────────────────────────────────┤
│                       📊 Domain Layer                          │
│               (Entities, Repository Interfaces)                │
├───────────────────────────────────────────────────────────────┤
│                    🛠️ Infrastructure Layer                     │
│             (Repository Implementations, Database)             │
└───────────────────────────────────────────────────────────────┘
```

**Layer Responsibilities:**

1. **Presentation Layer** (`/src/presentation`):
   - API endpoints and routing
   - Request/response validation
   - Error handling

2. **Application Layer** (`/src/application`):
   - Use cases implementing business logic
   - Orchestration of domain entities
   - Independent of external frameworks

3. **Domain Layer** (`/src/domain`):
   - Business models and entities
   - Repository interfaces
   - Domain-specific errors

4. **Infrastructure Layer** (`/src/infrastructure`):
   - Database access implementation
   - Repository implementations
   - External service integrations

### 3.2 Directory Structure

```
src/
├── index.ts                # Application entry point
│
├── presentation/           # 🌐 Presentation layer
│   ├── middlewares/        # Custom middlewares
│   ├── routes/             # Route definitions
│   ├── schemas/            # Input/output validation schemas
│   └── errors/             # API-specific errors
│
├── application/            # 🔄 Application layer
│   └── use-cases/          # Business logic components
│       ├── todo/           # Todo-related use cases
│       ├── todo-activity/  # Activity tracking use cases
│       ├── tag/            # Tag management use cases
│       └── project/        # Project management use cases
│
├── domain/                 # 📊 Domain layer
│   ├── entities/           # Business entities and value objects
│   ├── repositories/       # Repository interfaces
│   └── errors/             # Domain-specific errors
│
└── infrastructure/         # 🛠️ Infrastructure layer
    ├── repositories/       # Repository implementations
    └── utils/              # Infrastructure utilities
```

## 4. Module Design

### 4.1 Domain Entities

The domain layer contains the core business entities, each with its own set of rules and behaviors:

#### 4.1.1 Todo Entity

The core entity of the application, representing a task to be completed. Todo entities are implemented as **immutable objects** - all methods return new Todo instances rather than modifying the existing one.

```typescript
export enum TodoStatus {
  PENDING = "pending",
  IN_PROGRESS = "in_progress",
  COMPLETED = "completed",
}

export enum WorkState {
  IDLE = "idle",
  ACTIVE = "active",
  PAUSED = "paused",
  COMPLETED = "completed",
}

export enum PriorityLevel {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
}

export class Todo {
  constructor(
    public readonly id: TodoId,
    public readonly title: string,
    public readonly description?: string,
    public readonly status: TodoStatus = TodoStatus.PENDING,
    public readonly workState: WorkState = WorkState.IDLE,
    public readonly totalWorkTime: number = 0,
    public readonly lastStateChangeAt: Date = new Date(),
    public readonly createdAt: Date = new Date(),
    public readonly updatedAt: Date = new Date(),
    public readonly priority: PriorityLevel = PriorityLevel.MEDIUM,
    public readonly projectId?: ProjectId,
    public readonly dependencies: TodoId[] = [],
    public readonly dependents: TodoId[] = [],
    public readonly dueDate?: Date,
    public readonly parentId?: TodoId,
    public readonly subtaskIds: TodoId[] = []
  ) {}

  // Domain methods - all return new Todo instances
  updateTitle(title: string): Todo { /* implementation */ }
  updateDescription(description?: string): Todo { /* implementation */ }
  updateStatus(status: TodoStatus): Todo { /* implementation */ }
  updatePriority(priority: PriorityLevel): Todo { /* implementation */ }
  updateDueDate(dueDate?: Date): Todo { /* implementation */ }
  
  // State management methods
  complete(currentTime?: Date): Todo { /* implementation */ }
  reopen(currentTime?: Date): Todo { /* implementation */ }
  start(currentTime?: Date): Todo { /* implementation */ }
  pause(currentTime?: Date): Todo { /* implementation */ }
  resume(currentTime?: Date): Todo { /* implementation */ }
  
  // Dependency management methods
  addDependency(dependencyId: TodoId): Todo { /* implementation */ }
  removeDependency(dependencyId: TodoId): Todo { /* implementation */ }
  addDependent(dependentId: TodoId): Todo { /* implementation */ }
  removeDependent(dependentId: TodoId): Todo { /* implementation */ }
  hasDependencyOn(dependencyId: TodoId): boolean { /* implementation */ }
  hasDependent(dependentId: TodoId): boolean { /* implementation */ }
  canBeCompleted(completedTodoIds: TodoId[]): boolean { /* implementation */ }
  
  // Due date methods
  isOverdue(currentDate: Date = new Date()): boolean { /* implementation */ }
  daysUntilDue(currentDate: Date = new Date()): number | null { /* implementation */ }
  
  // Subtask management methods
  addSubtask(subtaskId: TodoId): Todo { /* implementation */ }
  removeSubtask(subtaskId: TodoId): Todo { /* implementation */ }
  setParent(parentId: TodoId): Todo { /* implementation */ }
  removeParent(): Todo { /* implementation */ }
  hasSubtask(subtaskId: TodoId): boolean { /* implementation */ }
  isChildOf(parentId: TodoId): boolean { /* implementation */ }
}
```

#### 4.1.2 TodoActivity Entity

Tracks work activities related to a todo item.

```typescript
export class TodoActivity {
  constructor(
    public readonly id: string,
    public readonly todoId: string,
    public readonly type: ActivityType,
    public readonly workTime: number | null,
    public readonly previousState: WorkState | null,
    public readonly note: string | null,
    public readonly createdAt: Date
  ) {}
}
```

#### 4.1.3 Tag Entity

Used to categorize and filter todos. Tag entities are also implemented as immutable objects.

```typescript
export class Tag {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly color: string | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {}

  // Domain methods - all return new Tag instances
  updateName(name: string): Tag { /* implementation */ }
  updateColor(color: string | null): Tag { /* implementation */ }
}
```

#### 4.1.4 Project Entity

Groups related todos together. Project entities are also implemented as immutable objects.

```typescript
export enum ProjectStatus {
  ACTIVE = "active",
  ARCHIVED = "archived", 
}

export class Project {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly description: string | null,
    public readonly color: string | null,
    public readonly status: ProjectStatus,
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {}

  // Domain methods - all return new Project instances
  updateName(name: string): Project { /* implementation */ }
  updateDescription(description: string | null): Project { /* implementation */ }
  updateColor(color: string | null): Project { /* implementation */ }
  updateStatus(status: ProjectStatus): Project { /* implementation */ }
  archive(): Project { /* implementation */ }
  activate(): Project { /* implementation */ }
}
```

### 4.2 Repository Pattern

The application uses the repository pattern to abstract data access logic:

```
┌─────────────────┐         ┌───────────────────┐         ┌──────────────────┐
│                 │         │                   │         │                  │
│   Use Cases     │ ──────▶ │     Repository    │ ──────▶ │  Data Storage    │
│                 │         │    Interface      │         │  (e.g. Prisma)   │
└─────────────────┘         └───────────────────┘         └──────────────────┘
```

#### Repository Interface Example

```typescript
// domain/repositories/todo-repository.ts
export interface TodoRepository {
  findAll(): Promise<Todo[]>;
  findById(id: string): Promise<Todo | null>;
  create(todo: TodoCreationParams): Promise<Todo>;
  update(id: string, data: TodoUpdateParams): Promise<Todo>;
  delete(id: string): Promise<void>;
  // Query methods
  findByStatus(status: TodoStatus): Promise<Todo[]>;
  findByTag(tagId: string): Promise<Todo[]>;
  // etc.
}
```

#### Repository Implementation Example

```typescript
// infrastructure/repositories/prisma-todo-repository.ts
export class PrismaTodoRepository implements TodoRepository {
  constructor(private prisma: PrismaClient) {}

  async findAll(): Promise<Todo[]> {
    const todos = await this.prisma.todo.findMany();
    return todos.map(todo => this.mapToDomainTodo(todo));
  }

  async findById(id: string): Promise<Todo | null> {
    const todo = await this.prisma.todo.findUnique({ where: { id } });
    return todo ? this.mapToDomainTodo(todo) : null;
  }

  // ... Other implementations

  // Helper method to map from Prisma model to domain entity
  private mapToDomainTodo(todo: PrismaTodo): Todo {
    return new Todo(
      todo.id,
      todo.title,
      todo.description,
      todo.status as TodoStatus,
      todo.workState as WorkState,
      todo.totalWorkTime,
      todo.lastStateChangeAt,
      todo.createdAt,
      todo.updatedAt,
      todo.priority as PriorityLevel,
      todo.projectId,
      todo.dependencies,
      todo.dependents
    );
  }
}
```

### 4.3 Use Cases

The application layer contains use cases that implement business logic by coordinating domain entities:

```
┌─────────────────┐         ┌───────────────────┐         ┌──────────────────┐
│                 │         │                   │         │                  │
│  Presentation   │ ──────▶ │    Use Cases      │ ──────▶ │   Repositories   │
│                 │         │                   │         │                  │
└─────────────────┘         └───────────────────┘         └──────────────────┘
```

#### Use Case Example

```typescript
// application/use-cases/todo/create-todo.ts
export class CreateTodoUseCase {
  constructor(private todoRepository: TodoRepository) {}

  async execute(params: {
    title: string;
    description?: string | null;
    status?: TodoStatus;
    priority?: PriorityLevel;
    projectId?: string | null;
  }): Promise<Todo> {
    // Default values
    const status = params.status || TodoStatus.PENDING;
    const priority = params.priority || PriorityLevel.MEDIUM;
    
    // Domain validation
    if (params.title.trim() === '') {
      throw new InvalidTodoError('Title cannot be empty');
    }
    
    // Create the todo entity
    const todo = await this.todoRepository.create({
      title: params.title,
      description: params.description || null,
      status,
      workState: WorkState.IDLE,
      totalWorkTime: 0,
      lastStateChangeAt: new Date(),
      priority,
      projectId: params.projectId || null,
    });
    
    return todo;
  }
}
```

#### Activity Tracking Use Case Example

```typescript
// application/use-cases/todo-activity/record-todo-activity.ts
export class RecordTodoActivityUseCase {
  constructor(
    private todoRepository: TodoRepository,
    private todoActivityRepository: TodoActivityRepository
  ) {}

  async execute(params: {
    todoId: string;
    type: ActivityType;
    note?: string | null;
  }): Promise<TodoActivity> {
    // Find the todo
    const todo = await this.todoRepository.findById(params.todoId);
    if (!todo) {
      throw new TodoNotFoundError(params.todoId);
    }
    
    // Calculate work time if needed
    let workTime: number | null = null;
    let newWorkState: WorkState;
    
    switch (params.type) {
      case ActivityType.STARTED:
        if (todo.workState !== WorkState.IDLE && todo.workState !== WorkState.PAUSED) {
          throw new InvalidStateTransitionError(todo.workState, WorkState.ACTIVE);
        }
        newWorkState = WorkState.ACTIVE;
        break;
      
      case ActivityType.PAUSED:
        if (todo.workState !== WorkState.ACTIVE) {
          throw new InvalidStateTransitionError(todo.workState, WorkState.PAUSED);
        }
        workTime = this.calculateWorkTime(todo);
        newWorkState = WorkState.PAUSED;
        break;
      
      case ActivityType.COMPLETED:
        if (todo.workState === WorkState.COMPLETED) {
          throw new InvalidStateTransitionError(todo.workState, WorkState.COMPLETED);
        }
        if (todo.workState === WorkState.ACTIVE) {
          workTime = this.calculateWorkTime(todo);
        }
        newWorkState = WorkState.COMPLETED;
        break;
      
      // Handle other cases
    }
    
    // Update todo state
    const updatedTodo = await this.todoRepository.update(todo.id, {
      workState: newWorkState,
      lastStateChangeAt: new Date(),
      totalWorkTime: todo.totalWorkTime + (workTime || 0),
    });
    
    // Record activity
    const activity = await this.todoActivityRepository.create({
      todoId: todo.id,
      type: params.type,
      workTime,
      previousState: todo.workState,
      note: params.note || null,
    });
    
    return activity;
  }
  
  private calculateWorkTime(todo: Todo): number {
    if (todo.workState !== WorkState.ACTIVE) {
      return 0;
    }
    const now = new Date();
    return Math.floor((now.getTime() - todo.lastStateChangeAt.getTime()) / 1000);
  }
}
```

### 4.4 Validation Schemas

The presentation layer uses Valibot for input/output validation with reusable schema components:

```typescript
// presentation/schemas/todo-schemas.ts
import * as v from "valibot";
import { PriorityLevel, TodoStatus, WorkState } from "../../domain/entities/todo";
import { ActivityType } from "../../domain/entities/todo-activity";

/**
 * Common schema parts that are reused across different schemas
 */
export const CommonSchemas = {
  uuid: () => v.pipe(v.string(), v.uuid()),
  title: () => v.pipe(v.string(), v.minLength(1), v.maxLength(100)),
  description: () => v.optional(v.pipe(v.string(), v.maxLength(1000))),
  note: () => v.optional(v.pipe(v.string(), v.maxLength(500))),
  todoStatus: () => v.picklist([TodoStatus.PENDING, TodoStatus.IN_PROGRESS, TodoStatus.COMPLETED]),
  workState: () => v.picklist([WorkState.IDLE, WorkState.ACTIVE, WorkState.PAUSED, WorkState.COMPLETED]),
  activityType: () =>
    v.picklist([ActivityType.STARTED, ActivityType.PAUSED, ActivityType.COMPLETED, ActivityType.DISCARDED]),
  priorityLevel: () => v.picklist([PriorityLevel.LOW, PriorityLevel.MEDIUM, PriorityLevel.HIGH]),
  dueDate: () => v.optional(DateSchema),
};

/**
 * Base schema for entities with ID and timestamps
 */
export const BaseEntitySchema = v.object({
  id: CommonSchemas.uuid(),
  createdAt: DateSchema,
  updatedAt: DateSchema,
});

/**
 * Schema for Todo entity responses
 */
export const TodoSchema = v.object({
  id: CommonSchemas.uuid(),
  title: CommonSchemas.title(),
  description: CommonSchemas.description(),
  status: CommonSchemas.todoStatus(),
  workState: CommonSchemas.workState(),
  totalWorkTime: v.number(),
  lastStateChangeAt: DateSchema,
  dueDate: CommonSchemas.dueDate(),
  createdAt: DateSchema,
  updatedAt: DateSchema,
  priority: CommonSchemas.priorityLevel(),
  projectId: v.optional(CommonSchemas.uuid()),
  dependencies: v.optional(v.array(CommonSchemas.uuid())), // 依存するTodoのIDリスト
  dependents: v.optional(v.array(CommonSchemas.uuid())), // このTodoに依存するTodoのIDリスト
  parentId: v.optional(CommonSchemas.uuid()), // 親タスクのID
  subtaskIds: v.optional(v.array(CommonSchemas.uuid())), // サブタスクのIDリスト
});
```

## 5. Dependency Injection

The application uses a simple manual dependency injection pattern to manage dependencies:

```
┌─────────────────┐     injects    ┌───────────────────┐     injects    ┌──────────────────┐
│                 │                │                   │                │                  │
│     Routes      │ ◀────────────  │     Use Cases     │ ◀────────────  │   Repositories   │
│                 │                │                   │                │                  │
└─────────────────┘                └───────────────────┘                └──────────────────┘
```

### 5.1 Dependency Container

```typescript
// src/di-container.ts
export class DIContainer {
  private repositories: {
    todoRepository: TodoRepository;
    todoActivityRepository: TodoActivityRepository;
    tagRepository: TagRepository;
    projectRepository: ProjectRepository;
  };
  
  private useCases: {
    // Todo use cases
    createTodoUseCase: CreateTodoUseCase;
    updateTodoUseCase: UpdateTodoUseCase;
    // ... more use cases
  };
  
  constructor(prisma: PrismaClient) {
    // Initialize repositories
    this.repositories = {
      todoRepository: new PrismaTodoRepository(prisma),
      todoActivityRepository: new PrismaTodoActivityRepository(prisma),
      tagRepository: new PrismaTagRepository(prisma),
      projectRepository: new PrismaProjectRepository(prisma),
    };
    
    // Initialize use cases
    this.useCases = {
      createTodoUseCase: new CreateTodoUseCase(this.repositories.todoRepository),
      updateTodoUseCase: new UpdateTodoUseCase(this.repositories.todoRepository),
      // ... initialize other use cases
    };
  }
  
  // Getters for use cases
  getCreateTodoUseCase(): CreateTodoUseCase {
    return this.useCases.createTodoUseCase;
  }
  
  // ... more getters
}
```

### 5.2 Usage in Application Entry Point

```typescript
// src/index.ts
import { Hono } from 'hono';
import { PrismaClient } from '@prisma/client';
import { DIContainer } from './di-container';
import { todoRoutes } from './presentation/routes/todo-routes';
import { errorHandler } from './presentation/middlewares/error-handler';

// Initialize the application
const app = new Hono();

// Set up dependency injection
const prisma = new PrismaClient();
const container = new DIContainer(prisma);

// Add global middlewares
app.use('*', errorHandler);

// Register routes
app.route('/todos', todoRoutes(container));
// ... register other routes

// Export the app
export default app;
```

## 6. Error Handling

The application implements a robust error handling strategy through domain-specific errors and middleware:

### 6.1 Domain-specific Errors

```typescript
// domain/errors/todo-errors.ts
export class TodoNotFoundError extends Error {
  constructor(id: string) {
    super(`Todo with id '${id}' not found`);
    this.name = 'TodoNotFoundError';
  }
}

export class InvalidTodoError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidTodoError';
  }
}

export class InvalidStateTransitionError extends Error {
  constructor(currentState: WorkState, targetState: WorkState) {
    super(`Cannot transition from '${currentState}' to '${targetState}'`);
    this.name = 'InvalidStateTransitionError';
  }
}
```

### 6.2 Error Handling Middleware

```typescript
// presentation/middlewares/error-handler.ts
import { Context, Next } from 'hono';
import { HttpError } from '../errors/api-errors';

export const errorHandler = async (c: Context, next: Next) => {
  try {
    await next();
  } catch (error) {
    console.error(error);
    
    // Handle domain-specific errors
    if (error.name === 'TodoNotFoundError' || error.name === 'TagNotFoundError' || error.name === 'ProjectNotFoundError') {
      return c.json({ 
        error: {
          code: 'NOT_FOUND',
          message: error.message
        } 
      }, 404);
    }
    
    if (error.name === 'InvalidTodoError' || error.name === 'InvalidTagError' || error.name === 'InvalidProjectError') {
      return c.json({ 
        error: {
          code: 'VALIDATION_ERROR',
          message: error.message
        } 
      }, 400);
    }
    
    if (error.name === 'InvalidStateTransitionError') {
      return c.json({ 
        error: {
          code: 'INVALID_STATE',
          message: error.message
        } 
      }, 400);
    }
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      return c.json({ 
        error: {
          code: 'VALIDATION_ERROR',
          message: error.message,
          details: error.details
        } 
      }, 400);
    }
    
    // Handle HTTP errors explicitly thrown by controllers
    if (error instanceof HttpError) {
      return c.json({
        error: {
          code: error.code,
          message: error.message
        }
      }, error.status);
    }
    
    // Fallback for unexpected errors
    return c.json({ 
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred'
      } 
    }, 500);
  }
}
```

## 7. API Documentation

The application provides API documentation through OpenAPI specification:

```typescript
// src/index.ts
import { swaggerUI } from '@hono/swagger-ui';
import { openAPISpec } from './presentation/openapi/spec';

// ... set up app and routes

// OpenAPI documentation
app.get('/openapi.json', (c) => c.json(openAPISpec));
app.get('/docs', swaggerUI({ url: '/openapi.json' }));
```

## 8. Testing Strategy

### 8.1 Unit Testing

Each component is tested in isolation with mocked dependencies. The project uses Bun's test framework:

```typescript
// application/use-cases/todo/create-todo.spec.ts
import { describe, expect, it, mock } from "bun:test";
import { CreateTodoUseCase } from "./create-todo";
import { PriorityLevel, TodoStatus, WorkState } from "../../../domain/entities/todo";
import { createTestTodo } from "../../../domain/entities/test-helpers";

describe("CreateTodoUseCase", () => {
  const mockTodoRepository = {
    create: mock(() => Promise.resolve()),
    // ... other repository methods
  };
  
  const useCase = new CreateTodoUseCase(mockTodoRepository);
  
  test("should create a todo with default values when only title is provided", async () => {
    // Arrange
    const todoData = {
      title: "New Test Todo",
    };

    const now = new Date();
    const createdTodo = createTestTodo({
      id: "new-todo-id",
      title: "New Test Todo",
      status: TodoStatus.PENDING,
      workState: WorkState.IDLE,
      totalWorkTime: 0,
      lastStateChangeAt: now,
      createdAt: now,
      updatedAt: now,
      priority: PriorityLevel.MEDIUM,
    });

    mockTodoRepository.create.mockImplementationOnce(async () => Promise.resolve(createdTodo));

    // Act
    const result = await useCase.execute(todoData);

    // Assert
    expect(mockTodoRepository.create).toHaveBeenCalledTimes(1);
    expect(mockTodoRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "New Test Todo",
      }),
    );
    expect(result).toEqual(createdTodo);
  });
});
```

### 8.2 Integration Testing

Tests interactions between multiple components:

```typescript
// src/index.spec.ts
import { describe, expect, test, beforeAll, afterAll } from "bun:test";
import { Server } from "bun";
import app from "./index";

describe("Todo API Integration Tests", () => {
  let server: Server;
  let createdTodoId: string;

  // Start server before tests
  beforeAll(() => {
    server = app.listen();
  });

  // Stop server after tests
  afterAll(() => {
    server.stop();
  });

  test("should create a new todo", async () => {
    const response = await fetch(`${server.url}/todos`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: "Test Todo",
        description: "This is a test todo",
        priority: "high",
      }),
    });

    expect(response.status).toBe(201);
    const data = await response.json();
    expect(data.title).toBe("Test Todo");
    expect(data.description).toBe("This is a test todo");
    expect(data.status).toBe("pending");
    expect(data.priority).toBe("high");

    // Save the created Todo ID for subsequent tests
    createdTodoId = data.id;
  });
});
```

## 9. Conclusion

This architecture is designed to create a maintainable, testable, and scalable TODO management system. It follows clean architecture principles while remaining pragmatic for a small to medium-sized application.

The key benefits of this design are:

- 🧩 **Modular components** that can be developed, tested, and maintained independently
- 🔄 **Separation of concerns** allowing business logic to evolve independently from infrastructure
- 🔌 **Pluggable infrastructure** where database or API layer can be replaced with minimal impact
- 🧪 **Testable architecture** facilitating comprehensive unit and integration testing
