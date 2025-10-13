# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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

[0.1.0]: https://github.com/theaterpedia/demo-data/releases/tag/v0.1.0
