# Testing

## Testing Strategy

This project adopts the following testing approaches:

1. **Unit Tests**: Testing individual functions and components
2. **Integration Tests**: Testing multiple components working together
3. **API Tests**: Testing API endpoint functionality

## Testing Tools

The following tools are used for testing:

- **Bun Test**: Built-in test runner in Bun
- **API Testing**: Hono's testing capabilities with mock data stores

## Running Tests

```bash
# Run all tests
bun test

# Run tests in a specific file
bun test test/api.test.ts
```

## API Tests

API tests use in-memory mock data stores instead of actual databases to test the functionality of each API endpoint.

Main test targets:

- Todo creation and retrieval
- Subtask creation and retrieval
- Multiple subtask ordering

## Future Test Extensions

The following tests are planned for future implementation:

1. **Database Tests**: Testing database operation implementations
2. **Authentication/Authorization Tests**: Testing access control
3. **Error Handling Tests**: Testing error cases

These additional tests will further improve the reliability and quality of the application.
