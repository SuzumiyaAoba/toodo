# Local Deployment Guide

## Overview

This document provides detailed information about using the Toodo application API locally. This application is designed as an API for personal task management and is intended to operate in a local environment.

## Local Development Environment

- **Purpose**: Use as a personal task management API
- **Infrastructure**: Local development machine
- **Database**: SQLite (file-based)
- **Deployment method**: Using the `bun run dev` command
- **URL format**: `http://localhost:3000`

## Development Process

### 1. Build Process

```bash
# Install dependencies
bun install

# Run tests
bun test

# Build the application
bun run build
```

The build process generates optimized server-side code in the `dist/` directory.

### 2. Development Mode

```bash
# Run in development mode (with hot reload)
bun run dev
```

## Configuration Management

### 1. Environment Variables

Configuration is managed through environment variables:

```bash
# Server settings
PORT=3000
HOST=0.0.0.0
NODE_ENV=production

# Database settings
DATABASE_URL=file:./data/toodo.db

# Logging
LOG_LEVEL=info
```

### 2. Configuration Files

JSON files are used for more complex configurations:

```json
{
  "server": {
    "cors": {
      "allowedOrigins": ["http://localhost:3000"],
      "allowedMethods": ["GET", "POST", "PUT", "DELETE"]
    }
  }
}
```

## Database Management

### 1. Migration

Database schema changes are applied through migrations:

```bash
# Generate migrations
bun run drizzle-kit generate

# Apply migrations
bun run migrate
```

### 2. Backup and Restore

Regular backups are recommended:

```bash
# Database backup
bun run db:backup

# Database restore
bun run db:restore backup-2023-04-15.db
```

## Monitoring and Logging

### Application Logs

Structured JSON logs are output to standard output/standard error:

```json
{
  "timestamp": "2023-04-15T12:34:56.789Z",
  "level": "info",
  "message": "API request processed",
  "method": "GET",
  "path": "/api/todos",
  "duration": 45,
  "status": 200
}
```

## About Security

### Data Protection

- Proper validation of API endpoints
- Protection of sensitive data

## Troubleshooting

### Common Problems and Solutions

1. **If the application doesn't start**

   - Check error logs
   - Verify environment variables
   - Ensure database access

2. **If database migration fails**

   - Review migration scripts
   - Check database permissions
   - Restore from backup if necessary

3. **Performance degradation**
   - Check database query performance
   - Review recent code changes
   - Analyze resource usage
