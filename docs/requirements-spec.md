# TODO Management System - Requirements and Specifications

## 1. Introduction

### 1.1 Purpose

This document defines the requirements and specifications for a TODO management system using the Hono framework as a REST API.

## 2. Functional Requirements

### 2.1 Core Features

#### Task Management
- ✅ Create new TODOs
- 📋 View a list of TODOs
- 🔍 View details of individual TODOs
- ✏️ Edit existing TODOs
- 🗑️ Delete unwanted TODOs
- 🔄 Change the status of TODOs (pending/completed)

#### Progress Tracking
- 📝 Track TODO activity history (started, paused, completed)
- 📜 View activity history of TODOs
- ⏱️ Track work state of TODOs (idle, active, paused, completed)
- ⏲️ Calculate and track work time for TODOs

#### Organization Features
- ⭐ Set and update priority levels for TODOs
- 📁 Organize TODOs with Projects
- 🔍 View and manage TODOs by Project
- 🏷️ Categorize TODOs with tags

### 2.2 Constraints

#### Todo Constraints
- 📝 **Title**: Required, maximum 100 characters
- 📄 **Description**: Optional, maximum 1000 characters
- 🔄 **Status**: Must be either "pending" or "completed"
- ⭐ **Priority**: Must be one of "low", "medium", "high" (default: "medium")

#### Work State & Activity Constraints
- 📊 **Work State**: Must be one of "idle", "active", "paused", "completed"
- 🔔 **Activity Type**: Must be one of "started", "paused", "completed", "discarded"
- ⏱️ **Work Time**: Measured in seconds

#### Project & Tag Constraints
- 🏷️ **Tag Name**: Required, maximum 50 characters
- 🎨 **Color**: Optional, hex color format (e.g., "#FF5733")
- 📁 **Project Name**: Required, maximum 100 characters
- 📋 **Project Status**: Must be one of "active", "archived"

## 3. System Specifications

### 3.1 Data Model

#### 3.1.1 Todo Entity

| Field             | Type      | Description                      | Constraints                                        |
| ----------------- | --------- | -------------------------------- | -------------------------------------------------- |
| id                | UUID      | Unique identifier for the TODO   | Auto-generated, unique                             |
| title             | String    | Title of the TODO                | Required, max 100 characters                       |
| description       | String    | Detailed description of the TODO | Optional, max 1000 characters                      |
| status            | Enum      | Status of the TODO               | Default: "pending"                                 |
| workState         | Enum      | Current work state of the TODO   | One of: "idle", "active", "paused", "completed"    |
| totalWorkTime     | Integer   | Total accumulated work time      | In seconds, default: 0                             |
| lastStateChangeAt | Timestamp | Last time work state changed     | Auto-updated on state changes                      |
| createdAt         | Timestamp | Creation time of the TODO        | Auto-generated                                     |
| updatedAt         | Timestamp | Last update time of the TODO     | Auto-updated on changes                            |
| priority          | Enum      | Priority level of the TODO       | One of: "low", "medium", "high", default: "medium" |
| projectId         | UUID      | Reference to the Project         | Foreign key to Project.id, Optional                |

#### 3.1.2 TodoActivity Entity

| Field         | Type      | Description                        | Constraints                                           |
| ------------- | --------- | ---------------------------------- | ----------------------------------------------------- |
| id            | UUID      | Unique identifier for the activity | Auto-generated, unique                                |
| todoId        | UUID      | Reference to the TODO              | Foreign key to Todo.id                                |
| type          | Enum      | Type of activity                   | One of: "started", "paused", "completed", "discarded" |
| workTime      | Integer   | Time spent on this activity cycle  | In seconds, optional                                  |
| previousState | Enum      | Work state before this activity    | One of: "idle", "active", "paused", "completed"       |
| createdAt     | Timestamp | When the activity occurred         | Auto-generated                                        |
| note          | String    | Optional note about the activity   | Optional, max 500 characters                          |

#### 3.1.3 Tag Entity

| Field     | Type      | Description                   | Constraints                 |
| --------- | --------- | ----------------------------- | --------------------------- |
| id        | UUID      | Unique identifier for the tag | Auto-generated, unique      |
| name      | String    | Name of the tag               | Required, max 50 characters, unique |
| color     | String    | Color code for the tag        | Optional, hex color code    |
| createdAt | Timestamp | Creation time of the tag      | Auto-generated              |
| updatedAt | Timestamp | Last update time of the tag   | Auto-updated on changes     |

#### 3.1.4 TodoTag Entity (Join Table)

| Field      | Type      | Description               | Constraints            |
| ---------- | --------- | ------------------------- | ---------------------- |
| todoId     | UUID      | Reference to the TODO     | Foreign key to Todo.id |
| tagId      | UUID      | Reference to the Tag      | Foreign key to Tag.id  |
| assignedAt | Timestamp | When the tag was assigned | Auto-generated         |

#### 3.1.5 Project Entity

