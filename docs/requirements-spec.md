# TODO Management System - Requirements and Specifications

## 1. Introduction

### 1.1 Purpose
This document defines the requirements and specifications for a TODO management system using the Hono framework as a REST API.

## 2. Functional Requirements

### 2.1 Core Features
- Create new TODOs
- View a list of TODOs
- View details of individual TODOs
- Edit existing TODOs
- Delete unwanted TODOs
- Change the status of TODOs (pending/completed)
- Track TODO activity history (started, paused, completed)
- View activity history of TODOs
- Track work state of TODOs (idle, active, paused, completed)
- Calculate and track work time for TODOs

### 2.2 Constraints
- TODO titles are required, with a maximum of 100 characters
- Description fields are optional, with a maximum of 1000 characters
- TODO status must be either "pending" or "completed"
- Activity type must be one of: "started", "paused", "completed", "discarded"
- TODO work state must be one of: "idle", "active", "paused", "completed"
- Work time is measured in seconds

## 3. System Specifications

### 3.1 Data Model

#### 3.1.1 Todo Entity
| Field       | Type        | Description                      | Constraints                   |
|-------------|-------------|----------------------------------|-------------------------------|
| id          | UUID        | Unique identifier for the TODO   | Auto-generated, unique        |
| title       | String      | Title of the TODO                | Required, max 100 characters  |
| description | String      | Detailed description of the TODO | Optional, max 1000 characters |
| status      | Enum        | Status of the TODO               | Default: "pending"            |
| workState   | Enum        | Current work state of the TODO   | One of: "idle", "active", "paused", "completed" |
| totalWorkTime | Integer   | Total accumulated work time      | In seconds, default: 0        |
| lastStateChangeAt | Timestamp | Last time work state changed | Auto-updated on state changes |
| createdAt   | Timestamp   | Creation time of the TODO        | Auto-generated                |
| updatedAt   | Timestamp   | Last update time of the TODO     | Auto-updated on changes       |

#### 3.1.2 TodoActivity Entity
| Field       | Type        | Description                      | Constraints                   |
|-------------|-------------|----------------------------------|-------------------------------|
| id          | UUID        | Unique identifier for the activity | Auto-generated, unique      |
| todoId      | UUID        | Reference to the TODO            | Foreign key to Todo.id        |
| type        | Enum        | Type of activity                 | One of: "started", "paused", "completed", "discarded" |
| workTime    | Integer     | Time spent on this activity cycle | In seconds, optional         |
| previousState | Enum      | Work state before this activity  | One of: "idle", "active", "paused", "completed" |
| createdAt   | Timestamp   | When the activity occurred       | Auto-generated                |
| note        | String      | Optional note about the activity | Optional, max 500 characters  |

### 3.2 API Endpoints
| Method  | Path                      | Description                           | Response Codes                    |
|---------|---------------------------|---------------------------------------|-----------------------------------|
| POST    | /todos                    | Create a new TODO                     | 201: Created                      |
| GET     | /todos                    | Get a list of TODOs                   | 200: OK                           |
| GET     | /todos/{id}               | Get details of a specific TODO        | 200: OK, 404: Not Found           |
| PUT     | /todos/{id}               | Update a specific TODO                | 200: OK, 404: Not Found           |
| DELETE  | /todos/{id}               | Delete a specific TODO                | 204: No Content, 404: Not Found   |
| POST    | /todos/{id}/activities    | Record a new activity for a TODO      | 201: Created, 404: Not Found      |
| GET     | /todos/{id}/activities    | Get activity history of a specific TODO | 200: OK, 404: Not Found         |
| GET     | /todos/{id}/work-time     | Get the total work time of a TODO     | 200: OK, 404: Not Found           |

## 4. Technical Stack
- **Backend**: TypeScript with Hono framework
- **ORM**: Prisma
- **Database**: SQLite
- **Runtime**: Bun
- **Testing**: Bun Test

## 5. Future Enhancement Ideas
- User authentication
- Priority setting for TODOs
- Due date functionality
- Tagging system
- Mobile app integration
- Activity statistics and reports
- Work time visualization and reporting