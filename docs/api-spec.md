# TODO Management System API Reference

## 1. Introduction

This document provides a comprehensive reference for the TODO management system API endpoints built with the Hono framework.

## 2. API Categories

The API is organized into the following functional categories:

- [Todo Management](#21-todo-management)
- [Activity Tracking](#22-activity-tracking)
- [Tag Management](#23-tag-management)
- [Todo-Tag Associations](#24-todo-tag-associations)
- [Project Management](#25-project-management)
- [Project-Todo Associations](#26-project-todo-associations)

## 2.1 Todo Management

| Method | Endpoint      | Description                    |
|--------|---------------|--------------------------------|
| POST   | `/todos`      | Create a new todo              |
| GET    | `/todos`      | Get a list of todos            |
| GET    | `/todos/{id}` | Get details of a specific todo |
| PUT    | `/todos/{id}` | Update a specific todo         |
| DELETE | `/todos/{id}` | Delete a specific todo         |

### 2.1.1 Create a Todo

**Request**:  
`POST /todos`

**Request Body**:
```json
{
  "title": "Go shopping",
  "description": "Buy milk and bread",
  "status": "pending",
  "priority": "medium"
}
```

**Response** (201 Created):
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "Go shopping",
  "description": "Buy milk and bread",
  "status": "pending",
  "workState": "idle",
  "totalWorkTime": 0,
  "lastStateChangeAt": "2025-04-20T12:34:56.789Z",
  "createdAt": "2025-04-20T12:34:56.789Z",
  "updatedAt": "2025-04-20T12:34:56.789Z",
  "priority": "medium"
}
```

### 2.1.2 Get Todo List

**Request**:  
`GET /todos`

**Response** (200 OK):
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Go shopping",
    "description": "Buy milk and bread",
    "status": "pending",
    "workState": "idle",
    "totalWorkTime": 0,
    "lastStateChangeAt": "2025-04-20T12:34:56.789Z",
    "createdAt": "2025-04-20T12:34:56.789Z",
    "updatedAt": "2025-04-20T12:34:56.789Z",
    "priority": "medium"
  }
]
```

### 2.1.3 Get Todo Details

**Request**:  
`GET /todos/{id}`

**Response** (200 OK):
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "Go shopping",
  "description": "Buy milk and bread",
  "status": "pending",
  "workState": "active",
  "totalWorkTime": 1200,
  "lastStateChangeAt": "2025-04-20T12:34:56.789Z",
  "createdAt": "2025-04-20T12:34:56.789Z",
  "updatedAt": "2025-04-20T12:34:56.789Z",
  "priority": "medium"
}
```

**Error** (404 Not Found):
```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Todo not found"
  }
}
```

### 2.1.4 Update a Todo

**Request**:  
`PUT /todos/{id}`

**Request Body**:
```json
{
  "title": "Shopping list",
  "description": "Buy milk, bread, and eggs",
  "status": "completed",
  "priority": "high"
}
```

**Response** (200 OK):
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "Shopping list",
  "description": "Buy milk, bread, and eggs",
  "status": "completed",
  "workState": "completed",
  "totalWorkTime": 3600,
  "lastStateChangeAt": "2025-04-20T13:45:12.345Z",
  "createdAt": "2025-04-20T12:34:56.789Z",
  "updatedAt": "2025-04-20T13:45:12.345Z",
  "priority": "high"
}
```

**Error** (404 Not Found):
```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Todo not found"
  }
}
```

### 2.1.5 Delete a Todo

**Request**:  
`DELETE /todos/{id}`

**Response** (204 No Content)

**Error** (404 Not Found):
```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Todo not found"
  }
}
```

## 2.2 Activity Tracking

| Method | Endpoint                              | Description                       |
|--------|---------------------------------------|-----------------------------------|
| POST   | `/todos/{id}/activities`              | Record a new activity for a todo  |
| GET    | `/todos/{id}/activities`              | Get activity history for a todo   |
| DELETE | `/todos/{id}/activities/{activityId}` | Delete a specific activity        |
| GET    | `/todos/{id}/work-time`               | Get total work time for a todo    |

### 2.2.1 Record a Todo Activity

**Request**:  
`POST /todos/{id}/activities`

**Request Body**:
```json
{
  "type": "started",
  "note": "Starting work on this task"
}
```

**Response** (201 Created):
```json
{
  "id": "7e9b91c5-77c5-4316-9ddc-6fdcaf2158eb",
  "todoId": "550e8400-e29b-41d4-a716-446655440000",
  "type": "started",
  "workTime": 0,
  "previousState": "idle",
  "note": "Starting work on this task",
  "createdAt": "2025-04-20T14:30:22.123Z"
}
```

**Error Cases**:
- 404 Not Found: Todo not found
- 400 Bad Request: Invalid activity type
- 400 Bad Request: Invalid state transition

### 2.2.2 Get Todo Activity History

**Request**:  
`GET /todos/{id}/activities`

**Response** (200 OK):
```json
[
  {
    "id": "7e9b91c5-77c5-4316-9ddc-6fdcaf2158eb",
    "todoId": "550e8400-e29b-41d4-a716-446655440000",
    "type": "started",
    "workTime": 0,
    "previousState": "idle",
    "note": "Starting work on this task",
    "createdAt": "2025-04-20T14:30:22.123Z"
  },
  {
    "id": "59f7a65e-867a-4235-b1dd-5bcd4bc6c82c",
    "todoId": "550e8400-e29b-41d4-a716-446655440000",
    "type": "paused",
    "workTime": 4500,
    "previousState": "active",
    "note": "Taking a break",
    "createdAt": "2025-04-20T15:45:30.456Z"
  },
  {
    "id": "a2b4c6d8-e0f2-4681-8ace-024681357913",
    "todoId": "550e8400-e29b-41d4-a716-446655440000",
    "type": "completed",
    "workTime": 2100,
    "previousState": "active",
    "note": "Finished all items on the list",
    "createdAt": "2025-04-20T16:20:15.789Z"
  }
]
```

### 2.2.3 Get Todo Work Time

**Request**:  
`GET /todos/{id}/work-time`

**Response** (200 OK):
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "totalWorkTime": 6600,
  "workState": "completed",
  "formattedTime": "1 hour, 50 minutes"
}
```

**Error** (404 Not Found):
```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Todo not found"
  }
}
```

### 2.2.4 Delete a Todo Activity

**Request**:  
`DELETE /todos/{id}/activities/{activityId}`

**Response** (204 No Content)

**Error Cases**:
- 404 Not Found: Activity not found
- 403 Forbidden: Cannot delete activity that affects work time calculations

## 2.3 Tag Management

| Method | Endpoint        | Description                   |
|--------|-----------------|-------------------------------|
| POST   | `/tags`         | Create a new tag              |
| GET    | `/tags`         | Get a list of all tags        |
| GET    | `/tags/{id}`    | Get details of a specific tag |
| PUT    | `/tags/{id}`    | Update a specific tag         |
| DELETE | `/tags/{id}`    | Delete a specific tag         |
| GET    | `/tags/stats`   | Get tag usage statistics      |

### 2.3.1 Create a Tag

**Request**:  
`POST /tags`

**Request Body**:
```json
{
  "name": "Work",
  "color": "#FF5733"
}
```

**Response** (201 Created):
```json
{
  "id": "a0b1c2d3-e4f5-6789-abcd-ef0123456789",
  "name": "Work",
  "color": "#FF5733",
  "createdAt": "2025-04-22T09:15:30.456Z",
  "updatedAt": "2025-04-22T09:15:30.456Z"
}
```

**Error** (409 Conflict):
```json
{
  "error": {
    "code": "CONFLICT",
    "message": "Tag name already exists"
  }
}
```

### 2.3.2 Get Tag List

**Request**:  
`GET /tags`

**Response** (200 OK):
```json
[
  {
    "id": "a0b1c2d3-e4f5-6789-abcd-ef0123456789",
    "name": "Work",
    "color": "#FF5733",
    "createdAt": "2025-04-22T09:15:30.456Z",
    "updatedAt": "2025-04-22T09:15:30.456Z"
  },
  {
    "id": "b1c2d3e4-f5a6-7890-bcde-f01234567890",
    "name": "Personal",
    "color": "#33FF57",
    "createdAt": "2025-04-22T09:16:45.789Z",
    "updatedAt": "2025-04-22T09:16:45.789Z"
  }
]
```

### 2.3.3 Get Tag Details

**Request**:  
`GET /tags/{id}`

**Response** (200 OK):
```json
{
  "id": "a0b1c2d3-e4f5-6789-abcd-ef0123456789",
  "name": "Work",
  "color": "#FF5733",
  "createdAt": "2025-04-22T09:15:30.456Z",
  "updatedAt": "2025-04-22T09:15:30.456Z"
}
```

**Error** (404 Not Found):
```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Tag with ID 'a0b1c2d3-e4f5-6789-abcd-ef0123456789' not found"
  }
}
```

### 2.3.4 Update a Tag

**Request**:  
`PUT /tags/{id}`

**Request Body**:
```json
{
  "name": "Work Project",
  "color": "#FF8C00"
}
```

**Response** (200 OK):
```json
{
  "id": "a0b1c2d3-e4f5-6789-abcd-ef0123456789",
  "name": "Work Project",
  "color": "#FF8C00",
  "createdAt": "2025-04-22T09:15:30.456Z",
  "updatedAt": "2025-04-22T10:25:15.123Z"
}
```

**Error** (404 Not Found):
```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Tag with ID 'a0b1c2d3-e4f5-6789-abcd-ef0123456789' not found"
  }
}
```

### 2.3.5 Delete a Tag

**Request**:  
`DELETE /tags/{id}`

**Response** (204 No Content)

**Error** (404 Not Found):
```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Tag with ID 'a0b1c2d3-e4f5-6789-abcd-ef0123456789' not found"
  }
}
```

### 2.3.6 Get Tag Usage Statistics

**Request**:  
`GET /tags/stats`

**Response** (200 OK):
```json
[
  {
    "id": "a0b1c2d3-e4f5-6789-abcd-ef0123456789",
    "name": "Work",
    "color": "#FF5733",
    "usageCount": 5,
    "pendingTodoCount": 3,
    "completedTodoCount": 2
  },
  {
    "id": "b1c2d3e4-f5a6-7890-bcde-f01234567890",
    "name": "Personal",
    "color": "#33FF57",
    "usageCount": 3,
    "pendingTodoCount": 2,
    "completedTodoCount": 1
  }
]
```

## 2.4 Todo-Tag Associations

| Method | Endpoint                     | Description                     |
|--------|------------------------------|---------------------------------|
| POST   | `/todos/{id}/tags`           | Assign a tag to a todo          |
| GET    | `/todos/{id}/tags`           | Get tags for a specific todo    |
| DELETE | `/todos/{id}/tags/{tagId}`   | Remove a tag from a todo        |
| GET    | `/tags/{id}/todos`           | Get todos with a specific tag   |
| GET    | `/todos/by-tags`             | Get todos by multiple tags      |
| POST   | `/tags/{id}/bulk-assign`     | Assign a tag to multiple todos  |
| DELETE | `/tags/{id}/bulk-remove`     | Remove a tag from multiple todos|

## 3. Project Management

| Method | Endpoint      | Description                    |
|--------|---------------|--------------------------------|
| POST   | `/projects`   | Create a new project           |
| GET    | `/projects`   | Get a list of projects         |
| GET    | `/projects/{id}` | Get details of a specific project |
| PUT    | `/projects/{id}` | Update a specific project     |
| DELETE | `/projects/{id}` | Delete a specific project     |

### 3.1 Create a Project

**Request**:  
`POST /projects`

**Request Body**:
```json
{
  "name": "New Project",
  "description": "Project description"
}
```

**Response** (201 Created):
```json
{
  "id": "c1d2e3f4-g5h6-7890-ijkl-mnopqrstuvwx",
  "name": "New Project",
  "description": "Project description",
  "color": null,
  "status": "active",
  "createdAt": "2025-04-25T10:20:30.456Z",
  "updatedAt": "2025-04-25T10:20:30.456Z"
}
```

### 3.2 Get Project List

**Request**:  
`GET /projects`

**Response** (200 OK):
```json
[
  {
    "id": "c1d2e3f4-g5h6-7890-ijkl-mnopqrstuvwx",
    "name": "New Project",
    "description": "Project description",
    "color": null,
    "status": "active",
    "createdAt": "2025-04-25T10:20:30.456Z",
    "updatedAt": "2025-04-25T10:20:30.456Z"
  }
]
```

### 3.3 Get Project Details

**Request**:  
`GET /projects/{id}`

**Response** (200 OK):
```json
{
  "id": "c1d2e3f4-g5h6-7890-ijkl-mnopqrstuvwx",
  "name": "New Project",
  "description": "Project description",
  "color": null,
  "status": "active",
  "createdAt": "2025-04-25T10:20:30.456Z",
  "updatedAt": "2025-04-25T10:20:30.456Z"
}
```

**Error** (404 Not Found):
```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Project with id 'c1d2e3f4-g5h6-7890-ijkl-mnopqrstuvwx' not found"
  }
}
```

### 3.4 Update a Project

**Request**:  
`PUT /projects/{id}`

**Request Body**:
```json
{
  "name": "Updated Project",
  "description": "Updated description",
  "color": "#FF5733",
  "status": "inactive"
}
```

**Response** (200 OK):
```json
{
  "id": "c1d2e3f4-g5h6-7890-ijkl-mnopqrstuvwx",
  "name": "Updated Project",
  "description": "Updated description",
  "color": "#FF5733",
  "status": "inactive",
  "createdAt": "2025-04-25T10:20:30.456Z",
  "updatedAt": "2025-04-25T10:20:30.456Z"
}
```

**Error** (404 Not Found):
```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Project with id 'c1d2e3f4-g5h6-7890-ijkl-mnopqrstuvwx' not found"
  }
}
```

### 3.5 Delete a Project

**Request**:  
`DELETE /projects/{id}`

**Response** (204 No Content)

**Error** (404 Not Found):
```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Project with id 'c1d2e3f4-g5h6-7890-ijkl-mnopqrstuvwx' not found"
  }
}
```

### 3.6 Get TODOs in a Project

**Request**:  
`GET /projects/{id}/todos`

**Response** (200 OK):
```json
{
  "project": {
    "id": "c1d2e3f4-g5h6-7890-ijkl-mnopqrstuvwx",
    "name": "New Project",
    "description": "Project description",
    "color": null,
    "status": "active",
    "createdAt": "2025-04-25T10:20:30.456Z",
    "updatedAt": "2025-04-25T10:20:30.456Z"
  },
  "todos": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "title": "Go shopping",
      "description": "Buy milk and bread",
      "status": "pending",
      "workState": "idle",
      "totalWorkTime": 0,
      "lastStateChangeAt": "2025-04-20T12:34:56.789Z",
      "createdAt": "2025-04-20T12:34:56.789Z",
      "updatedAt": "2025-04-20T12:34:56.789Z",
      "priority": "medium"
    }
  ]
}
```

**Error** (404 Not Found):
```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Project with id 'c1d2e3f4-g5h6-7890-ijkl-mnopqrstuvwx' not found"
  }
}
```

### 3.7 Add a TODO to a Project

**Request**:  
`POST /projects/{id}/todos`

**Request Body**:
```json
{
  "todoId": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Response** (201 Created):
```json
{
  "success": true
}
```

**Error** (404 Not Found):
```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Project with id 'c1d2e3f4-g5h6-7890-ijkl-mnopqrstuvwx' not found"
  }
}
```

**Error** (404 Not Found):
```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Todo with id '550e8400-e29b-41d4-a716-446655440000' not found"
  }
}
```

### 3.8 Remove a TODO from a Project

**Request**:  
`DELETE /projects/{id}/todos/{todoId}`

**Response** (204 No Content)

**Error** (404 Not Found):
```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Project with id 'c1d2e3f4-g5h6-7890-ijkl-mnopqrstuvwx' not found"
  }
}
```

**Error** (404 Not Found):
```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Todo with id '550e8400-e29b-41d4-a716-446655440000' not found"
  }
}
```

## 3. Error Handling

Error responses have the following format:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Detailed error message"
  }
}
```

Common error codes:

- `NOT_FOUND`: Resource not found
- `VALIDATION_ERROR`: Invalid input data
- `CONFLICT`: Resource conflict (e.g., duplicate entry)
- `FORBIDDEN`: Permission denied
- `INVALID_STATE`: Invalid state transition
- `INTERNAL_ERROR`: Server-side error

Common status codes:

- 400 Bad Request: Invalid input or request
- 403 Forbidden: Permission denied
- 404 Not Found: Resource not found
- 409 Conflict: Resource conflict
- 500 Internal Server Error: Server-side error
