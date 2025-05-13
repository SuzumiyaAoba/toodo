# Toodo API Specification

This document outlines the API endpoints available in the Toodo application.

## Base URL

```
/api/v1
```

## Authentication

Authentication is not required for this version of the API.

## Error Responses

All endpoints can return the following error response:

```json
{
  "error": "Error message"
}
```

Common error codes:
- `VALIDATION_ERROR` - Invalid input data (HTTP 400)
- `NOT_FOUND` - Requested resource not found (HTTP 404)
- `INTERNAL_ERROR` - Unexpected server error (HTTP 500)
- `DEPENDENCY_CYCLE` - Dependency cycle detected (HTTP 400)
- `INVALID_STATE` - Invalid state transition (HTTP 400)

## Endpoints

### Todos

#### Get All Todos

```
GET /todos
```

Query parameters:
- `status` - Filter by todo status (optional)
- `priority` - Filter by priority level (optional)
- `tag` - Filter by tag ID (optional)
- `project` - Filter by project ID (optional)

Response:
```json
[
  {
    "id": "string",
    "title": "string",
    "description": "string | null",
    "status": "pending | in_progress | completed",
    "workState": "idle | active | paused | completed",
    "totalWorkTime": "number",
    "lastStateChangeAt": "ISO date string",
    "createdAt": "ISO date string",
    "updatedAt": "ISO date string",
    "priority": "low | medium | high",
    "projectId": "string | null",
    "dependencies": ["string"], // IDs of todos this todo depends on
    "dependents": ["string"]    // IDs of todos that depend on this todo
  }
]
```

#### Get Todo By ID

```
GET /todos/:id
```

Response:
```json
{
  "id": "string",
  "title": "string",
  "description": "string | null",
  "status": "pending | in_progress | completed",
  "workState": "idle | active | paused | completed",
  "totalWorkTime": "number",
  "lastStateChangeAt": "ISO date string",
  "createdAt": "ISO date string",
  "updatedAt": "ISO date string",
  "priority": "low | medium | high",
  "projectId": "string | null",
  "dependencies": ["string"], // IDs of todos this todo depends on
  "dependents": ["string"]    // IDs of todos that depend on this todo
}
```

#### Create Todo

```
POST /todos
```

Request body:
```json
{
  "title": "string",
  "description": "string | null",
  "status": "pending | completed", // Optional, default: "pending"
  "priority": "low | medium | high", // Optional, default: "medium"
  "projectId": "string | null" // Optional
}
```

Response: Created Todo object (201 Created)

#### Update Todo

```
PUT /todos/:id
```

Request body:
```json
{
  "title": "string", // Optional
  "description": "string | null", // Optional
  "status": "pending | completed", // Optional
  "priority": "low | medium | high" // Optional
}
```

Response: Updated Todo object

#### Delete Todo

```
DELETE /todos/:id
```

Response: 204 No Content

#### Add Todo Dependency

```
POST /todos/:id/dependencies/:dependencyId
```

Adds a dependency relationship where the todo with ID `:id` depends on the todo with ID `:dependencyId`.

Response: 204 No Content

Possible errors:
- `DEPENDENCY_CYCLE` - Adding this dependency would create a cycle (HTTP 400)
- `TODO_NOT_FOUND` - Todo or dependency todo not found (HTTP 404)
- `SELF_DEPENDENCY` - Self-referential dependencies are not allowed (HTTP 400)
- `DEPENDENCY_EXISTS` - Dependency already exists (HTTP 400)

#### Remove Todo Dependency

```
DELETE /todos/:id/dependencies/:dependencyId
```

Removes a dependency relationship between todos.

Response: 204 No Content

#### Get Todo Dependencies

```
GET /todos/:id/dependencies
```

Gets all todos that the specified todo depends on.

Response:
```json
{
  "dependencies": [
    {
      "id": "string",
      "title": "string",
      "status": "pending | in_progress | completed",
      "priority": "low | medium | high"
    }
  ]
}
```

#### Get Todo Dependents

```
GET /todos/:id/dependents
```

Gets all todos that depend on the specified todo.

Response:
```json
{
  "dependents": [
    {
      "id": "string",
      "title": "string",
      "status": "pending | in_progress | completed",
      "priority": "low | medium | high"
    }
  ]
}
```

#### Get Todo Dependency Tree

```
GET /todos/:id/dependency-tree
```

Gets the specified todo and its dependencies in a hierarchical tree structure.

Query parameters:
- `maxDepth` - Maximum depth of the tree to retrieve (optional, default: unlimited)

