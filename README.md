# 📋 Toodo - Efficient Task Management API

<div align="center">

<p>
  <img src="https://img.shields.io/badge/status-in%20development-blue?style=for-the-badge" alt="Status: In Development">
  <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/Hono-E6E6E6?style=for-the-badge&logo=hono&logoColor=black" alt="Hono">
  <img src="https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white" alt="Prisma">
  <img src="https://img.shields.io/badge/Bun-000000?style=for-the-badge&logo=bun&logoColor=white" alt="Bun">
  <img src="https://img.shields.io/badge/SQLite-003B57?style=for-the-badge&logo=sqlite&logoColor=white" alt="SQLite">
  <img src="https://img.shields.io/badge/Clean%20Architecture-16a34a?style=for-the-badge" alt="Clean Architecture">
  <img src="https://img.shields.io/badge/Vibe%20Coding-9C27B0?style=for-the-badge" alt="Vibe Coding">
</p>

</div>

> 🚧 **Development Status**: This repository is actively under development. API specifications and features may change. (Last updated: April 2025)

## 💡 Overview

Toodo is a **REST API** application for efficient task management. It provides powerful features for personal and team task management, designed based on **Clean Architecture**. It's a modern API leveraging TypeScript's type safety and Hono's high performance.

**🏠 Local-First & Personal**: Toodo is designed for personal/local task management. Using SQLite, you can manage your TODOs efficiently without cloud dependencies.

**🎵 Vibe Coding Implementation**: The codebase is developed with the "Vibe Coding" methodology, focusing on harmony between code structure and functionality for rapid, high-quality development.

<div align="center">
  <table>
    <tr>
      <td align="center">🎯 <b>Efficient</b></td>
      <td align="center">⚙️ <b>Extensible</b></td>
      <td align="center">🔒 <b>Type-Safe</b></td>
      <td align="center">🧩 <b>Modular</b></td>
      <td align="center">💻 <b>Local-First</b></td>
      <td align="center">🎵 <b>Vibe Coded</b></td>
    </tr>
  </table>
</div>

## ✨ Key Features

- **📝 Todo Management**
  - Create, update, and delete tasks
  - Set priorities, deadlines, and tags
  - Manage task dependencies and subtasks
- **⏱️ Work Time Tracking**
  - Start/stop work sessions, automatic time calculation
  - Record activity history for each todo
- **🏷️ Tag Management**
  - Create and manage custom tags
  - Tag tasks and filter by tags
- **📂 Project Management**
  - Create and organize projects
  - Assign todos to projects and filter by project
- **🔗 Dependency & Subtask Management**
  - Set dependencies between todos (with cycle detection)
  - Manage subtasks and parent-child relationships

## 🏗️ Architecture

Toodo is designed following Clean Architecture principles. See [Architecture Documentation](./docs/architecture.md) for details.

- **Presentation Layer**: API endpoints, routing, validation, error handling
- **Application Layer**: Use cases, business logic orchestration
- **Domain Layer**: Business entities, repository interfaces, domain errors
- **Infrastructure Layer**: Data access, repository implementations

## 📊 Data Model

Key entities:

- **Todo**: Task information, status, priority, deadline, dependencies, subtasks, etc.
- **TodoActivity**: Task work activity records
- **TodoDependency**: Dependency relationships between tasks
- **Tag**: Tags for task classification
- **Project**: Projects for grouping tasks

## 🚀 Usage

### Prerequisites

