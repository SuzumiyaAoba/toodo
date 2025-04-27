# TODO Management System API Specification

## 1. Introduction

This document outlines the API endpoints for the TODO management system built with Hono framework.

## 2. API Endpoints

### 2.1 Create a TODO

- **URL**: `/todos`
- **Method**: `POST`
- **Request Body**:
  ```json
  {
    "title": "Go shopping",
    "description": "Buy milk and bread",
    "status": "pending"
  }
  ```
- **Response** (201 Created):
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

### 2.2 Get TODO List

- **URL**: `/todos`
- **Method**: `GET`
- **Response** (200 OK):
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

### 2.3 Get TODO Details

- **URL**: `/todos/{id}`
- **Method**: `GET`
- **Response** (200 OK):
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
- **Error** (404 Not Found):
  ```json
  {
    "error": {
      "code": "NOT_FOUND",
      "message": "Todo not found"
    }
  }
  ```

### 2.4 Update a TODO

- **URL**: `/todos/{id}`
- **Method**: `PUT`
- **Request Body**:
  ```json
  {
    "title": "Shopping list",
    "description": "Buy milk, bread, and eggs",
    "status": "completed",
    "priority": "high"
  }
  ```
- **Response** (200 OK):
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
- **Error** (404 Not Found):
  ```json
  {
    "error": {
      "code": "NOT_FOUND",
      "message": "Todo not found"
    }
  }
  ```

### 2.5 Delete a TODO

- **URL**: `/todos/{id}`
- **Method**: `DELETE`
- **Response** (204 No Content)
- **Error** (404 Not Found):
  ```json
  {
    "error": {
      "code": "NOT_FOUND",
      "message": "Todo not found"
    }
  }
  ```

### 2.6 Record a TODO Activity

- **URL**: `/todos/{id}/activities`
- **Method**: `POST`
- **Request Body**:
  ```json
  {
    "type": "started",
    "note": "Starting work on this task"
  }
  ```
- **Response** (201 Created):
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
- **Error** (404 Not Found):
  ```json
  {
    "error": {
      "code": "NOT_FOUND",
      "message": "Todo not found"
    }
  }
  ```
- **Error** (400 Bad Request):
  ```json
  {
    "error": {
      "code": "VALIDATION_ERROR", 
      "message": "Invalid activity type. Must be one of: started, paused, completed, discarded"
    }
  }
  ```
- **Error** (400 Bad Request):
  ```json
  {
    "error": {
      "code": "INVALID_STATE",
      "message": "Invalid state transition. Cannot transition from 'completed' to 'active'"
    }
  }
  ```

### 2.7 Get TODO Activity History

- **URL**: `/todos/{id}/activities`
- **Method**: `GET`
- **Response** (200 OK):
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
- **Error** (404 Not Found):
  ```json
  {
    "error": {
      "code": "NOT_FOUND",
      "message": "Todo not found"
    }
  }
  ```

### 2.8 Get TODO Work Time

- **URL**: `/todos/{id}/work-time`
- **Method**: `GET`
- **Response** (200 OK):
  ```json
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "totalWorkTime": 6600,
    "workState": "completed",
    "formattedTime": "1 hour, 50 minutes"
  }
  ```
- **Error** (404 Not Found):
  ```json
  {
    "error": {
      "code": "NOT_FOUND",
      "message": "Todo not found"
    }
  }
  ```

### 2.9 Delete a TODO Activity

- **URL**: `/todos/{id}/activities/{activityId}`
- **Method**: `DELETE`
- **Response** (204 No Content)
- **Error** (404 Not Found):
  ```json
  {
    "error": {
      "code": "NOT_FOUND",
      "message": "Activity not found"
    }
  }
  ```
- **Error** (403 Forbidden):
  ```json
  {
    "error": {
      "code": "FORBIDDEN",
      "message": "Cannot delete this activity as it would affect the work time calculations"
    }
  }
  ```

### 2.10 Create a Tag

- **URL**: `/tags`
- **Method**: `POST`
- **Request Body**:
  ```json
  {
    "name": "Work",
    "color": "#FF5733"
  }
  ```
- **Response** (201 Created):
  ```json
  {
    "id": "a0b1c2d3-e4f5-6789-abcd-ef0123456789",
    "name": "Work",
    "color": "#FF5733",
    "createdAt": "2025-04-22T09:15:30.456Z",
    "updatedAt": "2025-04-22T09:15:30.456Z"
  }
  ```

