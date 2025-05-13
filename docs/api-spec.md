# Toodo API Specification

This document outlines the API endpoints available in the Toodo application.

## Base URL

```
/api/v1
```

## Authentication

Authentication is not required for this version of the API.

## Error Responses

All endpoints can return the following error responses:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": {} // Optional additional error details
  }
}
```

Common error codes:
- `VALIDATION_ERROR` - Invalid input data (HTTP 400)
- `NOT_FOUND` - Requested resource not found (HTTP 404)
- `INTERNAL_ERROR` - Unexpected server error (HTTP 500)

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
{
  "todos": [
    {
      "id": "string",
      "title": "string",
      "description": "string | null",
      "status": "pending | in_progress | completed | cancelled",
      "workState": "idle | active | paused | completed",
      "totalWorkTime": "number",
      "lastStateChangeAt": "ISO date string",
      "createdAt": "ISO date string",
      "updatedAt": "ISO date string",
      "priority": "low | medium | high | critical",
      "projectId": "string | null",
      "tags": [
        {
          "id": "string",
          "name": "string",
          "color": "string | null"
        }
      ],
      "dependencies": ["string"], // IDs of todos this todo depends on
      "dependents": ["string"]    // IDs of todos that depend on this todo
    }
  ]
}
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
  "status": "pending | in_progress | completed | cancelled",
  "workState": "idle | active | paused | completed",
  "totalWorkTime": "number",
  "lastStateChangeAt": "ISO date string",
  "createdAt": "ISO date string",
  "updatedAt": "ISO date string",
  "priority": "low | medium | high | critical",
  "projectId": "string | null",
  "tags": [
    {
      "id": "string",
      "name": "string",
      "color": "string | null"
    }
  ],
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
  "status": "pending | in_progress | completed | cancelled", // Optional, default: "pending"
  "priority": "low | medium | high | critical", // Optional, default: "medium"
  "projectId": "string | null", // Optional
  "tagIds": ["string"] // Optional
}
```

Response: Todo object (201 Created)

#### Update Todo

```
PUT /todos/:id
```

Request body:
```json
{
  "title": "string", // Optional
  "description": "string | null", // Optional
  "status": "pending | in_progress | completed | cancelled", // Optional
  "priority": "low | medium | high | critical" // Optional
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

Add a dependency relationship where the todo with ID `:id` depends on the todo with ID `:dependencyId`.

Response: 204 No Content

Possible errors:
- `DEPENDENCY_CYCLE` - Adding this dependency would create a cycle (HTTP 400)
- `TODO_NOT_FOUND` - Either the todo or dependency todo not found (HTTP 404)

#### Remove Todo Dependency

```
DELETE /todos/:id/dependencies/:dependencyId
```

Remove a dependency relationship between todos.

Response: 204 No Content

#### Get Todo Dependencies

```
GET /todos/:id/dependencies
```

Get all todos that the specified todo depends on.

Response:
```json
{
  "dependencies": [
    {
      "id": "string",
      "title": "string",
      "status": "pending | in_progress | completed | cancelled",
      "priority": "low | medium | high | critical"
    }
  ]
}
```

#### Get Todo Dependents

```
GET /todos/:id/dependents
```

Get all todos that depend on the specified todo.

Response:
```json
{
  "dependents": [
    {
      "id": "string",
      "title": "string",
      "status": "pending | in_progress | completed | cancelled",
      "priority": "low | medium | high | critical"
    }
  ]
}
```

### Todo Activities

#### Get Todo Activity History

```
GET /todos/:id/activities
```

Response:
```json
{
  "activities": [
    {
      "id": "string",
      "todoId": "string",
      "type": "started | paused | resumed | completed",
      "workTime": "number",
      "previousState": "string",
      "note": "string | null",
      "createdAt": "ISO date string"
    }
  ]
}
```

#### Record Todo Activity

```
POST /todos/:id/activities
```

Request body:
```json
{
  "type": "started | paused | resumed | completed",
  "note": "string | null"
}
```

Response: Created activity object (201 Created)

### Tags

#### Get All Tags

```
GET /tags
```

Response:
```json
{
  "tags": [
    {
      "id": "string",
      "name": "string",
      "color": "string | null"
    }
  ]
}
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
  "color": "string | null"
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
{
  "projects": [
    {
      "id": "string",
      "name": "string",
      "description": "string | null",
      "color": "string | null",
      "status": "active | inactive",
      "createdAt": "ISO date string",
      "updatedAt": "ISO date string"
    }
  ]
}
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
  "status": "active | inactive",
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
  "status": "active | inactive"
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
  "status": "active | inactive"
}
```

Response: Updated project object

#### Delete Project

```
DELETE /projects/:id
```

Response: 204 No Content
