# Crearis Vue

> A comprehensive Vue 3 application for managing theater projects, events, posts, and educational content with dynamic page layouts, admin dashboard, and real-time collaboration features.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)
[![pnpm](https://img.shields.io/badge/pnpm-%3E%3D8.0.0-orange.svg)](https://pnpm.io/)

Extracted from `@crearis/ui` package in the [crearis-nuxt monorepo](https://github.com/theaterpedia/crearis-nuxt) to run as an independent full-stack application.

## ✨ Features

- 🎭 **Vue 3 SPA** - Modern single-page application with Vue Router
- 📦 **Project Management** - Comprehensive project, event, and post management system
- 👥 **User Roles** - Multi-role authentication (admin, project owner, user)
- ⚡ **Nitro Server** - Fast, modern server with hot module replacement
- 💾 **Dual Database Support** - SQLite (default) or PostgreSQL with automated migrations
- 📊 **CSV Import/Export** - Sync database from CSV files
- 🔌 **REST API** - Comprehensive API endpoints for all data operations
- 🎨 **UI Component Library** - Reusable Vue 3 components with TypeScript
- 📄 **Dynamic Page Layouts** - Configurable page regions (aside, footer) with p-components
- ✏️ **Inline Editing** - EditPanel for content management
- 📋 **Kanban Dashboard** - Task management with drag-and-drop
- 🔧 **Automated Setup** - One-command PostgreSQL configuration

## 🚀 Quick Start

### SQLite (Default)
```bash
# Install dependencies
pnpm install

# Start development server
pnpm run dev

# Initialize database (in another terminal)
curl -X POST http://localhost:3000/api/demo/sync
```

### PostgreSQL (Automated Setup)
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
- **Build tools** for better-sqlite3:
  - Linux: `apt install build-essential python3-dev`
  - macOS: Xcode Command Line Tools
  - Windows: Visual Studio Build Tools

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
- Writable filesystem for SQLite database
- ~100MB disk space

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

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

### Database Options

**SQLite** (Default)
- No setup required
- Works out of the box
- Perfect for development

**PostgreSQL** (Production-ready)
- Automated setup script: `bash setup-postgresql.sh`
- See [Setup Guide](docs/postgresql/STAGE-C-SETUP-GUIDE.md)
- Production-ready configuration

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

- **events** - Event information with dates and locations
- **posts** - Blog posts and articles
- **locations** - Venue locations
- **instructors** - Instructor profiles
- **participants** - Participant data (all age groups)
- **hero_overrides** - Custom hero section overrides

### CSV Import

CSV files in `src/assets/csv/`:
- `events.csv`, `posts.csv`, `locations.csv`, `instructors.csv`
- `children.csv`, `teens.csv`, `adults.csv` (participant data)

Run sync to import: `curl -X POST http://localhost:3000/api/demo/sync`

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