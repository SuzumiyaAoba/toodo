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
    "updatedAt": "2025-04-20T12:34:56.789Z"
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
      "updatedAt": "2025-04-20T12:34:56.789Z"
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
    "updatedAt": "2025-04-20T12:34:56.789Z"
  }
  ```
- **Error** (404 Not Found):
  ```json
  {
    "error": "Todo not found"
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
    "status": "completed"
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
    "updatedAt": "2025-04-20T13:45:12.345Z"
  }
  ```

### 2.5 Delete a TODO
- **URL**: `/todos/{id}`
- **Method**: `DELETE`
- **Response** (204 No Content)

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
    "error": "Todo not found"
  }
  ```
- **Error** (400 Bad Request):
  ```json
  {
    "error": "Invalid activity type. Must be one of: started, paused, completed, discarded"
  }
  ```
- **Error** (400 Bad Request):
  ```json
  {
    "error": "Invalid state transition. Cannot transition from 'completed' to 'active'"
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
    "error": "Todo not found"
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
    "error": "Todo not found"
  }
  ```

### 2.9 Delete a TODO Activity
- **URL**: `/todos/{id}/activities/{activityId}`
- **Method**: `DELETE`
- **Response** (204 No Content)
- **Error** (404 Not Found):
  ```json
  {
    "error": "Activity not found"
  }
  ```
- **Error** (403 Forbidden):
  ```json
  {
    "error": "Cannot delete this activity as it would affect the work time calculations"
  }
  ```

## 3. Error Handling
Error responses have the following format:
```json
{
  "error": "Error message"
}
```

Common status codes:
- 400 Bad Request: Invalid input
- 404 Not Found: Resource not found
- 500 Internal Server Error: Server-side error