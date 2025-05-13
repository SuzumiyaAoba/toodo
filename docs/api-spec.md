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
    "createdAt": "2025-04-20T12:34:56.789Z",
    "updatedAt": "2025-04-20T13:45:12.345Z"
  }
  ```

### 2.5 Delete a TODO
- **URL**: `/todos/{id}`
- **Method**: `DELETE`
- **Response** (204 No Content)

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