- [Bun](https://bun.sh/) v1.0.0 or higher
- [Node.js](https://nodejs.org/) v18 or higher (if not using Bun)

### Installation

```sh
# Clone the repository
git clone https://github.com/SuzumiyaAoba/toodo.git
cd toodo

# Install dependencies
bun install

# Set up the database
bun prisma migrate dev
```

### Start Development Server

```sh
bun run dev
```

The server will start at http://localhost:3000.

### API Documentation

- Swagger UI: http://localhost:3000/docs
- [API Specification (Markdown)](./docs/api-spec.md)

### Run Type Check

```sh
bun typecheck
```

### Run Tests

```sh
# Run all tests
bun test

# Run specific tests
bun test src/domain/entities/todo.spec.ts

# Run E2E tests
bun test:e2e
```

## 📡 API Endpoints (Main)

| Method | Endpoint                                     | Description                     |
| ------ | -------------------------------------------- | ------------------------------- |
| GET    | /api/v1/todos                                | Get all todos                   |
| GET    | /api/v1/todos/:id                            | Get a specific todo             |
| POST   | /api/v1/todos                                | Create a new todo               |
| PUT    | /api/v1/todos/:id                            | Update an existing todo         |
| DELETE | /api/v1/todos/:id                            | Delete a todo                   |
| GET    | /api/v1/todos/:id/activities                 | Get todo activity history       |
| POST   | /api/v1/todos/:id/activities                 | Add a todo activity             |
| GET    | /api/v1/todos/:id/work-time                  | Get total work time for a todo  |
| POST   | /api/v1/todos/:id/dependencies/:dependencyId | Add a dependency to a todo      |
| DELETE | /api/v1/todos/:id/dependencies/:dependencyId | Remove a dependency from a todo |
| GET    | /api/v1/todos/:id/dependencies               | Get dependencies of a todo      |
| GET    | /api/v1/todos/:id/dependents                 | Get dependents of a todo        |
| GET    | /api/v1/todos/:id/dependency-tree            | Get dependency tree for a todo  |
| POST   | /api/v1/todos/:id/subtasks/:subtaskId        | Add a subtask to a todo         |
| DELETE | /api/v1/todos/:id/subtasks/:subtaskId        | Remove a subtask from a todo    |
| GET    | /api/v1/todos/:id/subtasks                   | Get subtasks of a todo          |
| GET    | /api/v1/projects                             | Get all projects                |
| POST   | /api/v1/projects                             | Create a new project            |
| GET    | /api/v1/projects/:id                         | Get a specific project          |
| PUT    | /api/v1/projects/:id                         | Update a project                |
| DELETE | /api/v1/projects/:id                         | Delete a project                |
| GET    | /api/v1/projects/:id/todos                   | Get todos in a project          |
| POST   | /api/v1/projects/:id/todos                   | Add a todo to a project         |
| DELETE | /api/v1/projects/:id/todos/:todoId           | Remove a todo from a project    |
| GET    | /api/v1/tags                                 | Get all tags                    |
| POST   | /api/v1/tags                                 | Create a new tag                |
| GET    | /api/v1/tags/:id                             | Get a specific tag              |
| PUT    | /api/v1/tags/:id                             | Update a tag                    |
| DELETE | /api/v1/tags/:id                             | Delete a tag                    |
| POST   | /api/v1/todos/:todoId/tags                   | Assign a tag to a todo          |
| DELETE | /api/v1/todos/:todoId/tags/:tagId            | Remove a tag from a todo        |
| GET    | /api/v1/tags/:id/todos                       | Get todos with a specific tag   |

See the [API Specification](./docs/api-spec.md) for full details and all parameters.

## 🧪 Tech Stack

- **Backend**
  - [TypeScript](https://www.typescriptlang.org/) - Type-safe programming language
  - [Hono](https://hono.dev/) - Lightweight and fast web framework
  - [Prisma](https://www.prisma.io/) - Type-safe database ORM
  - [SQLite](https://www.sqlite.org/) - Embedded database
  - [Bun](https://bun.sh/) - JavaScript/TypeScript runtime and test framework
  - [Valibot](https://valibot.dev/) - Runtime validation library

## 🛠️ Development

### Project Structure

```
toodo/
├── docs/             # Documentation
├── packages/
│   ├── api/          # API implementation (main)
│   └── core/         # Domain models and shared logic
├── prisma/           # Prisma schema and migration files
├── README.md         # This file
└── ...
```

### Coding Conventions

- Follow Clean Architecture principles
- Clearly separate responsibilities between layers
- Define appropriate types for all functions and classes
- Maintain high test coverage

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a new branch for your feature or fix
3. Make your changes and add tests
4. Run `bun typecheck` and `bun test` to ensure everything passes
5. Submit a pull request

## 📄 Documentation

- [API Specification](./docs/api-spec.md)
- [Architecture](./docs/architecture.md)
- [Requirements](./docs/requirements-spec.md)

---

© 2025 SuzumiyaAoba
