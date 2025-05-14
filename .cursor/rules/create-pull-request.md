---
description: How to create Pull Request
globs: 
alwaysApply: false
---
# Pull Request Creation and Management Guide Using GitHub CLI

## Step-by-Step Workflow

1. Create and switch to a working branch
   ```bash
   # Use a descriptive branch name following conventions
   # Pattern: <type>/<description>
   # Examples: feature/user-authentication, fix/login-issue, docs/api-documentation
   git checkout -b feature/new-feature
   ```

2. Make changes and commit
   ```bash
   # Stage specific files
   git add <file1> <file2>
   
   # Or stage all changes
   git add .
   
   # Commit with conventional commit format
   # Pattern: <type>[optional scope]: <description>
   # Examples: feat: add user registration, fix(auth): resolve login timeout
   git commit -m "feat: add new feature"
   ```

3. Push the branch to remote
   ```bash
   git push -u origin feature/new-feature
   ```

4. Create a pull request
   ```bash
   # Basic command (interactive mode)
   gh pr create
   
   # Comprehensive command with options (recommended)
   echo -e "{{PULL_REQUEST_BODY}}" | gh pr create --title "Descriptive Pull Request Title" --base main --body-file -
   ```

   - `{{PULL_REQUEST_BODY}}` should be formatted as a single line
   - `{{PULL_REQUEST_BODY}}` should follow the structure in [PULL_REQUEST_TEMPLATE.md](mdc:.github/PULL_REQUEST_TEMPLATE.md)

5. Updating a pull request after creation
   ```bash
   # Make additional changes to your code
   git add .
   git commit -m "feat: implement requested changes"
   
   # Push updates to the same branch
   git push
   
   # The PR will update automatically with the new commits
   ```

6. Update PR title or description
   ```bash
   # Update PR title
   gh pr edit <PR-number> --title "Updated PR Title"
   
   # Update PR description
   gh pr edit <PR-number> --body "Updated PR Description"
   
   # Update both title and description
   gh pr edit <PR-number> --title "Updated PR Title" --body "Updated PR Description"
   ```

## Essential Guidelines

- **Language**: All PR titles and descriptions MUST be written in English, regardless of the primary language used in conversations.
- **Template**: Adhere to the PULL_REQUEST_TEMPLATE.md structure when creating PR descriptions.
- **Clarity**: Ensure descriptions clearly communicate the purpose, scope, and impact of changes.
- **Updates**: When addressing review feedback, include context about the changes made in commit messages.

## Advanced Options and Commands

### Essential PR Creation Options

- `--title`, `-t`: Define the PR title
- `--body`, `-b`: Specify the PR description content
- `--base`: Designate the target branch for merging (defaults to repository's default branch)
- `--draft`: Submit as a draft PR for initial review
- `--assignee`, `-a`: Assign the PR to specific team members
- `--reviewer`, `-r`: Request reviews from specific users or teams
- `--label`, `-l`: Categorize the PR with appropriate labels

### Comprehensive Example

```bash
gh pr create \
  --title "feat: implement JWT-based user authentication" \
  --body "Adds secure authentication system with role-based access control" \
  --base develop \
  --reviewer tech-lead,security-team \
  --assignee your-username \
  --label enhancement,security \
  --draft
```

### PR Management Commands

- List open pull requests
  ```bash
  gh pr list
  ```

- View PR details
  ```bash
  gh pr view <PR-number>
  # Or open in web browser
  gh pr view <PR-number> --web
  ```

- Check out a PR locally
  ```bash
  gh pr checkout <PR-number>
  ```

- Merge a PR
  ```bash
  gh pr merge <PR-number>
  # Available strategies: --merge, --squash, --rebase
  gh pr merge <PR-number> --squash
  ```

- Check PR status
  ```bash
  gh pr status
  # Shows status of open PRs you've created or been requested to review
  ```

- Add or remove reviewers
  ```bash
  gh pr edit <PR-number> --add-reviewer username1,username2
  gh pr edit <PR-number> --remove-reviewer username1
  ```

### Best Practices for Effective PRs

- Keep PRs focused on a single logical change
- Provide comprehensive descriptions of changes and implementation rationale
- Reference related issues with appropriate keywords (Fixes #123, Addresses #456)
- Ensure all tests pass and CI checks succeed before requesting review
- Respond promptly and thoroughly to reviewer feedback
- When addressing review comments, use the suggestion feature when applicable
- Consider using draft PRs for work-in-progress changes that require early feedback

