# Crearis Demo Data Server

> Standalone server application providing Vue UI components and demo data API endpoints

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)
[![pnpm](https://img.shields.io/badge/pnpm-%3E%3D8.0.0-orange.svg)](https://pnpm.io/)

Extracted from `@crearis/ui` package in the [crearis-nuxt monorepo](https://github.com/theaterpedia/crearis-nuxt) to run as an independent server.

## ✨ Features

- 🎭 **Vue 3 SPA** - Interactive demo interface with Vue Router
- ⚡ **Nitro Server** - Fast, modern server with hot reload
- 💾 **SQLite Database** - Persistent storage with better-sqlite3
- 📊 **CSV Import** - Sync database from CSV files
- 🔌 **REST API** - Three main endpoints for data operations
- 🎨 **UI Components** - Reusable Vue components library

## 🚀 Quick Start

```bash
# Install dependencies
pnpm install

# Start development server
pnpm run dev

# Initialize database (in another terminal)
curl -X POST http://localhost:3000/api/demo/sync
```

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
demo-data/
├── src/                    # Vue application
│   ├── components/         # UI components
│   ├── views/             # Page views
│   ├── router/            # Vue Router
│   ├── assets/            # Static files & CSV data
│   └── app.ts             # App entry point
├── server/                # Nitro server
│   ├── api/demo/          # API endpoints
│   └── database/          # Database config
├── nitro.config.ts        # Server configuration
├── vite.config.ts         # Build configuration
└── index.html             # SPA template
```

## 💾 Database

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

- **Repository**: https://github.com/theaterpedia/demo-data
- **Original Monorepo**: https://github.com/theaterpedia/crearis-nuxt
- **Issues**: https://github.com/theaterpedia/demo-data/issues

---

Made with ❤️ by [theaterpedia](https://github.com/theaterpedia)