### 2.11 Get Tag List

- **URL**: `/tags`
- **Method**: `GET`
- **Response** (200 OK):
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

### 2.12 Get Tag Details

- **URL**: `/tags/{id}`
- **Method**: `GET`
- **Response** (200 OK):
  ```json
  {
    "id": "a0b1c2d3-e4f5-6789-abcd-ef0123456789",
    "name": "Work",
    "color": "#FF5733",
    "createdAt": "2025-04-22T09:15:30.456Z",
    "updatedAt": "2025-04-22T09:15:30.456Z"
  }
  ```
- **Error** (404 Not Found):
  ```json
  {
    "error": {
      "code": "NOT_FOUND",
      "message": "Tag with ID 'a0b1c2d3-e4f5-6789-abcd-ef0123456789' not found"
    }
  }
  ```

### 2.13 Update a Tag

- **URL**: `/tags/{id}`
- **Method**: `PUT`
- **Request Body**:
  ```json
  {
    "name": "Work Project",
    "color": "#FF8C00"
  }
  ```
- **Response** (200 OK):
  ```json
  {
    "id": "a0b1c2d3-e4f5-6789-abcd-ef0123456789",
    "name": "Work Project",
    "color": "#FF8C00",
    "createdAt": "2025-04-22T09:15:30.456Z",
    "updatedAt": "2025-04-22T10:25:15.123Z"
  }
  ```
- **Error** (404 Not Found):
  ```json
  {
    "error": {
      "code": "NOT_FOUND",
      "message": "Tag with ID 'a0b1c2d3-e4f5-6789-abcd-ef0123456789' not found"
    }
  }
  ```

### 2.14 Delete a Tag

- **URL**: `/tags/{id}`
- **Method**: `DELETE`
- **Response** (204 No Content)
- **Error** (404 Not Found):
  ```json
  {
    "error": {
      "code": "NOT_FOUND",
      "message": "Tag with ID 'a0b1c2d3-e4f5-6789-abcd-ef0123456789' not found"
    }
  }
  ```

### 2.15 Assign a Tag to a TODO

- **URL**: `/todos/{id}/tags`
- **Method**: `POST`
- **Request Body**:
  ```json
  {
    "tagId": "a0b1c2d3-e4f5-6789-abcd-ef0123456789"
  }
  ```
- **Response** (201 Created):
  ```json
  {
    "message": "Tag assigned successfully"
  }
  ```
- **Error** (404 Not Found):
  ```json
  {
    "error": {
      "code": "NOT_FOUND",
      "message": "Todo with ID '550e8400-e29b-41d4-a716-446655440000' not found"
    }
  }
  ```
- **Error** (400 Bad Request):
  ```json
  {
    "error": {
      "code": "CONFLICT",
      "message": "Tag is already assigned to todo"
    }
  }
  ```

### 2.16 Get Tags for a TODO

- **URL**: `/todos/{id}/tags`
- **Method**: `GET`
- **Response** (200 OK):
  ```json
  [
    {
      "id": "a0b1c2d3-e4f5-6789-abcd-ef0123456789",
      "name": "Work",
      "color": "#FF5733",
      "createdAt": "2025-04-22T09:15:30.456Z",
      "updatedAt": "2025-04-22T09:15:30.456Z"
    }
  ]
  ```
- **Error** (404 Not Found):
  ```json
  {
    "error": {
      "code": "NOT_FOUND",
      "message": "Todo with ID '550e8400-e29b-41d4-a716-446655440000' not found"
    }
  }
  ```

### 2.17 Remove a Tag from a TODO

- **URL**: `/todos/{id}/tags/{tagId}`
- **Method**: `DELETE`
- **Response** (204 No Content)
- **Error** (404 Not Found):
  ```json
  {
    "error": {
      "code": "NOT_FOUND",
      "message": "Todo with ID '550e8400-e29b-41d4-a716-446655440000' not found"
    }
  }
  ```
- **Error** (400 Bad Request):
  ```json
  {
    "error": {
      "code": "VALIDATION_ERROR",
      "message": "Tag is not assigned to todo"
    }
  }
  ```

### 2.18 Get TODOs by Tag

