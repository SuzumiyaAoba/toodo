# Toodo - Task Management Application Requirements Specification

## 1. Overview

Toodo is a REST API application designed for efficient task management for individuals and teams.

## 2. Functional Requirements

### 2.1 Todo Management

#### 2.1.1 Basic Functions

- Create, read, update, and delete (CRUD) Todo items
- Todo status management (Pending, In Progress, Completed, Cancelled)
- Adding descriptions to Todos
- Todo priority setting (Low, Medium, High)

#### 2.1.2 Work State Tracking

- Todo work state management (Idle, Active, Paused, Completed)
- Recording and aggregating work time
- Saving state change history

#### 2.1.3 Dependency Management

- Setting dependencies between Todo items
- Displaying Todos with dependencies
- Displaying dependent Todos
- Detecting and preventing circular dependencies
- Status restrictions based on dependencies (e.g., cannot be completed until dependent Todos are completed)

#### 2.1.4 Due Date Management

- Setting due dates for Todo items
- Tracking overdue Todos
- Displaying Todos due soon
- Filtering Todos by due date range

#### 2.1.5 Subtask Management

- Creating hierarchical task structures
- Adding existing Todos as subtasks
- Creating new subtasks directly
- Viewing subtask trees
- Removing subtask relationships

#### 2.1.6 Work Period Management

- Creating work periods with names and time ranges
- Associating Todo activities with work periods
- Viewing work periods
- Updating work period details
- Deleting work periods

### 2.2 Tag Management

- Create, read, update, and delete tags
- Setting tag names and colors
- Tagging Todos
- Filtering Todos by tags

### 2.3 Project Management

- Create, read, update, and delete projects
- Setting project names, descriptions, and colors
- Project status management (Active, Archived)
- Assigning Todos to projects
- Filtering Todos by projects

### 2.4 Bulk Operations

#### 2.4.1 Tag Operations

- Bulk assigning tags to multiple Todos
- Bulk removing tags from multiple Todos
- Tracking success and failure counts for bulk operations

#### 2.4.2 Due Date Operations

- Bulk updating due dates for multiple Todos
- Maintaining consistency in bulk updates

## 3. Non-Functional Requirements

### 3.1 Performance

- Target average API response time under 200ms
- Ability to handle 50 simultaneous requests

### 3.2 Security

- Input validation
- SQL injection prevention
- XSS prevention

### 3.3 Extensibility

- Code structure that facilitates easy addition of new features
- Adherence to clean architecture principles

### 3.4 Reliability

- Consistent error handling
- Appropriate logging
- Unit and integration test coverage of at least 80%

## 4. User Stories

### 4.1 Todo Management

1. Users can create new Todos
2. Users can view a list of Todos
3. Users can view Todo details
4. Users can edit Todos
5. Users can delete Todos
6. Users can mark Todos as completed
7. Users can set Todo status
8. Users can start/pause/resume work on Todos
9. Users can set dependencies between Todos
10. Users can view Todo dependencies
11. Users can set due dates for Todos
12. Users can view overdue Todos
13. Users can view Todos due soon
14. Users can create subtasks
15. Users can view subtask trees
16. Users can manage subtask relationships

### 4.2 Tag Management

1. Users can create new tags
2. Users can view a list of tags
3. Users can edit tags
4. Users can delete tags
5. Users can tag Todos
6. Users can filter Todos by tags

### 4.3 Project Management

1. Users can create new projects
2. Users can view a list of projects
3. Users can view project details
4. Users can edit projects
5. Users can delete projects
6. Users can add Todos to projects
7. Users can filter Todos by projects

### 4.4 Work Period Management

1. Users can create work periods
2. Users can view work periods
3. Users can edit work period details
4. Users can delete work periods
5. Users can associate Todo activities with work periods

### 4.5 Bulk Operations

1. Users can assign tags to multiple Todos at once
2. Users can remove tags from multiple Todos at once
3. Users can update due dates for multiple Todos at once

## 5. Technology Stack

- TypeScript
- Hono (Web framework)
- Valibot (Validation)
- Prisma (ORM)
- SQLite (Database)
- Bun (Runtime)
