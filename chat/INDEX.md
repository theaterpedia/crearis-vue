# Demo-Data Project Documentation

Complete documentation for the demo-data project including database management, testing, and schema migrations.

**Copyright:** (c) Hans Dönitz, hans.doenitz@theaterpedia.org 2025

---

## 📚 Documentation Index

### Project Features & UI Components
- **[Project Route Implementation](./PROJECT_ROUTE_IMPLEMENTATION.md)** - 🎯 Complete project editor with stepper interface
- **[Project Events Step](./PROJECT_EVENTS_STEP.md)** - 📅 Events step implementation (gallery + add panel)
- **[Project Events Enhancements](./PROJECT_EVENTS_ENHANCEMENTS.md)** - ✨ TypeScript, loading states, errors, delete functionality
- **[Project Config Dropdown](./PROJECT_CONFIG_DROPDOWN.md)** - ⚙️ Configuration controls (7 settings)
- **[Project Config Summary](./PROJECT_CONFIG_SUMMARY.md)** - 📋 Quick overview of config dropdown
- **[TaskDashboard Auth States](./TASKDASHBOARD_AUTH_STATES.md)** - 🔐 User roles and authentication

### Database Setup & Operations
- **[Database Setup Guide](./postgresql/database-setup.md)** - 🎯 **START HERE** - Complete setup, migration & seeding guide
- **[Automatic Initialization](./AUTOMATIC_INITIALIZATION.md)** - 🚀 Smart database startup (technical deep-dive)
- [Database Migrations Guide](./DATABASE_MIGRATIONS.md) - 📖 Comprehensive developer guide (784 lines)
- **[Data Rules Validation](./DATA_RULES_VALIDATION.md)** - ✅ Validation report for data integrity rules
- **[Main Task Auto-Creation](./MAIN_TASK_AUTO_CREATION.md)** - 📋 How entity-task relationships work
- **[PostgreSQL Main Tasks Fix](./POSTGRESQL_MAIN_TASKS_FIX.md)** - 🔧 Trigger implementation for PostgreSQL
- **[Schema Updates Permanent](./SCHEMA_UPDATES_PERMANENT.md)** - 🛡️ Making schema changes survive database recreation

### Database Schema Migrations (Technical Reference)
- **[Schema Migration Complete](./SCHEMA_MIGRATION_COMPLETE.md)** - 🎉 Complete overview of all 4 phases
- [Migration Plan](./SCHEMA_MIGRATION_PLAN.md) - Original 4-phase plan (SCHEM-A through SCHEM-D)
- [SCHEM-A & B Complete](./SCHEM-A-B-COMPLETE.md) - Centralization & decoupling implementation
- [SCHEM-C Complete](./SCHEM-C-COMPLETE.md) - Schema validation & alignment
- [SCHEM-D Complete](./SCHEM-D-COMPLETE.md) - Version management integration
- [Migration Template](../server/database/migrations/003_example.ts) - Example migration file (321 lines)

### Sysreg System (Tag & Status Management)
- **[SYSREG_SYSTEM.md](./SYSREG_SYSTEM.md)** - 🏷️ **START HERE** - Complete reference & entry point
- [Use-Case Design](./SYSREG_USECASE_DESIGN.md) - Detailed use-case analysis (1692 lines)
- [Phase 3+4 Complete](./SYSREG_PHASE3_PHASE4_COMPLETE.md) - Implementation details (667 lines)
- [Phase 5+6 Complete](./SYSREG_PHASE5_PHASE6_COMPLETE.md) - Analytics & Admin UI implementation
- [Testing Strategy](./SYSREG_TESTING_STRATEGY.md) - Test coverage & strategy
- [Interface Specification](./SYSREG_INTERFACE_SPECIFICATION_ISSUE.md) - Type definitions & API contracts

### Testing Infrastructure
- [Quick Start](./vitest/QUICK-START.md) - 2-minute setup
- [Complete Guide](./vitest/README.md) - Full testing reference

### Stage C: PostgreSQL Automated Setup
- [Quick Reference](./postgresql/STAGE-C-QUICK-REFERENCE.md) - Fast command reference
- [Setup Guide](./postgresql/STAGE-C-SETUP-GUIDE.md) - Complete automated setup instructions
- [Completion](./postgresql/stage-c-complete.md) - What was delivered
- [Setup Script](../scripts/setup-postgresql.sh) - Interactive bash script for PostgreSQL configuration

### PostgreSQL Compatibility & Validation
- [Stage D Complete](./postgresql/STAGE-D-COMPLETE.md) - Full validation & test results (17/17 tests passing)
- [Test Suite](../tests/integration/stage-d-compatibility.test.ts) - Comprehensive compatibility tests

---

## 🚀 Quick Access

