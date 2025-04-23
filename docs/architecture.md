# Toodo Application Architecture Design

## 1. Overview

The Toodo application is a RESTful API system for managing TODO items. This document outlines the architecture to be implemented during the refactoring process.

### 1.1 Technology Stack

- TypeScript
- Hono (Web Framework)
- Valibot (Validation)
- Prisma (ORM)
- SQLite
- Bun (Runtime)

## 2. Architecture Principles

- **Separation of Concerns**: Each part of the code has a single responsibility
- **Modularity**: Split into independent modules to improve maintainability
- **Testability**: Design code structure that facilitates unit testing
- **Clean Architecture**: Keep business logic independent from infrastructure details

## 3. Architecture Structure

### 3.1 Layered Structure

The application is divided into the following layers:

1. **Presentation Layer** (`/src/presentation`):

   - API endpoints and routing
   - Request/response validation

2. **Application Layer** (`/src/application`):

   - Use cases
   - Services

3. **Domain Layer** (`/src/domain`):

   - Entities
   - Repository interfaces

4. **Infrastructure Layer** (`/src/infrastructure`):
   - Database access implementation
   - Repository implementation

### 3.2 Directory Structure

```
src/
├── index.ts                # Application entry point
├── presentation/           # Presentation layer
│   ├── controllers/        # Controllers
│   ├── routes/             # Route definitions
│   └── schemas/            # API schema definitions
├── application/            # Application layer
│   └── use-cases/          # Use case implementations
├── domain/                 # Domain layer
│   ├── entities/           # Entities
│   ├── repositories/       # Repository interfaces
│   └── errors/             # Domain errors
└── infrastructure/         # Infrastructure layer
    └── repositories/       # Repository implementations
```

## 4. Module Design

### 4.1 Todo Module

```typescript
// domain/entities/todo.ts
export interface Todo {
  id: string;
  title: string;
  description?: string;
  status: TodoStatus;
  workState: WorkState;
  totalWorkTime: number;
  lastStateChangeAt: Date;
  createdAt: Date;
  updatedAt: Date;
  priority: PriorityLevel; // Added priority field
}

export enum TodoStatus {
  PENDING = "pending",
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
} // Added PriorityLevel enum
```

### 4.2 Repository Example

```typescript
// domain/repositories/todo-repository.ts
import { Todo } from "../entities/todo";

export interface TodoRepository {
  findAll(): Promise<Todo[]>;
  findById(id: string): Promise<Todo | null>;
  create(todo: Omit<Todo, "id" | "createdAt" | "updatedAt">): Promise<Todo>;
  update(id: string, todo: Partial<Todo>): Promise<Todo | null>;
  delete(id: string): Promise<void>;
}
```

### 4.3 Use Case Example

```typescript
// application/use-cases/todo/create-todo.ts
import { Todo } from "../../../domain/entities/todo";
import { TodoRepository } from "../../../domain/repositories/todo-repository";

export class CreateTodoUseCase {
  constructor(private todoRepository: TodoRepository) {}

  async execute(data: {
    title: string;
    description?: string;
    status?: string;
  }) {
    return this.todoRepository.create({
      title: data.title,
      description: data.description,
      status: data.status || "pending",
      workState: "idle",
      totalWorkTime: 0,
      lastStateChangeAt: new Date(),
    });
  }
}
```

## 5. Dependency Injection

For this project, we'll use simple manual dependency injection:

```typescript
// Example in index.ts
const prisma = new PrismaClient();
const todoRepository = new PrismaTodoRepository(prisma);
const createTodoUseCase = new CreateTodoUseCase(todoRepository);
const todoController = new TodoController(createTodoUseCase);
```

## 6. Error Handling

We'll define domain-specific errors and use a simple error handling middleware:

```typescript
// presentation/middlewares/error-handler.ts
export const errorHandler = async (c, next) => {
  try {
    await next();
  } catch (error) {
    console.error(error);

    if (error.name === "TodoNotFoundError") {
      return c.json({ error: error.message }, 404);
    }

    // Handle other errors
    return c.json({ error: "Internal Server Error" }, 500);
  }
};
```

## 7. OpenAPI Documentation

We'll maintain the OpenAPI integration for API documentation:

```typescript
// Example in index.ts
app.get(
  "/openapi",
  openAPISpecs(app, {
    documentation: {
      info: {
        title: "Toodo API",
        version: "1.0.0",
      },
    },
  })
);

app.get(
  "/scalar",
  Scalar({
    spec: { url: "/openapi" },
  })
);
```

## 8. Refactoring Plan

1. Create the directory structure
2. Implement domain entities and interfaces
3. Create infrastructure implementations
4. Implement use cases
5. Build controllers and routes
6. Migrate endpoints one by one from old to new structure
7. Clean up and test

## 9. Final Notes

This architecture is designed to balance clean code principles with practical implementation for a personal project. The focus is on making the code maintainable and understandable without overengineering.
