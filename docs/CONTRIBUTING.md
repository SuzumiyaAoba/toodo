# Contributing to Toodo

Thank you for your interest in contributing to Toodo! This document outlines the process for contributing to this project.

## Code of Conduct

Please be respectful and considerate when contributing to this project. We expect all contributors to follow the [Code of Conduct](CODE_OF_CONDUCT.md).

## Getting Started

1. Fork the repository
2. Clone your forked repository
3. Create a new branch for your changes
4. Make your changes
5. Push your changes to your forked repository
6. Submit a pull request

## Development Setup

```bash
# Install dependencies
bun install

# Run development server
bun run dev

# Run tests
bun test
```

## Branch Naming Convention

Use the following format for branch names:

```
<type>/<short-description>
```

Types:
- `feature`: A new feature
- `fix`: A bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code changes that neither fix a bug nor add a feature
- `perf`: Code changes that improve performance
- `test`: Adding or modifying tests
- `chore`: Changes to the build process or auxiliary tools

Example: `feature/add-todo-filter`

## Commit Message Guidelines

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification for commit messages.

Format:
```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

Types:
- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code changes that neither fix a bug nor add a feature
- `perf`: Code changes that improve performance
- `test`: Adding or modifying tests
- `chore`: Changes to the build process or auxiliary tools

Example:
```
feat(todo): add ability to filter todos by status
```

## Pull Request Process

1. Create a new branch for your changes following the branch naming convention
2. Make your changes
3. Ensure all tests pass
4. Update documentation as necessary
5. Submit a pull request following the PR template
6. Request a review from a maintainer
7. Address any feedback from the review
8. Once approved, your PR will be merged

### Pull Request Requirements

- All pull requests must use the provided PR template
- PRs should be focused on a single change or feature
- All automated tests must pass
- Code should follow the project's coding standards
- Documentation should be updated as necessary
- Commit messages should follow the Conventional Commits specification

## Code Style

- Follow the existing code style in the project
- Use descriptive variable and function names
- Write clear comments for complex logic
- Include appropriate error handling

## Testing

- Write tests for all new features and bug fixes
- Run the test suite locally before submitting a PR
- Consider edge cases in your tests

## Documentation

Update documentation when making changes to the codebase:

- README.md
- API documentation
- Code comments
- Other relevant documentation

## Questions?

If you have any questions about contributing, please open an issue or reach out to the maintainers. 