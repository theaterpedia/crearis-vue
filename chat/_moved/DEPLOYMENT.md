# Crearis Demo Data Server

Standalone server application providing Vue UI components and demo data API endpoints. Extracted from `@crearis/ui` package in the crearis-nuxt monorepo.

**Repository**: https://github.com/theaterpedia/demo-data  
**Original Package**: `@crearis/ui` from https://github.com/theaterpedia/crearis-nuxt

## Quick Start

```bash
# Install dependencies
pnpm install

# Start development server
pnpm run dev

# Initialize database with demo data
curl -X POST http://localhost:3000/api/demo/sync

# Build for production
pnpm run build

# Start production server
pnpm run start
```

## Features

- **Vue 3 SPA**: Interactive demo interface with router
- **Nitro Server**: Fast, modern server with hot module replacement
- **SQLite Database**: Persistent storage for demo data
- **CSV Import**: Sync database from CSV files
- **REST API**: Three main endpoints for data operations

## API Endpoints

### Get All Data
```bash
GET /api/demo/data
```
Returns all demo data (events, posts, locations, instructors, participants, hero overrides).

### Sync Database
```bash
POST /api/demo/sync
```
Imports data from CSV files into the database. Run this after first installation.

### Update Hero
```bash
PUT /api/demo/hero
Content-Type: application/json

{
  "id": "hero_id",
  "cimg": "https://...",
  "heading": "Title",
  "description": "Description",
  "event_ids": ["event1", "event2"]
}
```

## Development

### Prerequisites

- **Node.js**: 18.x or higher
- **pnpm**: 8.x or higher
- **Build tools**: gcc, python3-dev, build-essential (for better-sqlite3)

### Setup Development Environment

1. Clone the repository:
```bash
git clone https://github.com/theaterpedia/demo-data.git
cd demo-data
```

2. Install dependencies:
```bash
pnpm install
```

3. Start development server:
```bash
pnpm run dev
```

The server runs on `http://localhost:3000` (Nitro API + Vue SPA).

### Available Scripts

- `pnpm run dev` - Start development server with hot reload
- `pnpm run build` - Build for production
- `pnpm run start` - Start production server
- `pnpm run preview` - Preview production build locally
- `pnpm run prepare` - Prepare Nitro (runs automatically on install)

## Production Deployment

### Build

```bash
pnpm run build
```

This creates a `.output/` directory with:
- `server/index.mjs` - Server entry point
- `public/` - Static assets and Vue SPA

### Deploy

Copy the `.output/` directory to your server and run:

```bash
node .output/server/index.mjs
```

### Environment Variables

```bash
PORT=3000          # Server port (default: 3000)
HOST=0.0.0.0       # Server host (default: 0.0.0.0)
NODE_ENV=production # Environment mode
```

### Server Requirements

- Node.js 18+
- SQLite3 support
- Sufficient disk space for database

### Database Location

The SQLite database is created at `./demo-data.db` in the project root. Make sure this location is writable and persistent.

## Project Structure

```
demo-data/
├── src/                      # Vue application
│   ├── app.ts               # Vue app entry point
│   ├── App.vue              # Root component
│   ├── components/          # Reusable Vue components
│   ├── views/               # Page components
│   ├── router/              # Vue Router configuration
│   ├── composables/         # Vue composables
│   └── assets/              # Static assets
│       ├── css/             # Stylesheets
│       ├── csv/             # Demo data CSV files
│       └── fonts/           # Font files
├── server/                  # Nitro server
│   ├── api/demo/            # API route handlers
│   │   ├── data.get.ts     # GET /api/demo/data
│   │   ├── sync.post.ts    # POST /api/demo/sync
│   │   └── hero.put.ts     # PUT /api/demo/hero
│   └── database/            # Database configuration
│       └── db.ts            # SQLite setup & schema
├── index.html               # Vue SPA template
├── vite.config.ts           # Vite build configuration
├── nitro.config.ts          # Nitro server configuration
├── tsconfig.json            # TypeScript configuration
└── package.json             # Project dependencies
```

## CSV Data Format

CSV files in `src/assets/csv/` are imported during sync:

- **events.csv**: Event information (id, name, dates, location, etc.)
- **posts.csv**: Blog posts/articles
- **locations.csv**: Venue locations
- **instructors.csv**: Instructor profiles
- **children.csv**, **teens.csv**, **adults.csv**: Participant data by age group

## Database Schema

### Tables

- **events**: Event data with dates, locations, and metadata
- **posts**: Blog posts and articles
- **locations**: Physical locations/venues
- **instructors**: Instructor profiles and information
- **participants**: Combined participant data from all age groups
- **hero_overrides**: Custom hero section overrides

### Migrations

Database schema is initialized automatically on first run. To reset:

```bash
rm demo-data.db
curl -X POST http://localhost:3000/api/demo/sync
```

## Technology Stack

- **Vue 3**: Progressive JavaScript framework
- **Vue Router**: Official routing library
- **Nitro**: Next-generation server engine
- **Vite**: Fast build tool and dev server
- **better-sqlite3**: Fast SQLite3 bindings for Node.js
- **TypeScript**: Type-safe JavaScript

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License - see [LICENSE](LICENSE) file for details

## Links

- **GitHub**: https://github.com/theaterpedia/demo-data
- **Original Monorepo**: https://github.com/theaterpedia/crearis-nuxt
- **Issue Tracker**: https://github.com/theaterpedia/demo-data/issues

## Support

For questions or issues, please:
1. Check existing [GitHub Issues](https://github.com/theaterpedia/demo-data/issues)
2. Create a new issue with detailed information
3. Contact the maintainers at theaterpedia

---

**Note**: This project was extracted from the crearis-nuxt monorepo (`packages/ui`) to run as a standalone server application.