Response:
```json
{
  "id": "string",
  "title": "string",
  "status": "pending | in_progress | completed",
  "priority": "low | medium | high",
  "dependencies": [
    {
      "id": "string",
      "title": "string",
      "status": "pending | in_progress | completed",
      "priority": "low | medium | high",
      "dependencies": [
        // Recursive structure
      ]
    }
  ]
}
```

#### Update Todo Due Date

```
PUT /todos/:id/due-date
```

Request body:
```json
{
  "dueDate": "ISO date string | null"
}
```

Response: Updated Todo object

#### Get Overdue Todos

```
GET /todos/overdue
```

Gets all todos that are past their due date and not completed.

Response:
```json
[
  {
    "id": "string",
    "title": "string",
    "description": "string | null",
    "status": "pending | in_progress | completed",
    "workState": "idle | active | paused | completed",
    "priority": "low | medium | high",
    "dueDate": "ISO date string",
    // その他のTodoプロパティ
  }
]
```

#### Get Todos Due Soon

```
GET /todos/due-soon
```

Gets all todos that are due soon (within the specified number of days) and not completed.

Query parameters:
- `days` - Number of days to consider "soon" (optional, default: 2)

Response:
```json
[
  {
    "id": "string",
    "title": "string",
    "description": "string | null",
    "status": "pending | in_progress | completed",
    "workState": "idle | active | paused | completed",
    "priority": "low | medium | high",
    "dueDate": "ISO date string",
    // その他のTodoプロパティ
  }
]
```

#### Get Todos By Due Date Range

```
GET /todos/by-due-date
```

Gets all todos with due dates within the specified range.

Query parameters:
- `startDate` - Start date of the range (ISO date string, required)
- `endDate` - End date of the range (ISO date string, required)

Response:
```json
[
  {
    "id": "string",
    "title": "string",
    "description": "string | null",
    "status": "pending | in_progress | completed",
    "workState": "idle | active | paused | completed",
    "priority": "low | medium | high",
    "dueDate": "ISO date string",
    // その他のTodoプロパティ
  }
]
```

### Todo Activities

#### Get Todo Activity History

```
GET /todos/:id/activities
```

Response:
```json
[
  {
    "id": "string",
    "todoId": "string",
    "type": "started | paused | completed | discarded",
    "workTime": "number | null",
    "previousState": "idle | active | paused | completed | null",
    "note": "string | null",
    "createdAt": "ISO date string"
  }
]
```

#### Record Todo Activity

```
POST /todos/:id/activities
```

Request body:
```json
{
  "type": "started | paused | completed | discarded",
  "note": "string | null"
}
```

Response: Created activity object (201 Created)

Possible errors:
- `TODO_NOT_FOUND` - The specified todo was not found (HTTP 404)
- `INVALID_STATE_TRANSITION` - The transition from the current state to the specified activity type is invalid (HTTP 400)

### Tags

#### Get All Tags

```
GET /tags
```

Response:
```json
[
  {
    "id": "string",
    "name": "string",
    "color": "string | null",
    "createdAt": "ISO date string",
    "updatedAt": "ISO date string"
  }
]
```

#### Get Tag By ID

```
GET /tags/:id
```

Response:
```json
{
  "id": "string",
  "name": "string",
  "color": "string | null",
  "createdAt": "ISO date string",
  "updatedAt": "ISO date string"
}
```

#### Create Tag

```
POST /tags
```

Request body:
```json
{
  "name": "string",
  "color": "string | null"
}
```

Response: Created tag object (201 Created)

#### Update Tag

```
PUT /tags/:id
```

Request body:
```json
{
  "name": "string",
  "color": "string | null"
}
```

Response: Updated tag object

#### Delete Tag

```
DELETE /tags/:id
```

Response: 204 No Content

### Projects

#### Get All Projects

```
GET /projects
```

Response:
```json
[
  {
    "id": "string",
    "name": "string",
    "description": "string | null",
    "color": "string | null",
    "status": "active | archived",
    "createdAt": "ISO date string",
    "updatedAt": "ISO date string"
  }
]
```

#### Get Project By ID

```
GET /projects/:id
```

Response:
```json
{
  "id": "string",
  "name": "string",
  "description": "string | null",
  "color": "string | null",
  "status": "active | archived",
  "createdAt": "ISO date string",
  "updatedAt": "ISO date string"
}
```

#### Create Project

```
POST /projects
```

Request body:
```json
{
  "name": "string",
  "description": "string | null",
  "color": "string | null",
  "status": "active | archived"
}
```

Response: Created project object (201 Created)

#### Update Project

```
PUT /projects/:id
```

Request body:
```json
{
  "name": "string",
  "description": "string | null",
  "color": "string | null",
  "status": "active | archived"
}
```

Response: Updated project object

#### Delete Project

```
DELETE /projects/:id
```

Response: 204 No Content
