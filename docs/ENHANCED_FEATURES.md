# TODO API Application Enhanced Features Specification

## Overview

This document provides detailed specifications and design for feature enhancements added to the Toodo application. These features complement the existing core functionality and improve the user experience.

**This application implements only the API part of TODO management and is designed as a personal task management tool that operates locally.**

## Feature Enhancements

### 1. Task Priority Management

#### 1.1 Priority Level Introduction

- Users can set priority for Todo items (three levels: high, medium, low)
- Visual indicators based on priority (color coding and icons)
- Default priority is set to "medium"

#### 1.2 Priority-based Filtering

- Users can filter Todo lists based on priority
- Sorting options by priority level

#### 1.3 Data Model

```typescript
// Addition to existing Todo interface
interface Todo {
  // ... existing fields
  priority: "high" | "medium" | "low"; // Priority
}
```

### 2. Recurring Tasks

#### 2.1 Creating Recurring Tasks

- Users can create Todo items that repeat regularly
- Specification of recurrence pattern (daily, weekly, monthly, custom)
- Setting end conditions (until a specific date, number of occurrences, indefinite)

#### 2.2 Managing Recurring Tasks

- Completion of individual instances of recurring tasks and automatic generation of the next instance
- Editing recurrence patterns and applying to future instances

#### 2.3 Data Model

```typescript
interface RecurringPattern {
  type: "daily" | "weekly" | "monthly" | "custom";
  interval: number; // Interval (e.g., 2 for every 2 weeks)
  daysOfWeek?: number[]; // For weekly, days of week (0: Sunday to 6: Saturday)
  dayOfMonth?: number; // For monthly, day of month
  endDate?: Date; // End date (optional)
  occurrences?: number; // Number of recurrences (optional)
}

interface Todo {
  // ... existing fields
  isRecurring: boolean; // Whether it's a recurring task
  recurringPatternId?: string; // Recurring pattern ID (optional)
  instanceDate?: Date; // Instance date for this task (optional)
}

interface RecurringTodoPattern {
  id: string; // Unique identifier for the recurring pattern
  title: string; // Title template
  description?: string; // Description template
  categoryId?: string; // Category ID
  priority: "high" | "medium" | "low"; // Priority
  pattern: RecurringPattern; // Recurring pattern
  createdAt: Date; // Creation date/time
  updatedAt: Date; // Update date/time
}
```

### 3. Subtask Feature

#### 3.1 Creating Subtasks

- Multiple subtasks can be created under a main task
- Subtasks can have their own title, description, and status
- Main task progress display based on subtask completion status

#### 3.2 Managing Subtasks

- Adding, editing, and deleting subtasks
- Reordering subtasks
- Option to automatically complete the main task when all subtasks are completed

#### 3.3 Data Model

```typescript
interface Subtask {
  id: string; // Unique identifier for the subtask
  todoId: string; // Parent task ID
  title: string; // Title
  description?: string; // Description (optional)
  status: "completed" | "incomplete"; // Status
  order: number; // Display order
  createdAt: Date; // Creation date/time
  updatedAt: Date; // Update date/time
}
```

### 4. Tag System

#### 4.1 Creating and Managing Tags

- Multiple tags can be created and managed separately from categories
- Tag name and optional color setting
- Tag editing and deletion functionality

#### 4.2 Tagging Tasks

- Ability to add multiple tags to a single task
- Filtering and searching by tags

#### 4.3 Data Model

```typescript
interface Tag {
  id: string; // Unique identifier for the tag
  name: string; // Tag name
  color?: string; // Tag color (optional)
  createdAt: Date; // Creation date/time
  updatedAt: Date; // Update date/time
}

interface TodoTag {
  todoId: string; // Task ID
  tagId: string; // Tag ID
}
```

### 5. Reminder Feature

#### 5.1 Setting Reminders

- Ability to set reminders for specific tasks before their deadlines
- Setting reminder timing (5 minutes before, 1 hour before, 1 day before, etc.)
- Multiple reminders can be set for a single task

#### 5.2 Managing Reminders

