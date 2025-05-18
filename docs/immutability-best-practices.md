# Immutability Best Practices

This document explains the best practices for immutability adopted in the Toodo project. Applying immutability improves code reliability, predictability, and maintainability.

## Basic Principles

1. **All data structures should be immutable**

   - Create new objects instead of modifying object state
   - Use transformations instead of mutations
   - Minimize side effects and prioritize pure functions

2. **Leverage TypeScript's type system**

   - Use the `readonly` modifier to enforce immutability
   - Use types like `Readonly<T>` and `readonly T[]`
   - Consider immutability when defining types

3. **Patterns to guarantee immutability**
   - Use factory functions to create objects
   - Use copy and modify to create new objects
   - Always return new collections when manipulating collections

## Implementation Patterns

### 1. Domain Model Definition

```typescript
// Enforce immutability at the type level
export type Task = Readonly<{
  id: string;
  title: string;
  // ...other properties
  subtasks: readonly Task[]; // Immutable array
}>;
```

### 2. Use of Factory Functions

```typescript
// Factory functions include validation and return new objects
export function create(...): Task {
  // Validation
  if (!title.trim()) {
    throw new Error("Task title cannot be empty");
  }

  // Return a new object
  return {
    id: id || uuidv4(),
    // ...other properties
    subtasks: [...subtasks], // Create a copy
  };
}
```

### 3. Modification Operation Patterns

```typescript
// Modification functions don't change the original object but return a new object
export function updateTitle(task: Task, title: string): Task {
  return {
    ...task, // Copy using spread syntax
    title, // Set new value
    updatedAt: new Date(),
  };
}
```

### 4. Collection Operations

```typescript
// Always return new arrays instead of mutable arrays
function reorderSubtasks(task: Task, orderMap: Record<string, number>): Task {
  // Create a new array with map
  const updatedSubtasks = task.subtasks.map((subtask) => {
    const orderValue = orderMap[subtask.id];
    if (orderValue !== undefined) {
      return updateOrder(subtask, orderValue);
    }
    return subtask;
  });

  // Sorting also creates a new array
  const sortedSubtasks = [...updatedSubtasks].sort((a, b) => a.order - b.order);

  // Return a new task object
  return {
    ...task,
    updatedAt: new Date(),
    subtasks: sortedSubtasks,
  };
}
```

### 5. Utilizing Functional Paradigms

```typescript
// Use functional methods like filter, map, reduce
const tasksToUpdate = tasks
  .filter((task) => orderMap[task.id] !== undefined)
  .map((task) => {
    // Return a new object with changes applied
    return Task.updateOrder(task, orderMap[task.id]);
  });
```

### 6. Type-Safe Filtering

```typescript
// Type-safe filtering using type narrowing
const tasksWithOrderValues = tasks
  .map((task) => {
    const newOrder = orderMap[task.id];
    return { task, newOrder };
  })
  .filter(
    (item): item is { task: TaskType; newOrder: number } =>
      item.newOrder !== undefined
  );
```

### 7. Transactional Approach

```typescript
// Apply multiple changes step by step
let updatedTask = task;
if (title !== undefined) {
  updatedTask = Task.updateTitle(updatedTask, title);
}
if (description !== undefined) {
  updatedTask = Task.updateDescription(updatedTask, description);
}
```

## Benefits of Immutability

1. **Predictability**: State changes are controlled, making behavior easier to predict
2. **Easier Debugging**: Object states don't change, making it easier to identify changes
3. **Concurrent Processing**: Immutable objects can be safely processed concurrently
4. **Referential Transparency**: Function results depend only on inputs, making testing and optimization easier
5. **Design Simplification**: Assuming immutability leads to simpler overall design

## Considerations

1. **Performance**: Be mindful of memory usage and GC load when creating many objects
2. **Complex Updates**: Consider using immutable helper libraries for updating deeply nested objects
3. **Team Education**: The immutability paradigm may be unfamiliar to those experienced with imperative programming
