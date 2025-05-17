# Toodo

A modern Todo application built with Bun and Hono.

## Tech Stack

- [Bun](https://bun.sh/) - JavaScript runtime and package manager
- [Hono](https://hono.dev/) - Fast, lightweight web framework
- [SQLite](https://www.sqlite.org/) - Database (via Bun SQLite)
- [Drizzle ORM](https://orm.drizzle.team/) - TypeScript ORM
- [tslog](https://tslog.js.org/) - Logging library

## Features

- Create, read, update, and delete task items
- Hierarchical task structure with parent/child relationships
- Mark tasks as complete/incomplete
- Reorder tasks
- Move tasks between different parent tasks
- REST API

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) (version >= 1.0.0)

### Installation

1. Clone the repository

   ```bash
   git clone https://github.com/SuzumiyaAoba/toodo.git
   cd toodo
   ```

2. Install dependencies

   ```bash
   bun install
   ```

3. Set up the database

   ```bash
   bun run migrate
   ```

4. Start the development server
   ```bash
   bun run dev
   ```

The server will be running at http://localhost:3000.

## Available Scripts

- `bun run dev` - Start the development server with hot reloading
- `bun run build` - Build the application for production
- `bun run start` - Start the production server
- `bun run test` - Run tests
- `bun run lint` - Run linter
- `bun run format` - Format code
- `bun run generate` - Generate database migrations
- `bun run migrate` - Apply database migrations
- `bun run studio` - Open Drizzle Studio for database management

## API Endpoints

### Task API

- `GET /api/tasks` - Get all root tasks
- `GET /api/tasks/:id` - Get a specific task with its subtasks
- `POST /api/tasks` - Create a new task
- `PATCH /api/tasks/:id` - Update a task
- `DELETE /api/tasks/:id` - Delete a task
- `PATCH /api/tasks/:id/move` - Move a task to a new parent
- `PUT /api/tasks/reorder` - Reorder root tasks
- `PUT /api/tasks/:parentId/reorder` - Reorder tasks under a specific parent

## Contributing

Contributions are welcome! Please check out our [Contributing Guide](docs/CONTRIBUTING.md) for more details.

## License

This project is licensed under the MIT License.
