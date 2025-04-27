# Toodo Application Architecture Design

## 1. Overview

The Toodo application is a RESTful API system for managing TODO items. This document outlines the architecture to be implemented during the refactoring process.

### 1.1 Technology Stack

📚 **Core Technologies**

- 🟦 **TypeScript** - Strongly typed programming language
- 🌐 **Hono** - Lightweight, fast web framework
- ✅ **Valibot** - Runtime validation library
- 🔄 **Prisma** - Type-safe database ORM
- 🗄️ **SQLite** - Embedded database
- 🏃 **Bun** - JavaScript/TypeScript runtime

## 2. Architecture Principles

- 🔍 **Separation of Concerns**: Each part of the code has a single responsibility
- 🧩 **Modularity**: Split into independent modules to improve maintainability
- 🧪 **Testability**: Design code structure that facilitates unit testing
- 🏛️ **Clean Architecture**: Keep business logic independent from infrastructure details

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

The core entity of the application, representing a task to be completed.

```typescript
export class Todo {
  constructor(
    public readonly id: string,
    public title: string,
    public description: string | null,
    public status: TodoStatus,
    public workState: WorkState,
    public totalWorkTime: number,
    public lastStateChangeAt: Date,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public priority: PriorityLevel,
    public projectId: string | null
  ) {}

  // Domain methods
  updateTitle(title: string): void { /* implementation */ }
  updateDescription(description: string | null): void { /* implementation */ }
  updateStatus(status: TodoStatus): void { /* implementation */ }
  updatePriority(priority: PriorityLevel): void { /* implementation */ }
  
  // State management methods
  startWork(): void { /* implementation */ }
  pauseWork(): void { /* implementation */ }
  completeWork(): void { /* implementation */ }
  // etc.
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

Used to categorize and filter todos.

```typescript
export class Tag {
  constructor(
    public readonly id: string,
    public name: string,
    public color: string | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {}

  updateName(name: string): void { /* implementation */ }
  updateColor(color: string | null): void { /* implementation */ }
}
```

#### 4.1.4 Project Entity

Groups related todos together.

```typescript
export class Project {
  constructor(
    public readonly id: string,
    public name: string,
    public description: string | null,
    public color: string | null,
    public status: ProjectStatus,
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {}

  updateName(name: string): void { /* implementation */ }
  updateDescription(description: string | null): void { /* implementation */ }
  updateColor(color: string | null): void { /* implementation */ }
  updateStatus(status: ProjectStatus): void { /* implementation */ }
  archive(): void { /* implementation */ }
  activate(): void { /* implementation */ }
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
      todo.projectId
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

Each component is tested in isolation with mocked dependencies:

```typescript
// application/use-cases/todo/create-todo.spec.ts
describe('CreateTodoUseCase', () => {
  let useCase: CreateTodoUseCase;
  let mockTodoRepository: jest.Mocked<TodoRepository>;
  
  beforeEach(() => {
    mockTodoRepository = {
      create: jest.fn(),
      // ... other repository methods
    } as any;
    
    useCase = new CreateTodoUseCase(mockTodoRepository);
  });
  
  it('should create a todo with default values', async () => {
    // Arrange
    const params = { title: 'Test Todo' };
    const expectedTodo = { id: '123', title: 'Test Todo', /* ... */ };
    mockTodoRepository.create.mockResolvedValue(expectedTodo);
    
    // Act
    const result = await useCase.execute(params);
    
    // Assert
    expect(result).toEqual(expectedTodo);
    expect(mockTodoRepository.create).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Test Todo',
      status: 'pending',
      priority: 'medium',
      workState: 'idle',
    }));
  });
  
  it('should throw error for empty title', async () => {
    // Arrange
    const params = { title: '   ' };
    
    // Act & Assert
    await expect(useCase.execute(params)).rejects.toThrow('Title cannot be empty');
    expect(mockTodoRepository.create).not.toHaveBeenCalled();
  });
});
```

### 8.2 Integration Testing

Tests interactions between multiple components:

```typescript
// test/integration/todo-api.spec.ts
describe('Todo API', () => {
  let app: Hono;
  let prisma: PrismaClient;
  
  beforeAll(async () => {
    prisma = new PrismaClient();
    // Set up test database
    await prisma.$connect();
    
    // Initialize app with test dependencies
    const container = new DIContainer(prisma);
    app = createApp(container);
  });
  
  afterAll(async () => {
    await prisma.$disconnect();
  });
  
  beforeEach(async () => {
    // Clear test data
    await prisma.todoActivity.deleteMany();
    await prisma.todoTag.deleteMany();
    await prisma.todo.deleteMany();
    await prisma.tag.deleteMany();
    await prisma.project.deleteMany();
  });
  
  describe('POST /todos', () => {
    it('should create a new todo', async () => {
      // Arrange
      const todoData = {
        title: 'Integration Test Todo',
        description: 'Test description',
        priority: 'high'
      };
      
      // Act
      const response = await app.request('/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(todoData)
      });
      
      // Assert
      expect(response.status).toBe(201);
      const responseBody = await response.json();
      expect(responseBody).toMatchObject({
        title: todoData.title,
        description: todoData.description,
        priority: todoData.priority,
        status: 'pending'
      });
      
      // Verify in database
      const savedTodo = await prisma.todo.findUnique({
        where: { id: responseBody.id }
      });
      expect(savedTodo).not.toBeNull();
      expect(savedTodo?.title).toBe(todoData.title);
    });
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