| Field       | Type      | Description                       | Constraints                          |
| ----------- | --------- | --------------------------------- | ------------------------------------ |
| id          | UUID      | Unique identifier for the project | Auto-generated, unique               |
| name        | String    | Name of the project               | Required, max 100 characters, unique |
| description | String    | Description of the project        | Optional, max 1000 characters        |
| color       | String    | Color code for the project        | Optional, hex color code             |
| status      | Enum      | Status of the project             | One of: "active", "archived"         |
| createdAt   | Timestamp | Creation time of the project      | Auto-generated                       |
| updatedAt   | Timestamp | Last update time of the project   | Auto-updated on changes              |

#### Entity Relationships Diagram

```
┌────────────┐     ┌────────────────┐     ┌────────────┐
│            │     │                │     │            │
│   Todo     │1    │   TodoActivity │*    │   Tag      │
│            ├─────┤                │     │            │
└─────┬──────┘     └────────────────┘     └──────┬─────┘
      │                                           │
      │ *                                         │ *
      │                                           │
┌─────▼──────┐                            ┌──────▼─────┐
│            │                            │            │
│  Project   │                            │  TodoTag   │
│            │                            │            │
└────────────┘                            └────────────┘
```

Legend:
- 1: One relationship
- *: Many relationship

### 3.2 API Endpoints

#### Todo Management Endpoints

| Method | Path                      | Description                    | Response Codes              |
| ------ | ------------------------- | ------------------------------ | --------------------------- |
| POST   | /todos                    | Create a new TODO              | 201: Created                |
| GET    | /todos                    | Get a list of TODOs            | 200: OK                     |
| GET    | /todos/{id}               | Get details of a specific TODO | 200: OK, 404: Not Found     |
| PUT    | /todos/{id}               | Update a specific TODO         | 200: OK, 404: Not Found     |
| DELETE | /todos/{id}               | Delete a specific TODO         | 204: No Content, 404: Not Found |

#### Activity Tracking Endpoints

| Method | Path                                | Description                             | Response Codes                                  |
| ------ | ----------------------------------- | --------------------------------------- | ----------------------------------------------- |
| POST   | /todos/{id}/activities              | Record a new activity for a TODO        | 201: Created, 404: Not Found                    |
| GET    | /todos/{id}/activities              | Get activity history of a specific TODO | 200: OK, 404: Not Found                         |
| DELETE | /todos/{id}/activities/{activityId} | Delete a specific activity for a TODO   | 204: No Content, 403: Forbidden, 404: Not Found |
| GET    | /todos/{id}/work-time               | Get the total work time of a TODO       | 200: OK, 404: Not Found                         |

#### Tag Management Endpoints

| Method | Path                     | Description                   | Response Codes              |
| ------ | ------------------------ | ----------------------------- | --------------------------- |
| POST   | /tags                    | Create a new tag              | 201: Created                |
| GET    | /tags                    | Get a list of tags            | 200: OK                     |
| GET    | /tags/{id}               | Get details of a specific tag | 200: OK, 404: Not Found     |
| PUT    | /tags/{id}               | Update a specific tag         | 200: OK, 404: Not Found     |
| DELETE | /tags/{id}               | Delete a specific tag         | 204: No Content, 404: Not Found |
| GET    | /tags/stats              | Get tag usage statistics      | 200: OK                     |

#### Todo-Tag Association Endpoints

| Method | Path                         | Description                    | Response Codes              |
| ------ | ---------------------------- | ------------------------------ | --------------------------- |
| POST   | /todos/{id}/tags             | Assign a tag to a TODO         | 201: Created, 404: Not Found |
| GET    | /todos/{id}/tags             | Get tags of a specific TODO    | 200: OK, 404: Not Found     |
| DELETE | /todos/{id}/tags/{tagId}     | Remove a tag from a TODO       | 204: No Content, 404: Not Found |
| GET    | /todos/by-tag/{tagId}        | Get TODOs by tag               | 200: OK, 404: Not Found     |
| GET    | /todos/by-tags               | Get TODOs by multiple tags     | 200: OK                     |
| POST   | /tags/{id}/bulk-assign       | Assign a tag to multiple TODOs | 200: OK, 404: Not Found     |
| DELETE | /tags/{id}/bulk-remove       | Remove a tag from multiple TODOs | 200: OK, 404: Not Found   |

#### Project Management Endpoints

| Method | Path                          | Description                     | Response Codes              |
| ------ | ----------------------------- | ------------------------------- | --------------------------- |
| POST   | /projects                     | Create a new project            | 201: Created                |
| GET    | /projects                     | Get a list of projects          | 200: OK                     |
| GET    | /projects/{id}                | Get details of a specific project | 200: OK, 404: Not Found   |
| PUT    | /projects/{id}                | Update a specific project       | 200: OK, 404: Not Found     |
| DELETE | /projects/{id}                | Delete a specific project       | 204: No Content, 404: Not Found |

#### Project-Todo Association Endpoints

| Method | Path                            | Description                      | Response Codes              |
| ------ | ------------------------------- | -------------------------------- | --------------------------- |
| GET    | /projects/{id}/todos            | Get TODOs in a specific project  | 200: OK, 404: Not Found     |
| POST   | /projects/{id}/todos            | Add a TODO to a project          | 201: Created, 404: Not Found |
| DELETE | /projects/{id}/todos/{todoId}   | Remove a TODO from a project     | 204: No Content, 404: Not Found |
