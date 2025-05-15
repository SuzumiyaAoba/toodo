# API Documentation

## Overview

This document provides detailed information about the REST API for the Toodo application. It covers all endpoints, request/response formats, and error handling.

## Base URL

```
/api
```

## Authentication

The current implementation does not require authentication. Authentication features may be added in the future.

## Data Format

All API requests and responses are in JSON format.

Request header:

```
Content-Type: application/json
```

## Endpoints

### Todo API

#### List Todo Items

```
GET /todos
```

##### Query Parameters

| Parameter | Type   | Required | Description                                         |
| --------- | ------ | -------- | --------------------------------------------------- |
| status    | string | No       | Filter by status ("completed" or "incomplete")      |
| category  | string | No       | Filter by category ID                               |
| sort      | string | No       | Sort criteria ("createdAt" or "dueDate")            |
| order     | string | No       | Sort direction ("asc" or "desc", default is "desc") |

##### Response

Success status code: `200 OK`

Example response body:

```json
{
  "todos": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "title": "Go shopping",
      "description": "Buy milk and eggs",
      "status": "incomplete",
      "dueDate": "2023-12-31T15:00:00.000Z",
      "categoryId": "123e4567-e89b-12d3-a456-426614174001",
      "category": {
        "id": "123e4567-e89b-12d3-a456-426614174001",
        "name": "Shopping",
        "color": "#ff0000"
      },
      "createdAt": "2023-12-01T10:30:00.000Z",
      "updatedAt": "2023-12-01T10:30:00.000Z"
    },
    {
      "id": "123e4567-e89b-12d3-a456-426614174002",
      "title": "Write report",
      "description": "Create progress report for the project",
      "status": "incomplete",
      "dueDate": "2023-12-15T17:00:00.000Z",
      "categoryId": "123e4567-e89b-12d3-a456-426614174003",
      "category": {
        "id": "123e4567-e89b-12d3-a456-426614174003",
        "name": "Work",
        "color": "#0000ff"
      },
      "createdAt": "2023-12-01T11:30:00.000Z",
      "updatedAt": "2023-12-01T11:30:00.000Z"
    }
  ]
}
```

#### Get a Specific Todo Item

```
GET /todos/:id
```

##### Path Parameters

| Parameter | Type   | Required | Description         |
| --------- | ------ | -------- | ------------------- |
| id        | string | Yes      | ID of the Todo item |

##### Response

Success status code: `200 OK`

Example response body:

```json
{
  "todo": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "title": "Go shopping",
    "description": "Buy milk and eggs",
    "status": "incomplete",
    "dueDate": "2023-12-31T15:00:00.000Z",
    "categoryId": "123e4567-e89b-12d3-a456-426614174001",
    "category": {
      "id": "123e4567-e89b-12d3-a456-426614174001",
      "name": "Shopping",
      "color": "#ff0000"
    },
    "createdAt": "2023-12-01T10:30:00.000Z",
    "updatedAt": "2023-12-01T10:30:00.000Z"
  }
}
```

Error status code: `404 Not Found`

Example error response:

```json
{
  "error": "Todo not found"
}
```

#### Create a New Todo Item

```
POST /todos
```

##### Request Body

| Field       | Type   | Required | Description                |
| ----------- | ------ | -------- | -------------------------- |
| title       | string | Yes      | Todo item title            |
| description | string | No       | Todo item description      |
| dueDate     | string | No       | Due date (ISO 8601 format) |
| categoryId  | string | No       | Category ID                |

Example request body:

```json
{
  "title": "Buy milk",
  "description": "Purchase low-fat milk",
  "dueDate": "2023-12-31T15:00:00.000Z",
  "categoryId": "123e4567-e89b-12d3-a456-426614174001"
}
```

##### Response

Success status code: `201 Created`

Example response body:

```json
{
  "todo": {
    "id": "123e4567-e89b-12d3-a456-426614174005",
    "title": "Buy milk",
    "description": "Purchase low-fat milk",
    "status": "incomplete",
    "dueDate": "2023-12-31T15:00:00.000Z",
    "categoryId": "123e4567-e89b-12d3-a456-426614174001",
    "createdAt": "2023-12-05T14:30:00.000Z",
    "updatedAt": "2023-12-05T14:30:00.000Z"
  }
}
```

Error status code: `400 Bad Request`

Example error response:

```json
{
  "error": "Validation error",
  "details": {
    "title": "Title is required"
  }
}
```

#### Update a Todo Item

```
PUT /todos/:id
```

##### Path Parameters

| Parameter | Type   | Required | Description         |
| --------- | ------ | -------- | ------------------- |
| id        | string | Yes      | ID of the Todo item |

##### Request Body

| Field       | Type   | Required | Description                          |
| ----------- | ------ | -------- | ------------------------------------ |
| title       | string | No       | Todo item title                      |
| description | string | No       | Todo item description                |
| status      | string | No       | Status ("completed" or "incomplete") |
| dueDate     | string | No       | Due date (ISO 8601 format)           |
| categoryId  | string | No       | Category ID                          |

Example request body:

```json
{
  "status": "completed",
  "description": "Purchased 1 liter of low-fat milk"
}
```

##### Response

Success status code: `200 OK`

Example response body:

