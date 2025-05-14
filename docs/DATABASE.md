# Database Design

## Overview

This document provides detailed information about the database design for the Toodo application. It uses SQLite database with access through Drizzle ORM.

## Database Schema

### Table Structure

#### 1. todos Table

This table stores Todo items.

| Column Name   | Data Type    | Constraints             | Description                         |
|---------------|--------------|-------------------------|-------------------------------------|
| id            | TEXT         | PRIMARY KEY             | Unique identifier for the Todo item (UUID) |
| title         | TEXT         | NOT NULL                | Todo item title                     |
| description   | TEXT         |                         | Todo item description (optional)    |
| status        | TEXT         | NOT NULL                | Status ('completed' or 'incomplete') |
| due_date      | INTEGER      |                         | Due date timestamp (optional)       |
| category_id   | TEXT         | REFERENCES categories(id) | Related category ID (optional)      |
| created_at    | INTEGER      | NOT NULL                | Creation timestamp                  |
| updated_at    | INTEGER      | NOT NULL                | Update timestamp                    |

#### 2. categories Table

This table stores categories for Todo items.

| Column Name   | Data Type    | Constraints             | Description                         |
|---------------|--------------|-------------------------|-------------------------------------|
| id            | TEXT         | PRIMARY KEY             | Unique identifier for the category (UUID) |
| name          | TEXT         | NOT NULL                | Category name                       |
| color         | TEXT         |                         | Category color (optional)           |
| created_at    | INTEGER      | NOT NULL                | Creation timestamp                  |
| updated_at    | INTEGER      | NOT NULL                | Update timestamp                    |

### Relationships

- **todos.category_id → categories.id**: A Todo item can belong to one category (many-to-one relationship).

### Indexes

The following indexes are created for efficient query execution:

1. **todos_status_idx**: Index on the `status` column of the `todos` table
   - Speeds up filtering by status

2. **todos_category_id_idx**: Index on the `category_id` column of the `todos` table
   - Speeds up filtering by category

3. **todos_due_date_idx**: Index on the `due_date` column of the `todos` table
   - Speeds up sorting and filtering by due date

4. **todos_created_at_idx**: Index on the `created_at` column of the `todos` table
   - Speeds up sorting by creation date

## Drizzle ORM Schema Definition

```typescript
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const todos = sqliteTable('todos', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description'),
  status: text('status', { enum: ['completed', 'incomplete'] }).notNull().default('incomplete'),
  dueDate: integer('due_date', { mode: 'timestamp' }),
  categoryId: text('category_id').references(() => categories.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const categories = sqliteTable('categories', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  color: text('color'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),
});

// Index definitions
export const todosStatusIndex = sqliteIndex('todos_status_idx').on(todos.status);
export const todosCategoryIdIndex = sqliteIndex('todos_category_id_idx').on(todos.categoryId);
export const todosDueDateIndex = sqliteIndex('todos_due_date_idx').on(todos.dueDate);
export const todosCreatedAtIndex = sqliteIndex('todos_created_at_idx').on(todos.createdAt);
```

## Migration Strategy

Database schema changes are managed using Drizzle ORM's migration features.

1. Define schema changes in the `src/db/schema` directory
2. Run the `bun run generate` command to generate migration files
3. Run the `bun run migrate` command to apply migrations

### Example Migration File

```typescript
import { migrate } from 'drizzle-orm/sqlite-core/migrate';
import { db } from './index';

// Migration folder path
const migrationsFolder = 'src/db/migrations';

// Execute migration
async function runMigration() {
  try {
    console.log('Running migrations...');
    await migrate(db, { migrationsFolder });
    console.log('Migrations completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
```

## Data Access Patterns

### 1. Basic CRUD Operations

```typescript
// Create Todo item
const createTodo = async (data: NewTodo) => {
  return db.insert(todos).values(data).returning();
};

// Get Todo item
const getTodo = async (id: string) => {
  return db.select().from(todos).where(eq(todos.id, id)).get();
};

// Update Todo item
const updateTodo = async (id: string, data: Partial<Todo>) => {
  return db.update(todos).set(data).where(eq(todos.id, id)).returning();
};

// Delete Todo item
const deleteTodo = async (id: string) => {
  return db.delete(todos).where(eq(todos.id, id));
};
```

### 2. Complex Query Example

```typescript
// Get Todo items with category information
const getTodosWithCategory = async (filters: TodoFilters) => {
  let query = db
    .select({
      todo: todos,
      category: categories,
    })
    .from(todos)
    .leftJoin(categories, eq(todos.categoryId, categories.id));

  // Filter by status
  if (filters.status) {
    query = query.where(eq(todos.status, filters.status));
  }

  // Filter by category
  if (filters.categoryId) {
    query = query.where(eq(todos.categoryId, filters.categoryId));
  }

  // Sort
  if (filters.sort === 'dueDate') {
    query = query.orderBy(filters.order === 'asc' ? asc(todos.dueDate) : desc(todos.dueDate));
  } else {
    query = query.orderBy(filters.order === 'asc' ? asc(todos.createdAt) : desc(todos.createdAt));
  }

  return query.all();
};
```

## Data Backup and Recovery

### Backup Strategy

1. Regular backups of the database file
2. Transaction log preservation
3. Secure storage of backup files

### Recovery Procedure

1. Retrieve the latest backup file
2. Stop the application
3. Restore the database file
4. Restart the application

## Performance Optimization

1. **Appropriate Indexes**: Set indexes on frequently searched/sorted columns
2. **Query Optimization**: Design queries to retrieve only necessary data
3. **Connection Pooling**: Efficiently manage database connections
4. **Regular Maintenance**: Remove unnecessary data and perform vacuum operations

## Security Considerations

1. **Input Validation**: Validate all user input
2. **Prepared Statements**: Prevent SQL injection
3. **Principle of Least Privilege**: Allow only necessary operations
4. **Sensitive Data Protection**: Encrypt confidential information 