- **URL**: `/tags/{id}/todos`
- **Method**: `GET`
- **Response** (200 OK):
  ```json
  [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "title": "Shopping list",
      "description": "Buy milk, bread, and eggs",
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
- **Error** (404 Not Found):
  ```json
  {
    "error": {
      "code": "NOT_FOUND",
      "message": "Tag with ID 'a0b1c2d3-e4f5-6789-abcd-ef0123456789' not found"
    }
  }
  ```

### 2.19 Get TODOs by Multiple Tags

- **URL**: `/todos/by-tags`
- **Method**: `GET`
- **Query Parameters**:
  - `tagIds`: Comma-separated list of tag IDs (e.g., `tagIds=id1,id2,id3`)
  - `mode`: Either `all` (default) to get TODOs with all specified tags or `any` to get TODOs with any of the specified tags
- **Response** (200 OK):
  ```json
  [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "title": "Shopping list",
      "description": "Buy milk, bread, and eggs",
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
- **Error** (404 Not Found):
  ```json
  {
    "error": {
      "code": "NOT_FOUND",
      "message": "Tag with ID 'a0b1c2d3-e4f5-6789-abcd-ef0123456789' not found"
    }
  }
  ```

### 2.20 Bulk Assign Tag to Multiple TODOs

- **URL**: `/tags/{id}/bulk-assign`
- **Method**: `POST`
- **Request Body**:
  ```json
  {
    "todoIds": [
      "550e8400-e29b-41d4-a716-446655440000",
      "661f9511-f3ac-52e5-b827-557766551111"
    ]
  }
  ```
- **Response** (200 OK):
  ```json
  {
    "successCount": 2,
    "failedCount": 0
  }
  ```
- **Error** (404 Not Found):
  ```json
  {
    "error": {
      "code": "NOT_FOUND",
      "message": "Tag with ID 'a0b1c2d3-e4f5-6789-abcd-ef0123456789' not found"
    }
  }
  ```

### 2.21 Bulk Remove Tag from Multiple TODOs

- **URL**: `/tags/{id}/bulk-remove`
- **Method**: `DELETE`
- **Request Body**:
  ```json
  {
    "todoIds": [
      "550e8400-e29b-41d4-a716-446655440000",
      "661f9511-f3ac-52e5-b827-557766551111"
    ]
  }
  ```
- **Response** (200 OK):
  ```json
  {
    "successCount": 2,
    "failedCount": 0
  }
  ```
- **Error** (404 Not Found):
  ```json
  {
    "error": {
      "code": "NOT_FOUND",
      "message": "Tag with ID 'a0b1c2d3-e4f5-6789-abcd-ef0123456789' not found"
    }
  }
  ```

### 2.22 Get Tag Usage Statistics

- **URL**: `/tags/stats`
- **Method**: `GET`
- **Response** (200 OK):
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

### 2.23 Create a Project

- **URL**: `/projects`
- **Method**: `POST`
- **Request Body**:
  ```json
  {
    "name": "Work Tasks",
    "description": "Tasks related to work projects"
  }
  ```
- **Response** (201 Created):
  ```json
  {
    "project": {
      "id": "c1d2e3f4-g5h6-7890-ijkl-mnopqrstuvwx",
      "name": "Work Tasks",
      "description": "Tasks related to work projects",
      "color": null,
      "status": "active",
      "createdAt": "2025-04-25T10:20:30.456Z",
      "updatedAt": "2025-04-25T10:20:30.456Z"
    }
  }
  ```
- **Error** (409 Conflict):
  ```json
  {
    "error": "Project name already exists"
  }
  ```

### 2.24 Get Project List

- **URL**: `/projects`
- **Method**: `GET`
- **Response** (200 OK):
  ```json
  {
    "projects": [
      {
        "id": "c1d2e3f4-g5h6-7890-ijkl-mnopqrstuvwx",
        "name": "Work Tasks",
        "description": "Tasks related to work projects",
        "color": null,
        "status": "active",
        "createdAt": "2025-04-25T10:20:30.456Z",
        "updatedAt": "2025-04-25T10:20:30.456Z"
      },
      {
        "id": "d2e3f4g5-h6i7-8901-jklm-nopqrstuvwxy",
        "name": "Personal Tasks",
        "description": "Personal to-do items",
        "color": "#3498db",
        "status": "active",
        "createdAt": "2025-04-25T11:22:33.789Z",
        "updatedAt": "2025-04-25T11:22:33.789Z"
      }
    ]
  }
  ```

### 2.25 Get Project Details

- **URL**: `/projects/{id}`
- **Method**: `GET`
- **Response** (200 OK):
  ```json
  {
    "project": {
      "id": "c1d2e3f4-g5h6-7890-ijkl-mnopqrstuvwx",
      "name": "Work Tasks",
      "description": "Tasks related to work projects",
      "color": null,
      "status": "active",
      "createdAt": "2025-04-25T10:20:30.456Z",
      "updatedAt": "2025-04-25T10:20:30.456Z"
    }
  }
  ```
- **Error** (404 Not Found):
  ```json
  {
    "error": "Project with id c1d2e3f4-g5h6-7890-ijkl-mnopqrstuvwx not found"
  }
  ```

### 2.26 Update a Project

- **URL**: `/projects/{id}`
- **Method**: `PUT`
- **Request Body**:
  ```json
  {
    "name": "Updated Work Tasks",
    "description": "Updated tasks related to work projects",
    "color": "#2ecc71",
    "status": "active"
  }
  ```
- **Response** (200 OK):
  ```json
  {
    "project": {
      "id": "c1d2e3f4-g5h6-7890-ijkl-mnopqrstuvwx",
      "name": "Updated Work Tasks",
      "description": "Updated tasks related to work projects",
      "color": "#2ecc71",
      "status": "active",
      "createdAt": "2025-04-25T10:20:30.456Z",
      "updatedAt": "2025-04-25T12:34:56.789Z"
    }
  }
  ```
- **Error** (404 Not Found):
  ```json
  {
    "error": "Project with id c1d2e3f4-g5h6-7890-ijkl-mnopqrstuvwx not found"
  }
  ```
- **Error** (409 Conflict):
  ```json
  {
    "error": "Project name already exists"
  }
  ```

### 2.27 Delete a Project

- **URL**: `/projects/{id}`
- **Method**: `DELETE`
- **Response** (204 No Content)
- **Error** (404 Not Found):
  ```json
  {
    "error": "Project with id c1d2e3f4-g5h6-7890-ijkl-mnopqrstuvwx not found"
  }
  ```

### 2.28 Get TODOs in a Project

- **URL**: `/projects/{id}/todos`
- **Method**: `GET`
- **Response** (200 OK):
  ```json
  {
    "project": {
      "id": "c1d2e3f4-g5h6-7890-ijkl-mnopqrstuvwx",
      "name": "Work Tasks",
      "description": "Tasks related to work projects",
      "color": null,
      "status": "active",
      "createdAt": "2025-04-25T10:20:30.456Z",
      "updatedAt": "2025-04-25T10:20:30.456Z"
    },
    "todos": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "title": "Complete project proposal",
        "description": "Write and submit the project proposal",
        "status": "pending",
        "workState": "idle",
        "totalWorkTime": 0,
        "lastStateChangeAt": "2025-04-25T12:34:56.789Z",
        "createdAt": "2025-04-25T12:34:56.789Z",
        "updatedAt": "2025-04-25T12:34:56.789Z",
        "priority": "high"
      }
    ]
  }
  ```
- **Error** (404 Not Found):
  ```json
  {
    "error": "Project with id c1d2e3f4-g5h6-7890-ijkl-mnopqrstuvwx not found"
  }
  ```

### 2.29 Add a TODO to a Project

- **URL**: `/projects/{id}/todos`
- **Method**: `POST`
- **Request Body**:
  ```json
  {
    "todoId": "550e8400-e29b-41d4-a716-446655440000"
  }
  ```
- **Response** (201 Created):
  ```json
  {
    "success": true
  }
  ```
- **Error** (404 Not Found):
  ```json
  {
    "error": "Project with id c1d2e3f4-g5h6-7890-ijkl-mnopqrstuvwx not found"
  }
  ```
- **Error** (404 Not Found):
  ```json
  {
    "error": "Todo with id 550e8400-e29b-41d4-a716-446655440000 not found"
  }
  ```

### 2.30 Remove a TODO from a Project

- **URL**: `/projects/{id}/todos/{todoId}`
- **Method**: `DELETE`
- **Response** (204 No Content)
- **Error** (404 Not Found):
  ```json
  {
    "error": "Project with id c1d2e3f4-g5h6-7890-ijkl-mnopqrstuvwx not found"
  }
  ```
- **Error** (404 Not Found):
  ```json
  {
    "error": "Todo with id 550e8400-e29b-41d4-a716-446655440000 not found"
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