```json
{
  "todo": {
    "id": "123e4567-e89b-12d3-a456-426614174005",
    "title": "Buy milk",
    "description": "Purchased 1 liter of low-fat milk",
    "status": "completed",
    "dueDate": "2023-12-31T15:00:00.000Z",
    "categoryId": "123e4567-e89b-12d3-a456-426614174001",
    "createdAt": "2023-12-05T14:30:00.000Z",
    "updatedAt": "2023-12-05T15:45:00.000Z"
  }
}
```

Error status codes:

- `400 Bad Request` - Invalid input data
- `404 Not Found` - Todo item with the specified ID does not exist

#### Delete a Todo Item

```
DELETE /todos/:id
```

##### Path Parameters

| Parameter | Type   | Required | Description         |
| --------- | ------ | -------- | ------------------- |
| id        | string | Yes      | ID of the Todo item |

##### Response

Success status code: `204 No Content`

Error status code: `404 Not Found`

Example error response:

```json
{
  "error": "Todo not found"
}
```

### Category API

#### List Categories

```
GET /categories
```

##### Response

Success status code: `200 OK`

Example response body:

```json
{
  "categories": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174001",
      "name": "Shopping",
      "color": "#ff0000",
      "createdAt": "2023-11-15T09:30:00.000Z",
      "updatedAt": "2023-11-15T09:30:00.000Z"
    },
    {
      "id": "123e4567-e89b-12d3-a456-426614174003",
      "name": "Work",
      "color": "#0000ff",
      "createdAt": "2023-11-15T09:35:00.000Z",
      "updatedAt": "2023-11-15T09:35:00.000Z"
    }
  ]
}
```

#### Get a Specific Category

```
GET /categories/:id
```

##### Path Parameters

| Parameter | Type   | Required | Description        |
| --------- | ------ | -------- | ------------------ |
| id        | string | Yes      | ID of the category |

##### Response

Success status code: `200 OK`

Example response body:

```json
{
  "category": {
    "id": "123e4567-e89b-12d3-a456-426614174001",
    "name": "Shopping",
    "color": "#ff0000",
    "createdAt": "2023-11-15T09:30:00.000Z",
    "updatedAt": "2023-11-15T09:30:00.000Z"
  }
}
```

Error status code: `404 Not Found`

Example error response:

```json
{
  "error": "Category not found"
}
```

#### Create a New Category

```
POST /categories
```

##### Request Body

| Field | Type   | Required | Description                     |
| ----- | ------ | -------- | ------------------------------- |
| name  | string | Yes      | Category name                   |
| color | string | No       | Category color (hex color code) |

Example request body:

```json
{
  "name": "Hobbies",
  "color": "#00ff00"
}
```

##### Response

Success status code: `201 Created`

Example response body:

```json
{
  "category": {
    "id": "123e4567-e89b-12d3-a456-426614174007",
    "name": "Hobbies",
    "color": "#00ff00",
    "createdAt": "2023-12-05T16:30:00.000Z",
    "updatedAt": "2023-12-05T16:30:00.000Z"
  }
}
```

Error status code: `400 Bad Request`

Example error response:

```json
{
  "error": "Validation error",
  "details": {
    "name": "Name is required"
  }
}
```

#### Update a Category

```
PUT /categories/:id
```

##### Path Parameters

| Parameter | Type   | Required | Description        |
| --------- | ------ | -------- | ------------------ |
| id        | string | Yes      | ID of the category |

##### Request Body

| Field | Type   | Required | Description                     |
| ----- | ------ | -------- | ------------------------------- |
| name  | string | No       | Category name                   |
| color | string | No       | Category color (hex color code) |

Example request body:

```json
{
  "name": "Personal hobbies",
  "color": "#00aa00"
}
```

##### Response

Success status code: `200 OK`

Example response body:

```json
{
  "category": {
    "id": "123e4567-e89b-12d3-a456-426614174007",
    "name": "Personal hobbies",
    "color": "#00aa00",
    "createdAt": "2023-12-05T16:30:00.000Z",
    "updatedAt": "2023-12-05T17:15:00.000Z"
  }
}
```

Error status codes:

- `400 Bad Request` - Invalid input data
- `404 Not Found` - Category with the specified ID does not exist

#### Delete a Category

```
DELETE /categories/:id
```

##### Path Parameters

| Parameter | Type   | Required | Description        |
| --------- | ------ | -------- | ------------------ |
| id        | string | Yes      | ID of the category |

##### Response

Success status code: `204 No Content`

Error status code: `404 Not Found`

Example error response:

```json
{
  "error": "Category not found"
}
```

## Error Responses

The API returns error information in JSON format along with appropriate HTTP status codes when errors occur.

### Error Format

```json
{
  "error": "Error message",
  "details": {
    "field_name": "Detailed error message"
  }
}
```

### Common HTTP Status Codes

| Status Code      | Description                                  |
| ---------------- | -------------------------------------------- |
| 200 OK           | Request successful                           |
| 201 Created      | Resource successfully created                |
| 204 No Content   | Request successful, no content to return     |
| 400 Bad Request  | Invalid request syntax or invalid parameters |
| 404 Not Found    | Requested resource not found                 |
| 500 Server Error | Internal server error                        |

## Rate Limiting

The current implementation does not include rate limiting. Rate limiting may be added in the future.

## Versioning

API version management is done via URL paths. The current version is implicitly v1.

In the future, explicit versioning may be introduced in the following format:

```
/api/v1/todos
/api/v2/todos
```

## Change History

| Date       | Version | Changes         |
| ---------- | ------- | --------------- |
| 2023-12-01 | 1.0     | Initial version |
