# Crearis Vue

> **Website Accelerator for the Theaterpedia.org Network** - A full-stack Vue 3 application serving as the central platform for creating and managing theater project websites across the Theaterpedia network, powered by ODOO API integration.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)
[![pnpm](https://img.shields.io/badge/pnpm-%3E%3D8.0.0-orange.svg)](https://pnpm.io/)

## 🎯 Project Overview

This project has evolved from a simple SPA into a **comprehensive website accelerator** that serves three distinct systems under one domain:

### A) Theaterpedia.org Network Homepage
- **Purpose**: Central hub and search portal for the Theaterpedia.org network
- **Future**: Will enable content discovery across all network projects
- **Status**: Under active development

### B) Admin SPA for Project Configuration
- **Purpose**: Administrative interface for managing projects, events, posts, and content
- **Target Users**: Network administrators and project owners
- **Features**: Project management, user roles, content editing, CSV import/export
- **Future Plans**: Refactor into a Progressive Web App (PWA)

### C) Project Sites as External Websites
- **Purpose**: Individual project websites with SEO optimization
- **Route**: Preview under `/sites/:domaincode`
- **Production**: Each project will have its own domain once leaving preview status
- **Optimization**: Built for search engine visibility and external web presence

### 🔄 Integration Status

**⚠️ System Under Migration**

This system is centered around the **ODOO API** as the primary data source. The exact architecture and module boundaries are currently **under active migration** from the legacy system. The current implementation represents a transitional state with:

- Data synchronization from ODOO being refined
- Module boundaries being established
- SEO optimizations being implemented
- Architecture decisions being validated

**Timeline**: Current implementation expected to serve for 3-6 months while full migration is completed.

## ✨ Features

- 🎭 **Vue 3 SPA** - Modern single-page application with Vue Router
- 📦 **Project Management** - Comprehensive project, event, and post management system
- 👥 **User Roles** - Multi-role authentication (admin, project owner, user)
- ⚡ **Nitro Server** - Fast, modern server with hot module replacement
- 💾 **PostgreSQL Database** - Production-ready database with JSONB support (SQLite deprecated)
- 📊 **CSV Import/Export** - Sync database from CSV files
- 🔌 **REST API** - Comprehensive API endpoints for all data operations
- 🎨 **UI Component Library** - Reusable Vue 3 components with TypeScript
- 📄 **Dynamic Page Layouts** - Configurable page regions (aside, footer) with p-components
- ✏️ **Inline Editing** - EditPanel for content management
- 📋 **Kanban Dashboard** - Task management with drag-and-drop
- 🔧 **Automated Setup** - One-command PostgreSQL configuration

## ⚠️ Database Requirements

**� SQLite Support is DEPRECATED**

The application currently requires **PostgreSQL** due to extensive use of JSONB field types throughout the codebase. SQLite support has been deprecated and would require significant refactoring to restore.

**✅ PostgreSQL is REQUIRED** for all installations.

## �🚀 Quick Start

### PostgreSQL Setup (Required)
```bash
# Install dependencies
pnpm install

# Run automated PostgreSQL setup (creates .env and database)
bash setup-postgresql.sh

# Start development server
pnpm run dev

# Initialize database (in another terminal)
curl -X POST http://localhost:3000/api/demo/sync
```

### Manual PostgreSQL Setup
```bash
# Install dependencies
pnpm install

# Copy environment template
cp .env.database.example .env
# Edit .env with your PostgreSQL credentials

# Start development server
pnpm run dev

# Run migrations and seed data
pnpm db:migrate
curl -X POST http://localhost:3000/api/demo/sync
```

See [PostgreSQL Setup Guide](docs/postgresql/STAGE-C-SETUP-GUIDE.md) for detailed instructions.

Visit `http://localhost:3000` to see the application.

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/demo/data` | Retrieve all demo data |
| `POST` | `/api/demo/sync` | Sync database from CSV files |
| `PUT` | `/api/demo/hero` | Update hero section data |

### Example Usage

```bash
# Get all data
curl http://localhost:3000/api/demo/data

# Sync database from CSV
curl -X POST http://localhost:3000/api/demo/sync

# Update hero
curl -X PUT http://localhost:3000/api/demo/hero \
  -H "Content-Type: application/json" \
  -d '{"id":"hero_id","cimg":"https://...","heading":"Title","description":"Text"}'
```

## 🛠️ Development

### Prerequisites

- **Node.js** 18+ ([Download](https://nodejs.org/))
- **pnpm** 8+ (`npm install -g pnpm`)
- **PostgreSQL** 12+ ([Installation Guide](https://www.postgresql.org/download/))

### Scripts

```bash
pnpm run dev       # Start development server (port 3000)
pnpm run build     # Build for production
pnpm run start     # Start production server
pnpm run preview   # Preview production build
```

## 📦 Production Deployment

### Build & Deploy

```bash
# Build the application
pnpm run build

# The .output/ directory contains everything needed
# Copy it to your server and run:
node .output/server/index.mjs
```

### Environment Variables

```bash
PORT=3000           # Server port (default: 3000)
HOST=0.0.0.0        # Server host (default: 0.0.0.0)
NODE_ENV=production # Environment
```

### Requirements

- Node.js 18+
- **PostgreSQL 12+** (required - SQLite deprecated)
- 1GB+ RAM
- 2GB+ disk space

See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for detailed deployment instructions.

## 📁 Project Structure

```
crearis-vue/
├── src/                    # Vue application
│   ├── components/         # UI components (150+)
│   ├── views/             # Page views
│   ├── router/            # Vue Router
│   ├── composables/       # Composable functions
│   ├── assets/            # Static files & CSV data
│   └── app.ts             # App entry point
├── server/                # Nitro server
│   ├── api/               # API endpoints (auth, projects, events, posts, etc.)
│   ├── database/          # Database config & migrations
│   └── data/              # CSV seed data
├── docs/                  # Documentation
├── nitro.config.ts        # Server configuration
├── vite.config.ts         # Build configuration
└── index.html             # SPA template
```

## 💾 Database

### Current Database Status

**🔴 SQLite Support: DEPRECATED**
- SQLite support has been deprecated due to extensive use of PostgreSQL-specific features
- Current codebase relies heavily on **JSONB field types** not available in SQLite
- Restoring SQLite compatibility would require significant refactoring effort

**✅ PostgreSQL: REQUIRED**
- **PostgreSQL 12+** is the only supported database
- Automated setup script: `bash setup-postgresql.sh`
- See [Setup Guide](docs/postgresql/STAGE-C-SETUP-GUIDE.md)
- Production-ready with full JSONB support

### Why SQLite? (Future Considerations)

While SQLite is currently deprecated, there are compelling reasons to potentially restore support in the future:

**🌩️ Cloudflare D1 Compatibility**
- Cloudflare D1 is SQLite-compatible and offers excellent edge performance
- Would enable serverless deployment with minimal latency worldwide
- Cost-effective scaling for read-heavy workloads

**📓 Obsidian.md Integration Plans**
- Plans to make parts of the application available inside Obsidian.md
- Obsidian users prefer simple local database solutions over PostgreSQL
- SQLite would enable seamless offline functionality within Obsidian vaults
- Local-first approach aligns with Obsidian's philosophy

> **Note**: Future SQLite support would require refactoring JSONB dependencies to use JSON text fields with application-level parsing, or implementing a compatibility layer.

### Database Management

**Drop and Rebuild** (PostgreSQL)

Completely drop all tables and rebuild from scratch:

```bash
pnpm db:rebuild
```

This command will:
1. Drop all existing tables (CASCADE)
2. Run all migrations to recreate schema
3. Seed the database with CSV data and users/projects

⚠️ **Warning**: This destroys all data. Use only in development or when you want a fresh start.

**Migration Management**

```bash
pnpm db:migrate         # Run pending migrations
pnpm db:migrate:status  # Check migration status
```

### Schema

- **users** - User accounts and authentication
- **projects** - Project management with JSONB metadata
- **events** - Event information with dates and locations
- **posts** - Blog posts and articles with JSONB content
- **locations** - Venue locations
- **instructors** - Instructor profiles
- **participants** - Participant data (all age groups)
- **tasks** - Task management system
- **pages** - Dynamic page content with JSONB configuration

### CSV Import/Export

CSV files are managed in `/server/data/` directories:
- `root/` - Core data (users, projects)
- `base/` - Demo data (events, posts, locations, instructors, participants)

```bash
# Import from CSV files
curl -X POST http://localhost:3000/api/demo/sync

# Run database migrations
pnpm db:migrate
```

## 🤝 Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Links

- **Repository**: https://github.com/theaterpedia/crearis-vue
- **Issues**: https://github.com/theaterpedia/crearis-vue/issues
- **Original Monorepo**: https://github.com/theaterpedia/crearis-nuxt

---

Made with ❤️ by [theaterpedia](https://github.com/theaterpedia)