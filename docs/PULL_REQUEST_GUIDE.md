# Pull Request Guide

This document provides detailed guidelines for creating and reviewing pull requests in the Toodo project.

## Creating a Pull Request

### 1. Preparation

Before creating a PR, ensure:

- Your code is complete and working as expected
- All tests pass locally
- Your changes follow the project's code style
- Appropriate documentation has been updated

### 2. Creating the PR

1. Push your changes to your fork of the repository
2. Navigate to the original repository on GitHub
3. Click on "Pull Requests" and then "New Pull Request"
4. Select your fork and branch containing the changes
5. Fill out the PR template completely

### 3. Writing a Good PR Description

Your PR description should:

- Clearly explain what changes were made and why
- Reference any related issues (e.g., "Fixes #123")
- Include screenshots or GIFs for UI changes
- Describe how the changes were tested
- Note any potential side effects or areas of concern

### 4. PR Size Guidelines

- Keep PRs focused on a single change or feature
- Aim for smaller, more manageable PRs (under 500 lines when possible)
- If a large change is necessary, consider breaking it into multiple PRs
- Provide extra context and documentation for larger PRs

## PR Review Process

### As a PR Author

1. Respond to feedback promptly and respectfully
2. Make requested changes or explain why they might not be appropriate
3. Address all comments before requesting a re-review
4. Notify reviewers when your PR is ready for another look
5. Be patient during the review process

### As a PR Reviewer

1. Provide constructive feedback
2. Focus on code quality, architecture, and functionality
3. Check for test coverage
4. Verify documentation updates
5. Ensure the code follows project standards
6. Approve only when all concerns have been addressed

## PR Merge Guidelines

A PR is ready to merge when:

1. It has been approved by at least one maintainer
2. All requested changes have been addressed
3. All CI checks pass
4. The branch is up to date with the main branch

After merging:

1. Delete the feature branch
2. Verify the changes work as expected in the main branch
3. Close any related issues if they are fixed

## Common PR Issues and Solutions

### PR Builds Failing

1. Check the build logs to identify the issue
2. Fix any failing tests or lint issues
3. Ensure all dependencies are properly included
4. Verify your changes work in a clean environment

### Merge Conflicts

1. Merge or rebase the latest changes from the main branch
2. Resolve any conflicts carefully
3. Test again after resolving conflicts
4. Push the updated branch

### PR Too Large

1. Consider splitting into multiple PRs
2. Focus on logical separation of concerns
3. Create a draft PR for early feedback on approach
4. Provide a detailed description of the overall plan

## Advanced PR Techniques

### Draft PRs

Use draft PRs when:
- You want early feedback on an approach
- The work is still in progress
- You need help with a specific aspect of the implementation

### Feature Flags

Consider using feature flags when:
- Adding large features that should be deployed but not immediately visible
- Testing features with a subset of users
- Wanting to merge code incrementally while working on a larger feature

## Further Resources

- [GitHub's PR documentation](https://docs.github.com/en/pull-requests)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [How to Write a Git Commit Message](https://chris.beams.io/posts/git-commit/) 