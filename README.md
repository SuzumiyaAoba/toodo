# Toodo

A modern Todo application built with Bun and Hono.

## Tech Stack

- [Bun](https://bun.sh/) - JavaScript runtime and package manager
- [Hono](https://hono.dev/) - Fast, lightweight web framework
- [SQLite](https://www.sqlite.org/) - Database (via Bun SQLite)
- [Drizzle ORM](https://orm.drizzle.team/) - TypeScript ORM
- [tslog](https://tslog.js.org/) - Logging library

## Features

- Create, read, update, and delete todo items
- Mark todos as complete/incomplete
- Filter todos by status
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

- `GET /todos` - Get all todos
- `GET /todos/:id` - Get a specific todo
- `POST /todos` - Create a new todo
- `PUT /todos/:id` - Update a todo
- `DELETE /todos/:id` - Delete a todo

## Contributing

Contributions are welcome! Please check out our [Contributing Guide](docs/CONTRIBUTING.md) for more details.

## License

This project is licensed under the MIT License.