- Adding, editing, and deleting reminder functionality
- Using local notifications as the notification method for reminders
- Enable/disable settings for reminders

#### 5.3 Data Model

```typescript
interface Reminder {
  id: string; // Unique identifier for the reminder
  todoId: string; // Task ID
  reminderTime: Date; // Reminder time
  notified: boolean; // Whether notification has been sent
  notificationType: "local"; // Notification type (local environment only)
  createdAt: Date; // Creation date/time
  updatedAt: Date; // Update date/time
}

interface NotificationSettings {
  enableLocalNotifications: boolean; // Enable local notifications
  updatedAt: Date; // Update date/time
}
```

### 6. Data Import and Export Feature

#### 6.1 Data Export

- Export task data as CSV/JSON
- Selective export (completed tasks, specific categories, etc.)
- Definition of export file structure

#### 6.2 Data Import

- Import tasks from CSV/JSON files
- Mapping settings during import
- Import conflict resolution methods

## API Extensions

### Priority Management API

#### `GET /api/todos?priority=high`

- Filtering by priority

#### `PUT /api/todos/:id`

- Add `priority` field to request body

### Recurring Task API

#### `GET /api/recurring-patterns`

- Retrieve list of recurring patterns

#### `POST /api/recurring-patterns`

- Create a recurring pattern

#### `PUT /api/recurring-patterns/:id`

- Update a recurring pattern

#### `DELETE /api/recurring-patterns/:id`

- Delete a recurring pattern

### Subtask API

#### `GET /api/todos/:todoId/subtasks`

- Retrieve list of subtasks

#### `POST /api/todos/:todoId/subtasks`

- Create a subtask

#### `PUT /api/subtasks/:id`

- Update a subtask

#### `DELETE /api/subtasks/:id`

- Delete a subtask

### Tag API

#### `GET /api/tags`

- Retrieve list of tags

#### `POST /api/tags`

- Create a tag

#### `PUT /api/tags/:id`

- Update a tag

#### `DELETE /api/tags/:id`

- Delete a tag

#### `POST /api/todos/:todoId/tags/:tagId`

- Add a tag to a task

#### `DELETE /api/todos/:todoId/tags/:tagId`

- Remove a tag from a task

### Reminder API

#### `GET /api/todos/:todoId/reminders`

- Retrieve list of reminders for a task

#### `POST /api/todos/:todoId/reminders`

- Create a reminder

#### `PUT /api/reminders/:id`

- Update a reminder

#### `DELETE /api/reminders/:id`

- Delete a reminder

#### `GET /api/notification-settings`

- Retrieve notification settings

#### `PUT /api/notification-settings`

- Update notification settings

### Data Export/Import API

#### `GET /api/export?format=json`

- Export task data

#### `POST /api/import`

- Import task data

## Database Extensions

### New Tables

#### `priorities` Table

| Column Name | Data Type | Constraints | Description                       |
| ----------- | --------- | ----------- | --------------------------------- |
| id          | TEXT      | PRIMARY KEY | Unique identifier for priority    |
| name        | TEXT      | NOT NULL    | Priority name (high, medium, low) |
| color       | TEXT      | NOT NULL    | Display color                     |
| created_at  | INTEGER   | NOT NULL    | Creation timestamp                |
| updated_at  | INTEGER   | NOT NULL    | Update timestamp                  |

#### `recurring_patterns` Table

| Column Name  | Data Type | Constraints | Description                   |
| ------------ | --------- | ----------- | ----------------------------- |
| id           | TEXT      | PRIMARY KEY | Unique identifier for pattern |
| type         | TEXT      | NOT NULL    | Pattern type                  |
| interval     | INTEGER   | NOT NULL    | Interval                      |
| days_of_week | TEXT      |             | Days of week (JSON array)     |
| day_of_month | INTEGER   |             | Day of month                  |
| end_date     | INTEGER   |             | End date timestamp            |
| occurrences  | INTEGER   |             | Number of recurrences         |
| created_at   | INTEGER   | NOT NULL    | Creation timestamp            |
| updated_at   | INTEGER   | NOT NULL    | Update timestamp              |

#### `subtasks` Table

