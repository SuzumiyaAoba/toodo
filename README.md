# Toodo - Task Management Application

Toodo is a simple application that enables hierarchical task management. It is developed based on the principles of Domain-Driven Design (DDD) and Test-Driven Development (TDD).

## Tech Stack

- [Bun](https://bun.sh) - JavaScript runtime and package manager
- [Hono](https://hono.dev) - Fast, lightweight web framework
- [SQLite](https://www.sqlite.org) - Database (via Bun SQLite)
- [Drizzle ORM](https://orm.drizzle.team) - TypeScript ORM for database operations
- [tslog](https://tslog.js.org) - Logging library
- [UUID](https://www.npmjs.com/package/uuid) - Unique ID generation

## Project Structure

```
src/
├── application/          # Application layer
│   ├── services/         # Services
│   └── usecases/         # Use cases
│       └── task/         # Task-related use cases
├── domain/               # Domain layer
│   ├── models/           # Domain models
│   └── repositories/     # Repository interfaces
├── infrastructure/       # Infrastructure layer
│   ├── controllers/      # Controllers
│   └── repositories/     # Repository implementations
└── db/                   # Database related
    ├── migrations/       # Migration files
    ├── schema.ts         # Database schema
    └── migrate.ts        # Migration script
```

## Key Features

- Hierarchical task management (parent and child tasks)
- Create, update, and delete tasks
- Task status management (completed/incomplete)
- Task reordering
- Task movement (changing parent tasks)

## API

| Endpoint                       | Method | Description                                       |
| ------------------------------ | ------ | ------------------------------------------------- |
| `/api/tasks`                   | GET    | Get all root tasks (tasks without parents)        |
| `/api/tasks/:id`               | GET    | Get a task with the specified ID                  |
| `/api/tasks`                   | POST   | Create a new task                                 |
| `/api/tasks/:id`               | PATCH  | Update a task                                     |
| `/api/tasks/:id`               | DELETE | Delete a task                                     |
| `/api/tasks/:id/move`          | PATCH  | Move a task to a different parent task            |
| `/api/tasks/reorder`           | PUT    | Update the order of root tasks                    |
| `/api/tasks/:parentId/reorder` | PUT    | Update the order of child tasks for a parent task |

## Development

### Environment Setup

1. Clone the repository:

   ```
   git clone <repository-url>
   cd toodo
   ```

2. Install dependencies:

   ```
   bun install
   ```

3. Set up the database:

   ```
   bun run migrate
   ```

4. Start the development server:
   ```
   bun run dev
   ```
   The application runs at `http://localhost:3001` by default.

### Development Commands

- `bun run dev` - Start the development server
- `bun run test` - Run tests
- `bun run format` - Format code
- `bun run lint` - Lint code
- `bun run migrate` - Run database migrations
- `bun run studio` - Manage the database with Drizzle Studio

## Domain Model

This project adopts immutable domain models using records and factory functions.
It uses records instead of classes and creates new instances for object changes.

### Task Model

Tasks have the following attributes:

- `id` - Unique identifier for the task
- `parentId` - ID of the parent task (null for root tasks)
- `title` - Task title
- `description` - Task description (optional)
- `status` - Task status ("completed" or "incomplete")
- `order` - Order of the task within the same hierarchy
- `createdAt` - Task creation date/time
- `updatedAt` - Task update date/time
- `subtasks` - Array of child tasks

### Task Domain Functions

The Task namespace provides various pure functions to manipulate tasks:

```typescript
// Create a new task
Task.create(title, parentId?, description?, id?, status?, order?, createdAt?, updatedAt?, subtasks?);

// Add a subtask to a task
Task.addSubtask(task, title, description?);

// Update task properties
Task.updateTitle(task, title);
Task.updateDescription(task, description);
Task.updateStatus(task);
Task.updateOrder(task, order);

// Mark tasks as completed or incomplete
Task.markAsCompleted(task);
Task.markAsIncomplete(task);

// Reorder subtasks
Task.reorderSubtasks(task, orderMap);

// Task hierarchy operations
Task.getTaskHierarchy(task);
Task.findTaskById(task, id);
Task.getDepth(task);
```

## Code Conventions

- Use Biome for code linting and formatting
- Use 2 spaces for indentation
- Maximum line length: 120 characters
- Prefer `type` over `interface` for TypeScript type definitions
- Run `bun run format` before committing

## Contributing

Before submitting a pull request, make sure all tests pass and the code is formatted.

## License

This project is licensed under the MIT License.