### For First-Time Setup (Database)
1. **Read [Database Setup Guide](./postgresql/database-setup.md)** - Complete walkthrough
2. Create PostgreSQL database: `sudo -u postgres psql -c "CREATE DATABASE crearis_admin_dev OWNER persona;"`
3. Run `pnpm dev` - Automatic initialization, migrations & seeding!
4. Login with: `admin` / `password123`

### For Database Migrations
- **[Database Setup Guide](./postgresql/database-setup.md)** - Comprehensive guide
- Check migration status: `pnpm db:migrate:status`
- Run migrations: `pnpm db:migrate`
- Validate schema: `pnpm version:check`
- Update version: `pnpm version:bump`

### For First-Time Setup (Testing)
1. Read [Vitest Quick Start](./vitest/QUICK-START.md)
2. Run `pnpm install`
3. Run `pnpm test`

### For Writing Tests
- [Testing Guide](./vitest/README.md)
- [Test Utilities Reference](./vitest/README.md#test-utilities)
- [Writing Tests Examples](./vitest/README.md#writing-tests)

### For Configuration
- [Database Config](./postgresql/README.md#configuration)
- [Test Config](./vitest/README.md#configuration)
- [Migration System](./DATABASE_MIGRATIONS.md)
- [Environment Variables](./.env.database.example)

### For Troubleshooting
- [PostgreSQL Issues](./postgresql/README.md#troubleshooting)
- [Testing Issues](./vitest/README.md#troubleshooting)

---

## 📊 Stage Status

| Stage | Status | Documentation | Tests |
|-------|--------|---------------|-------|
| **Stage A** | ✅ Complete | Database infrastructure with dual-logic | N/A |
| **Stage B** | ✅ Complete | Vitest testing infrastructure | N/A |
| **Stage C** | ✅ Complete | PostgreSQL automated setup | N/A |
| **Stage D** | ✅ Complete | Coverage & validation | 17/17 passing |

---

## 🎯 Project Goals

### Completed
- ✅ Dual database support (SQLite & PostgreSQL)
- ✅ Environment-based configuration
- ✅ Unified database adapter interface
- ✅ Automatic dialect detection
- ✅ **Automatic database initialization** (schema creation + seeding)
- ✅ **Smart migration system** (version tracking + automatic execution)
- ✅ **Zero-config setup** (just run `pnpm dev`)
- ✅ Comprehensive testing infrastructure
- ✅ PostgreSQL compatibility validated (17/17 tests passing)
- ✅ Production readiness confirmed

---

## 📁 File Structure

```
demo-data/
├── server/
│   └── database/
│       ├── config.ts              # Database configuration
│       ├── adapter.ts             # Database adapter interface
│       ├── adapters/
│       │   ├── sqlite.ts          # SQLite adapter
│       │   └── postgresql.ts      # PostgreSQL adapter
│       ├── db-new.ts              # Database instance (PostgreSQL + SQLite)
│       ├── init.ts                # Automatic initialization
│       ├── seed.ts                # Automatic seeding
│       └── migrations/            # Database migrations
│           ├── index.ts           # Migration registry
│           ├── 000_base_schema.ts # Initial schema
│           ├── 001_init_schema.ts # Config table
│           └── 002_align_schema.ts # Schema alignment
├── tests/
│   ├── setup/
│   │   ├── global-setup.ts        # Global test initialization
│   │   └── test-setup.ts          # Per-file test setup
│   ├── utils/
│   │   └── db-test-utils.ts       # Test utilities & fixtures
│   └── integration/
│       └── database-adapter.test.ts # Sample tests
├── docs/
│   ├── postgresql/
│   │   ├── database-setup.md      # Complete setup guide
│   │   ├── README.md              # Architecture overview
│   │   └── STAGE-D-COMPLETE.md    # Validation results
│   ├── vitest/
│   │   ├── QUICK-START.md         # Testing quick start
│   │   └── README.md              # Testing reference
│   └── INDEX.md                   # This file
├── vitest.config.ts               # Vitest configuration
└── .env.database.example          # Database config examples
```

---

## 🔧 Commands Reference

### Database Setup & Operations
```bash
# First-time setup (creates database, runs migrations, seeds data)
pnpm dev

# Check migration status
pnpm db:migrate:status

# Run pending migrations
pnpm db:migrate

# Check/update version
pnpm version:check
pnpm version:bump

# Database inspection
sudo -u postgres psql -d crearis_admin_dev -c "\dt"  # List tables
sudo -u postgres psql -d crearis_admin_dev -c "SELECT * FROM users;"  # View users
```

### Testing
```bash
# Run all tests (SQLite)
pnpm test

# Interactive UI
pnpm test:ui

# PostgreSQL tests
pnpm test:pg
pnpm test:pgintegration

# Coverage
pnpm test:coverage

# Watch mode
pnpm test:watch

# Specific test
tsx tests/scripts/run-test.ts "test name"
```

### Development
```bash
# Install dependencies
pnpm install

# Run dev server
pnpm dev

# Build
pnpm build
```

---

## 📖 Documentation Best Practices

When reading the documentation:

1. **Start with presentations** - Quick overview of each stage
2. **Read summaries** - Technical implementation details
3. **Check completion docs** - Full deliverables list
4. **Use guides** - Reference while working

When something goes wrong:

1. Check troubleshooting sections
2. Review configuration examples
3. Read error messages carefully
4. Test with SQLite first (simpler)

---

## 🎓 Learning Path

### Beginner (Never used this setup)
1. Read [Database Setup Guide](./postgresql/database-setup.md) - Start here!
2. Read [Vitest Quick Start](./vitest/QUICK-START.md)
3. Run `pnpm dev` to initialize database
4. Run `pnpm test` to see tests in action

### Intermediate (Writing tests)
1. Read [Testing Guide](./vitest/README.md)
2. Study [Test Utilities](./vitest/README.md#test-utilities)
3. Copy sample test and modify
4. Use watch mode: `pnpm test:watch`

### Advanced (Configuring/debugging)
1. Read [Technical Summaries](./vitest/stage-b-summary.md)
2. Study adapter implementations
3. Configure CI/CD pipelines
4. Optimize performance

---

## 🚦 CI/CD Integration

Documentation includes examples for:
- GitHub Actions
- GitLab CI
- Test both databases
- Coverage reporting
- Artifact uploads

See [CI/CD Integration](./vitest/README.md#cicd-integration) for details.

---

## 🎯 Stage C: PostgreSQL Automated Setup ✅

Stage C delivers a complete automated setup solution:

### 1. Automated Setup Script
- Interactive bash script for PostgreSQL configuration
- Checks PostgreSQL installation and status
- Creates and validates `.env` file
- Tests database connections
- Creates database and user with permission

### 2. Comprehensive Documentation
- Single-file setup guide with all instructions
- Installation guides for all major platforms
- Troubleshooting section
- Security best practices
- Testing procedures

### 3. Smart Configuration Wizard
- Prompts for all required settings with defaults
- Password confirmation
- Connection validation
- Automatic retry logic

**Time to Setup:** 2-5 minutes  
**Files:** 2 (1 script, 1 guide)  
**Status:** ✅ Complete

---

## 📊 Current System

**Database System:**
- Database Adapters: 2 (PostgreSQL + SQLite)
- Migration Files: 3 (base_schema, init_schema, align_schema)
- Automatic Initialization: ✅ Yes
- Automatic Seeding: ✅ Yes (CSV + users/projects)
- Tables: 13 with full schema
- Compatibility Tests: 17/17 passing

**Testing:**
- Test Framework: Vitest
- Test Cases: 15+ integration tests
- Coverage: Database adapters fully tested

---

## 🔗 External Resources

- [Vitest Documentation](https://vitest.dev/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [SQLite Documentation](https://www.sqlite.org/docs.html)
- [better-sqlite3](https://github.com/WiseLibs/better-sqlite3)
- [node-postgres (pg)](https://node-postgres.com/)

---

## 📞 Support

**For Questions About:**
- Database setup → Read [PostgreSQL README](./postgresql/README.md)
- Testing → Read [Vitest README](./vitest/README.md)
- Configuration → Check `.env.database.example`
- Errors → Check troubleshooting sections

**Quick Links:**
- [PostgreSQL Troubleshooting](./postgresql/README.md#troubleshooting)
- [Testing Troubleshooting](./vitest/README.md#troubleshooting)

---

## ✅ Checklist: Are You Ready?

### For Database Development
- [ ] PostgreSQL installed and running
- [ ] Database created (`sudo -u postgres psql -c "CREATE DATABASE crearis_admin_dev OWNER persona;"`)
- [ ] Run `pnpm dev` (automatic initialization + seeding)
- [ ] Verify users created: `sudo -u postgres psql -d crearis_admin_dev -c "SELECT * FROM users;"`
- [ ] Login works: `admin` / `password123`

### For Testing
- [ ] Run `pnpm install`
- [ ] Run `pnpm test`
- [ ] Check `test-results/index.html`

### For Development
- [ ] Read [Database Setup Guide](./postgresql/database-setup.md)
- [ ] Understand migration system
- [ ] Know how to create migrations
- [ ] Familiar with seeding process

---

**Current Status:** Stage A ✅ | Stage B ✅ | Stage C ✅ | Stage D ✅  
**Database Setup:** Automatic initialization, migrations & seeding ✅  
**Last Updated:** October 15, 2025
