# Toodo Application Architecture Design

## 1. Overview

The Toodo application is a RESTful API system for managing TODO items. This document explains the details of the application's architecture design.

### 1.1 Technology Stack

- **Backend**: TypeScript
- **Web Framework**: [Hono](https://hono.dev/)
- **Validation**: [Valibot](https://valibot.dev/)
- **Database ORM**: Prisma
- **Database**: SQLite
- **Runtime**: Bun

## 2. Architecture Principles

The following design principles are applied for refactoring:

1. **Separation of Concerns**: Each part of the code has a single responsibility
2. **Modularity**: Split into independent modules by function to improve reusability and maintainability
3. **Testability**: Design code structure that facilitates unit testing
4. **Explicit Dependencies**: Make dependencies between modules explicit
5. **Clean Architecture**: Keep business logic independent from infrastructure details

## 3. Architecture Structure

### 3.1 Layered Structure

The application is divided into the following layers:

1. **Presentation Layer** (`/src/presentation`):
   - API endpoints
   - Request/response validation
   - Routing

2. **Application Layer** (`/src/application`):
   - Use cases
   - Services
   - Command/query handlers

3. **Domain Layer** (`/src/domain`):
   - Entities
   - Domain logic
   - Repository interfaces

4. **Infrastructure Layer** (`/src/infrastructure`):
   - Database access implementation
   - External service integration
   - Repository implementation

### 3.2 Directory Structure

```
src/
├── index.ts                # Application entry point
├── config/                 # Configuration files
├── presentation/           # Presentation layer
│   ├── api/                # API-related code
│   │   ├── controllers/    # Controllers
│   │   ├── middlewares/    # Middlewares
│   │   ├── validators/     # Validators
│   │   └── routes/         # Route definitions
│   └── schemas/            # API schema definitions
├── application/            # Application layer
│   ├── use-cases/          # Use case implementations
│   ├── services/           # Service implementations
│   └── dtos/               # Data transfer objects
├── domain/                 # Domain layer
│   ├── entities/           # Entities
│   ├── repositories/       # Repository interfaces
│   ├── value-objects/      # Value objects
│   └── errors/             # Domain errors
├── infrastructure/         # Infrastructure layer
│   ├── database/           # Database related
│   │   ├── repositories/   # Repository implementations
│   │   └── prisma/         # Prisma related
│   └── services/           # External service integration
└── utils/                  # Utility functions
```

## 4. Module Design

### 4.1 Todo Module

The Todo module is responsible for managing TODO items.

#### 4.1.1 Domain Model

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
```

#### 4.1.2 Repository Interface

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

#### 4.1.3 Use Cases

```typescript
// application/use-cases/todo/create-todo.ts
import { Todo } from "../../../domain/entities/todo";
import { TodoRepository } from "../../../domain/repositories/todo-repository";
import { CreateTodoDto } from "../../dtos/todo";

export class CreateTodoUseCase {
  constructor(private todoRepository: TodoRepository) {}

  async execute(dto: CreateTodoDto): Promise<Todo> {
    return this.todoRepository.create({
      title: dto.title,
      description: dto.description,
      status: dto.status || "pending",
      workState: dto.workState || "idle",
      totalWorkTime: 0,
      lastStateChangeAt: new Date(),
    });
  }
}
```

### 4.2 TodoActivity Module

The TodoActivity module manages the activity history of TODOs.

#### 4.2.1 Domain Model

```typescript
// domain/entities/todo-activity.ts
export interface TodoActivity {
  id: string;
  todoId: string;
  type: ActivityType;
  workTime?: number;
  previousState?: string;
  note?: string;
  createdAt: Date;
}

export enum ActivityType {
  STARTED = "started",
  PAUSED = "paused",
  COMPLETED = "completed",
  DISCARDED = "discarded",
}
```

#### 4.2.2 Repository Interface

```typescript
// domain/repositories/todo-activity-repository.ts
import { TodoActivity } from "../entities/todo-activity";

export interface TodoActivityRepository {
  findByTodoId(todoId: string): Promise<TodoActivity[]>;
  findById(id: string): Promise<TodoActivity | null>;
  create(activity: Omit<TodoActivity, "id" | "createdAt">): Promise<TodoActivity>;
  delete(id: string): Promise<void>;
}
```

### 4.3 Controllers and Routing

```typescript
// presentation/api/controllers/todo-controller.ts
import { Context } from "hono";
import { CreateTodoUseCase } from "../../../application/use-cases/todo/create-todo";
import { GetTodoListUseCase } from "../../../application/use-cases/todo/get-todo-list";
// ... other use cases

export class TodoController {
  constructor(
    private createTodoUseCase: CreateTodoUseCase,
    private getTodoListUseCase: GetTodoListUseCase,
    // ... other use cases
  ) {}

  async create(c: Context) {
    const data = c.req.valid("json");
    const todo = await this.createTodoUseCase.execute(data);
    return c.json(todo, 201);
  }

  async getList(c: Context) {
    const todos = await this.getTodoListUseCase.execute();
    return c.json(todos);
  }

  // ... other methods
}
```

## 5. Dependency Injection

By explicitly passing the dependencies a class needs, we improve testability and reusability.

```typescript
// infrastructure/database/repositories/prisma-todo-repository.ts
import { PrismaClient } from "@prisma/client";
import { TodoRepository } from "../../../domain/repositories/todo-repository";
import { Todo } from "../../../domain/entities/todo";

export class PrismaTodoRepository implements TodoRepository {
  constructor(private prisma: PrismaClient) {}

  async findAll(): Promise<Todo[]> {
    return this.prisma.todo.findMany();
  }

  // ... other methods
}
```

## 6. Error Handling

To maintain consistent error handling throughout the application, domain-specific error classes are defined.

```typescript
// domain/errors/todo-errors.ts
export class TodoNotFoundError extends Error {
  constructor(id: string) {
    super(`Todo with id ${id} not found`);
    this.name = "TodoNotFoundError";
  }
}

export class InvalidStateTransitionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidStateTransitionError";
  }
}
```

## 7. Validation

Validation is performed in the presentation layer using Valibot.

```typescript
// presentation/schemas/todo-schemas.ts
import * as v from "valibot";

