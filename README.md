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

> 🚧 **Development Status**: This repository is actively under development. API specifications and features may change. This is the current state as of April 2025.

## 💡 Overview

Toodo is a **REST API** application for efficient task management. It provides powerful features for personal and team task management, designed based on **Clean Architecture**. It's a modern API leveraging TypeScript's type safety and Hono's high performance.

**🏠 Local-First & Personal**: Toodo is specifically designed to focus on personal task management in local environments. Using SQLite as the database, it allows you to manage your personal TODOs efficiently without requiring complex infrastructure or cloud dependencies.

**🎵 Vibe Coding Implementation**: Almost all of the codebase has been implemented using **Vibe Coding** methodology, a flow-state programming approach that emphasizes harmony between code structure and functionality. This approach has enabled rapid development while maintaining high code quality and test coverage.

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
  - Set priorities and deadlines
  - Manage task dependencies

- **⏱️ Work Time Tracking**

  - Start/stop task work sessions
  - Automatic time calculation and aggregation
  - Record activity history

- **🏷️ Tag Management**

  - Create and manage custom tags
  - Tag tasks for organization
  - Filter by tags

- **📂 Project Management**
  - Create and organize projects
  - Manage tasks within projects
  - Create relationships between projects

## 🏗️ Architecture

Toodo is designed following the principles of Clean Architecture, with clear separation of concerns:

- 🌐 **Presentation Layer**

  - API endpoints, routing, and validation
  - Error handling and response formatting

- 🔄 **Application Layer**

  - Use cases and business logic orchestration
  - Transaction management

- 📊 **Domain Layer**

  - Business entities and domain logic
  - Repository interfaces and domain errors

- 🛠️ **Infrastructure Layer**
  - Data access and repository implementations
  - External service integration and persistence logic

For more details, see the [Architecture Documentation](./docs/architecture.md).

## 📊 Data Model

Key entities:

- **Todo**: Task information, status, priority, deadline, etc.
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

API documentation is available at http://localhost:3000/docs. Also check the [API Specification](./docs/api-spec.md) for detailed API information.

### Run Tests

```sh
# Run all tests
bun test

# Run specific tests
bun test src/domain/entities/todo.spec.ts

# Run E2E tests
bun test:e2e
```

## 📡 API Endpoints

| Method | Endpoint       | Description             |
| ------ | -------------- | ----------------------- |
| GET    | /api/todos     | Get all todos           |
| GET    | /api/todos/:id | Get a specific todo     |
| POST   | /api/todos     | Create a new todo       |
| PUT    | /api/todos/:id | Update an existing todo |
| DELETE | /api/todos/:id | Delete a todo           |
| GET    | /api/projects  | Get all projects        |
| POST   | /api/projects  | Create a new project    |
| GET    | /api/tags      | Get all tags            |
| POST   | /api/tags      | Create a new tag        |

See the [API Specification](./docs/api-spec.md) for more details.

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
├── prisma/           # Prisma schema and migration files
├── src/              # Source code
│   ├── application/  # Use cases
│   ├── domain/       # Domain entities and repository interfaces
│   ├── infrastructure/ # Repository implementations and external service integrations
│   └── presentation/ # API routes and schemas
└── test/             # Test helpers
```

### Coding Conventions

- Follow Clean Architecture principles
- Clearly separate responsibilities between layers
- Define appropriate types for all functions and classes
- Maintain high test coverage

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.
