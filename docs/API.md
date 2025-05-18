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

### Task API

#### List Root Tasks

```
GET /api/tasks
```

Returns all top-level tasks (tasks with no parent).

##### Response

Success status code: `200 OK`

Example response body:

```json
[
  {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "parentId": null,
    "title": "Go shopping",
    "description": "Buy milk and eggs",
    "status": "incomplete",
    "order": 1,
    "createdAt": "2023-12-01T10:30:00.000Z",
    "updatedAt": "2023-12-01T10:30:00.000Z",
    "subtasks": []
  },
  {
    "id": "123e4567-e89b-12d3-a456-426614174002",
    "parentId": null,
    "title": "Write report",
    "description": "Create progress report for the project",
    "status": "incomplete",
    "order": 2,
    "createdAt": "2023-12-01T11:30:00.000Z",
    "updatedAt": "2023-12-01T11:30:00.000Z",
    "subtasks": []
  }
]
```

#### Get a Specific Task

```
GET /api/tasks/:id
```

##### Path Parameters

| Parameter | Type   | Required | Description    |
| --------- | ------ | -------- | -------------- |
| id        | string | Yes      | ID of the Task |

##### Response

Success status code: `200 OK`

Example response body:

```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "parentId": null,
  "title": "Go shopping",
  "description": "Buy milk and eggs",
  "status": "incomplete",
  "order": 1,
  "createdAt": "2023-12-01T10:30:00.000Z",
  "updatedAt": "2023-12-01T10:30:00.000Z",
  "subtasks": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174001",
      "parentId": "123e4567-e89b-12d3-a456-426614174000",
      "title": "Buy milk",
      "description": null,
      "status": "completed",
      "order": 1,
      "createdAt": "2023-12-01T10:35:00.000Z",
      "updatedAt": "2023-12-01T10:40:00.000Z",
      "subtasks": []
    }
  ]
}
```

Error status code: `404 Not Found`

Example error response:

```json
{
  "error": "Task not found"
}
```

#### Create a New Task

```
POST /api/tasks
```

##### Request Body

| Field       | Type   | Required | Description                           |
| ----------- | ------ | -------- | ------------------------------------- |
| title       | string | Yes      | Task title                            |
| description | string | No       | Task description                      |
| parentId    | string | No       | Parent task ID for hierarchical tasks |

Example request body:

```json
{
  "title": "Buy milk",
  "description": "Purchase low-fat milk",
  "parentId": "123e4567-e89b-12d3-a456-426614174000"
}
```

##### Response

Success status code: `201 Created`

Example response body:

```json
{
  "id": "123e4567-e89b-12d3-a456-426614174005",
  "parentId": "123e4567-e89b-12d3-a456-426614174000",
  "title": "Buy milk",
  "description": "Purchase low-fat milk",
  "status": "incomplete",
  "order": 2,
  "createdAt": "2023-12-05T14:30:00.000Z",
  "updatedAt": "2023-12-05T14:30:00.000Z",
  "subtasks": []
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

#### Update a Task

```
PATCH /api/tasks/:id
```

##### Path Parameters

| Parameter | Type   | Required | Description    |
| --------- | ------ | -------- | -------------- |
| id        | string | Yes      | ID of the Task |

##### Request Body

| Field       | Type   | Required | Description                          |
| ----------- | ------ | -------- | ------------------------------------ |
| title       | string | No       | Task title                           |
| description | string | No       | Task description                     |
| status      | string | No       | Status ("completed" or "incomplete") |

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
  "id": "123e4567-e89b-12d3-a456-426614174005",
  "parentId": "123e4567-e89b-12d3-a456-426614174000",
  "title": "Buy milk",
  "description": "Purchased 1 liter of low-fat milk",
  "status": "completed",
  "order": 2,
  "createdAt": "2023-12-05T14:30:00.000Z",
  "updatedAt": "2023-12-05T15:45:00.000Z",
  "subtasks": []
}
```

Error status codes:

- `400 Bad Request` - Invalid input data
- `404 Not Found` - Task with the specified ID does not exist

#### Move a Task

```
PATCH /api/tasks/:id/move
```

Moves a task to a new parent.

##### Path Parameters

| Parameter | Type   | Required | Description    |
| --------- | ------ | -------- | -------------- |
| id        | string | Yes      | ID of the Task |

##### Request Body

| Field    | Type         | Required | Description                          |
| -------- | ------------ | -------- | ------------------------------------ |
| parentId | string, null | Yes      | New parent ID or null for root-level |

Example request body:

```json
{
  "parentId": "123e4567-e89b-12d3-a456-426614174000"
}
```

##### Response

Success status code: `200 OK`

Example response body:

```json
{
  "id": "123e4567-e89b-12d3-a456-426614174005",
  "parentId": "123e4567-e89b-12d3-a456-426614174000",
  "title": "Buy milk",
  "description": "Purchase low-fat milk",
  "status": "incomplete",
  "order": 1,
  "createdAt": "2023-12-05T14:30:00.000Z",
  "updatedAt": "2023-12-05T15:45:00.000Z",
  "subtasks": []
}
```

#### Reorder Tasks

```
PUT /api/tasks/reorder
```

Reorders root-level tasks.

##### Request Body

| Field    | Type   | Required | Description                                      |
| -------- | ------ | -------- | ------------------------------------------------ |
| orderMap | object | Yes      | Object with task IDs as keys and order as values |

Example request body:

```json
{
  "orderMap": {
    "123e4567-e89b-12d3-a456-426614174000": 2,
    "123e4567-e89b-12d3-a456-426614174002": 1
  }
}
```

##### Response

Success status code: `200 OK`

```
PUT /api/tasks/:parentId/reorder
```

Reorders subtasks of a specific parent task.

##### Path Parameters

| Parameter | Type   | Required | Description           |
| --------- | ------ | -------- | --------------------- |
| parentId  | string | Yes      | ID of the parent task |

##### Request Body

| Field    | Type   | Required | Description                                      |
| -------- | ------ | -------- | ------------------------------------------------ |
| orderMap | object | Yes      | Object with task IDs as keys and order as values |

Example request body:

```json
{
  "orderMap": {
    "123e4567-e89b-12d3-a456-426614174001": 2,
    "123e4567-e89b-12d3-a456-426614174005": 1
  }
}
```

##### Response

Success status code: `200 OK`

#### Delete a Task

```
DELETE /api/tasks/:id
```

##### Path Parameters

| Parameter | Type   | Required | Description    |
| --------- | ------ | -------- | -------------- |
| id        | string | Yes      | ID of the Task |

##### Response

Success status code: `204 No Content`

Error status code: `404 Not Found`

Example error response:

```json
{
  "error": "Task not found"
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
/api/v1/tasks
/api/v2/tasks
```

## Change History

| Date       | Version | Changes                                |
| ---------- | ------- | -------------------------------------- |
| 2023-12-01 | 1.0     | Initial version                        |
| 2024-05-30 | 1.1     | Updated to reflect Task implementation |