| Column Name | Data Type | Constraints                    | Description                   |
| ----------- | --------- | ------------------------------ | ----------------------------- |
| id          | TEXT      | PRIMARY KEY                    | Unique identifier for subtask |
| todo_id     | TEXT      | NOT NULL, REFERENCES todos(id) | Parent task ID                |
| title       | TEXT      | NOT NULL                       | Title                         |
| description | TEXT      |                                | Description                   |
| status      | TEXT      | NOT NULL                       | Status                        |
| order       | INTEGER   | NOT NULL                       | Display order                 |
| created_at  | INTEGER   | NOT NULL                       | Creation timestamp            |
| updated_at  | INTEGER   | NOT NULL                       | Update timestamp              |

#### `tags` Table

| Column Name | Data Type | Constraints | Description               |
| ----------- | --------- | ----------- | ------------------------- |
| id          | TEXT      | PRIMARY KEY | Unique identifier for tag |
| name        | TEXT      | NOT NULL    | Tag name                  |
| color       | TEXT      |             | Display color             |
| created_at  | INTEGER   | NOT NULL    | Creation timestamp        |
| updated_at  | INTEGER   | NOT NULL    | Update timestamp          |

#### `todo_tags` Table (Junction Table)

| Column Name | Data Type         | Constraints                    | Description           |
| ----------- | ----------------- | ------------------------------ | --------------------- |
| todo_id     | TEXT              | NOT NULL, REFERENCES todos(id) | Task ID               |
| tag_id      | TEXT              | NOT NULL, REFERENCES tags(id)  | Tag ID                |
| PRIMARY KEY | (todo_id, tag_id) |                                | Composite primary key |

#### `reminders` Table

| Column Name       | Data Type | Constraints                    | Description                    |
| ----------------- | --------- | ------------------------------ | ------------------------------ |
| id                | TEXT      | PRIMARY KEY                    | Unique identifier for reminder |
| todo_id           | TEXT      | NOT NULL, REFERENCES todos(id) | Task ID                        |
| reminder_time     | INTEGER   | NOT NULL                       | Reminder time                  |
| notified          | INTEGER   | NOT NULL                       | Notification sent flag         |
| notification_type | TEXT      | NOT NULL                       | Notification type              |
| created_at        | INTEGER   | NOT NULL                       | Creation timestamp             |
| updated_at        | INTEGER   | NOT NULL                       | Update timestamp               |

#### `notification_settings` Table

| Column Name                | Data Type | Constraints | Description                   |
| -------------------------- | --------- | ----------- | ----------------------------- |
| id                         | TEXT      | PRIMARY KEY | Unique identifier for setting |
| enable_local_notifications | INTEGER   | NOT NULL    | Enable local notifications    |
| updated_at                 | INTEGER   | NOT NULL    | Update timestamp              |

### Extensions to Existing Tables

#### Columns to add to `todos` Table

| Column Name          | Data Type | Constraints                       | Description          |
| -------------------- | --------- | --------------------------------- | -------------------- |
| priority_id          | TEXT      | REFERENCES priorities(id)         | Priority ID          |
| is_recurring         | INTEGER   | NOT NULL DEFAULT 0                | Recurring task flag  |
| recurring_pattern_id | TEXT      | REFERENCES recurring_patterns(id) | Recurring pattern ID |
| instance_date        | INTEGER   |                                   | Instance date/time   |
| parent_todo_id       | TEXT      | REFERENCES todos(id)              | Parent task ID       |

## Performance Optimization

1. **Index Design**

   - Set indexes on frequently searched columns in additional tables
   - Consider composite indexes

2. **Query Optimization**

   - Efficient JOIN operations
   - Projections to retrieve only necessary data

3. **Caching Strategy**
   - Caching frequently accessed data
   - Cache invalidation mechanisms

## Security Considerations

1. **Data Protection**
   - Proper validation of API endpoints
   - Encryption of sensitive data

## Future Extensibility

1. **Analytics Features**

   - Task completion statistics
   - Productivity analysis dashboard

2. **Calendar Integration**
   - Synchronization with iCal/Google Calendar
   - Implementation of calendar view