export const CreateTodoSchema = v.object({
  title: v.pipe(v.string(), v.minLength(1), v.maxLength(100)),
  description: v.optional(v.pipe(v.string(), v.maxLength(1000))),
  status: v.optional(v.picklist(["pending", "completed"])),
  workState: v.optional(v.picklist(["idle", "active", "paused", "completed"])),
});
```

## 8. Testing Strategy

### 8.1 Unit Tests

Unit tests are conducted for independent components in each layer.

- **Domain Logic Tests**: Tests for entities and value objects
- **Use Case Tests**: Tests for business logic in the application layer
- **Repository Tests**: Tests for data access in the infrastructure layer

### 8.2 Integration Tests

Integration tests are conducted for each endpoint to verify API behavior.

## 9. Refactoring Plan

1. **Phase 1**: Reorganize project structure and create directories
2. **Phase 2**: Implement domain models and repository interfaces
3. **Phase 3**: Implement use cases in the application layer
4. **Phase 4**: Implement the presentation layer
5. **Phase 5**: Implement the infrastructure layer
6. **Phase 6**: Add tests
7. **Phase 7**: Update documentation and code review

## 10. Performance and Optimization

- **Caching Strategy**: Consider caching query results
- **Avoiding N+1 Problems**: Implement efficient queries using Prisma's include
- **Index Optimization**: Design indexes to improve database query performance

## 11. Security Considerations

- **Input Validation**: Strictly validate all user input
- **Error Handling**: Error responses that don't expose sensitive information
- **Authentication/Authorization**: Design architecture to accommodate future authentication systems

## 12. Monitoring and Logging

- **Structured Logging**: Record application actions and errors
- **Performance Metrics**: Monitor request processing time and resource usage
- **Health Checks**: Endpoints to check the application state

## 13. Summary

This architecture design serves as a guideline for refactoring the Toodo application into a scalable and maintainable structure. Based on the principles of separation of concerns, modularity, and testability, the application is divided into clear layers, clarifying the responsibilities of each component.

During the refactoring process, we will gradually improve the codebase while maintaining existing functionality.