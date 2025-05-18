# Architecture Design

## System Overview

Toodo is a simple and efficient Todo application. It is built using the Bun runtime and Hono framework, leveraging SQLite database (via Bun's SQLite support) and Drizzle ORM.

## Architecture Diagram

```
┌───────────────┐     ┌────────────────┐     ┌──────────────┐
│               │     │                │     │              │
│    Client     ├────▶│   API Server   ├────▶│   Database   │
│               │     │    (Hono)      │     │   (SQLite)   │
└───────────────┘     └────────────────┘     └──────────────┘
```

## Component Structure

### 1. API Server (Hono)

- **Routing**: Handles HTTP requests from clients
- **Middleware**: Authentication, logging, error handling
- **Controllers**: Implementation of business logic
- **Validation**: Verification of input data

### 2. Data Access Layer (Drizzle ORM)

- **Model Definition**: Schema of data models
- **Migration**: Version control for database schema
- **Query Builder**: Type-safe database operations

### 3. Database (SQLite)

- **Tables**: Stores Task items and their relationships
- **Indexes**: Efficient query execution
- **Relationships**: Connections between data models

## Project Structure (Domain-Driven Design)

```
src/
├── index.ts                  # Application entry point
├── domain/                   # Domain layer
│   ├── models/               # Domain models (Tasks, etc.)
│   │   ├── errors/           # Domain-specific errors
│   │   ├── schema/           # Schema definitions
│   │   └── Task.ts           # Task domain model
│   └── repositories/         # Repository interfaces
├── application/              # Application layer
│   ├── services/             # Application services
│   │   └── DependencyContainer.ts # DI container
│   └── usecases/             # Use cases
│       └── task/             # Task-related use cases
├── infrastructure/           # Infrastructure layer
│   ├── controllers/          # API controllers
│   ├── repositories/         # Repository implementations
│   └── utils/                # Infrastructure utilities
└── db/                       # Database-related files
    └── migrations/           # Migration files
```

## Key Data Flow

1. Client sends a request to an API endpoint
2. Hono router routes the request to the appropriate controller based on route and HTTP method
3. Controller validates the request and delegates tasks to the appropriate use case
4. Use case executes business logic and interacts with domain repositories as needed
5. Repository implementation interacts with the database through Drizzle ORM
6. Results flow back up the chain: repository -> use case -> controller -> client
7. Controller formats the response and sends it to the client as an appropriate HTTP response

## Domain Models

### Task

The Task domain model represents a task in the system. Key features:

- **Immutability**: All Task objects are immutable
- **Factory Functions**: Tasks are created and manipulated through pure functions
- **Hierarchical Structure**: Tasks can have subtasks, forming a tree structure
- **Task Status**: Tasks can be marked as "completed" or "incomplete"
- **Order Management**: Tasks maintain their display order

### Key Domain Operations

- Creating tasks and subtasks
- Updating task properties (title, description, status)
- Moving tasks in the hierarchy
- Reordering tasks and subtasks
- Task completion state management (including cascading completion)

## Technical Considerations

### Performance

- Index design for efficient queries
- Optimized hierarchical data retrieval

### Security

- Input validation
- Proper error handling
- Secure data storage

### Scalability

- Modular design aligned with DDD principles
- Separation of concerns through layered architecture
- Flexible domain models for future expansion

### Maintainability

- Consistent coding conventions
- Clear documentation
- Comprehensive testing strategy
- Domain-Driven Design for better alignment with business needs
