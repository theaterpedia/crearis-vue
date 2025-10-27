# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **CSV-Based Seeding System Extension**
  - Created "root" fileset for core seed data (users, projects)
  - 17 demo users with generated passwords (pattern: firstname2025)
  - 15 demo projects with owner and regio relationships
  - Password reference document (PASSWORDS.md, gitignored)
  - Foreign key resolution in CSV seeding (email → user.id, domaincode → project.id)
  - Root fileset registration in settings.ts
  - Test script for migration 022 validation

### Changed
- **Migration 022 Reorganization**
  - Chapter 1: Root fileset seeding (users, projects) - ACTIVE
  - Chapter 2: Base fileset seeding (events, posts, locations, instructors, participants) - DEACTIVATED
  - Added CHECK:base comments for future refactoring
  - Improved dotenv loading in database config and migration runner

### Fixed
- Environment variable loading in migration runner and database config

## [0.0.1] - 2025-10-15

### Added
- **Database Structure Validation System**
  - Schema definition system with versioned JSON files
  - `check-structure.ts` - Automated validation tool for PostgreSQL and SQLite
  - Version 0.0.1 schema definition with 12 core tables
  - Validation of table existence, column definitions, and constraints
  - Support for database-specific differences (PostgreSQL vs SQLite)
  - NPM scripts: `db:check-structure` and `db:check-structure:version`

- **Multi-Database Support**
  - PostgreSQL adapter with async API
  - SQLite adapter with async API
  - Unified database interface supporting both engines
  - Environment-based database selection

- **Authentication System**
  - User authentication via projects table (dual-purpose design)
  - Bcrypt password hashing (10 rounds)
  - Session management with in-memory storage
  - Admin, base, and project roles
  - User seeding scripts: `seed-users.ts`, `update-users.ts`
  - Database sync script: `sync-projects-to-users.ts`

- **Projects and Users Tables**
  - Projects table serves as user accounts (Phase 1 architecture)
  - Users table mirrors projects for future many-to-many relationship
  - Username/password authentication
  - Role-based access control

- **Database Management Scripts**
  - `update-users.ts` - Update/create users with new credentials
  - `update-users-sqlite-direct.ts` - Direct SQLite user management
  - `sync-projects-to-users.ts` - Sync projects to users table
  - `test-credentials.ts` - Validate stored credentials
  - `test-both-databases.ts` - Test credentials in both databases

- **Documentation**
  - `docs/postgresql/USER-AUTH-ARCHITECTURE.md` - Authentication design
  - `docs/postgresql/USERS-PROJECTS-SYNC.md` - Sync process and maintenance
  - Schema definition documentation in JSON format

### Fixed
- SQLite and PostgreSQL role constraints aligned
- Async/await patterns in all database operations
- Portable SQL syntax (INSERT ... ON CONFLICT ... DO UPDATE)

### Changed
- Version reset to 0.0.1 for schema baseline
- Database initialization with proper async patterns
- All API endpoints converted to async database calls

### Database Schema (v0.0.1)
- **Core Tables**: projects, users, releases, versions, tasks
- **Content Tables**: events, locations, participants, instructors, posts
- **System Tables**: hero_overrides, record_versions
- **Total Tables**: 12

### Added
- **Task Management System (Phase 1 & 2)**
  - Database schema for tasks, versions, and record tracking
  - Three new tables: `tasks`, `versions`, `record_versions`
  - Version tracking columns on all data tables (version_id, created_at, updated_at, status)
  - Five performance indexes for task queries
  - Ten automatic timestamp triggers
  - Four REST API endpoints for task management:
    - GET /api/tasks - List and filter tasks
    - POST /api/tasks - Create new task
    - PUT /api/tasks/[id] - Update task
    - DELETE /api/tasks/[id] - Delete task
  - Comprehensive task filtering (by status, record_type, record_id)
  - Priority-based task sorting (urgent, high, medium, low)
  - Automatic task completion tracking
  - Input validation and error handling
  - TypeScript interfaces for type safety
- Developer documentation:
  - `demo-data-editor.md` - Complete editor system documentation
  - `demo-data-versioning.md` - AI-assisted implementation guide
  - `docs/tasks_versioning_step1.md` - Phase 1 implementation report
  - `docs/tasks_versioning_step2.md` - Phase 2 implementation report

### Technical Details
- Database migration system with `server/database/migrations/001_tasks_versioning.ts`
- SQLite triggers for automatic timestamp management
- Prepared statements for SQL injection prevention
- nanoid for unique task IDs
- RESTful API design with proper HTTP status codes

## [0.1.0] - 2025-10-13

### Added
- Initial release as standalone server application
- Extracted from `@crearis/ui` package in crearis-nuxt monorepo
- Nitro-powered server with REST API endpoints
- Vue 3 SPA with router and components
- SQLite database with better-sqlite3
- CSV data import functionality
- Three API endpoints: data.get, sync.post, hero.put
- Development and production build configurations
- TypeScript support throughout
- Comprehensive documentation (README, DEPLOYMENT, CONTRIBUTING)

### Changed
- Converted from library package to standalone server application
- Updated build system from library output to SPA + server output
- Modified vite.config.ts for SPA builds
- Added nitro.config.ts for server configuration
- Fixed CSV import to use Node.js filesystem APIs

### Fixed
- better-sqlite3 native compilation compatibility (using v8.7.0)
- H3/Nitro version compatibility issues
- CSV file path resolution for server-side imports
- Server-side imports for H3 utilities

[0.1.0]: https://github.com/theaterpedia/crearis-vue/releases/tag/v0.1.0
