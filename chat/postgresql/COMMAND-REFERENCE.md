# Quick Command Reference - PostgreSQL & Testing

## Database Management

### SQLite (Development)
```bash
# Start with SQLite (default)
pnpm dev

# Check database
sqlite3 demo-data.db ".tables"
sqlite3 demo-data.db "SELECT COUNT(*) FROM events;"
```

### PostgreSQL (Development)
```bash
# Create database
sudo -u postgres createdb demo_data_dev
sudo -u postgres psql -d demo_data_dev -c "GRANT ALL PRIVILEGES ON DATABASE demo_data_dev TO crearis_admin;"
sudo -u postgres psql -d demo_data_dev -c "GRANT ALL ON SCHEMA public TO crearis_admin;"

# Start with PostgreSQL
DATABASE_TYPE=postgresql \
DATABASE_URL="postgresql://crearis_admin:password@localhost:5432/demo_data_dev" \
pnpm dev

# Check database
psql -U crearis_admin -d demo_data_dev -c "\dt"
psql -U crearis_admin -d demo_data_dev -c "SELECT COUNT(*) FROM events;"
```

### PostgreSQL (Testing)
```bash
# Recreate test database (clean slate)
sudo -u postgres dropdb demo_data_test
sudo -u postgres createdb demo_data_test
sudo -u postgres psql -d demo_data_test -c "GRANT ALL PRIVILEGES ON DATABASE demo_data_test TO crearis_admin;"
sudo -u postgres psql -d demo_data_test -c "GRANT ALL ON SCHEMA public TO crearis_admin;"

# Backup test database
pg_dump -U crearis_admin demo_data_test > backup_test.sql

# Restore test database
psql -U crearis_admin -d demo_data_test < backup_test.sql
```

## Testing Commands

### Run All Tests
```bash
# SQLite tests (default)
pnpm test

# Run tests and generate HTML report
pnpm test:run

# View HTML report
pnpm test:ui
# or
npx vite preview --outDir test-results
```

### Stage D: Compatibility Tests
```bash
# SQLite (default)
pnpm test:run tests/integration/stage-d-compatibility.test.ts

# PostgreSQL
TEST_DATABASE_TYPE=postgresql \
TEST_DATABASE_URL="postgresql://crearis_admin:password@localhost:5432/demo_data_test" \
pnpm test:run tests/integration/stage-d-compatibility.test.ts
```

### Stage E: Table Creation Tests
```bash
# PostgreSQL only
TEST_DATABASE_TYPE=postgresql \
TEST_DATABASE_URL="postgresql://crearis_admin:password@localhost:5432/demo_data_test" \
pnpm test:run tests/integration/postgres-tables.test.ts
```

### Watch Mode (Auto-rerun on changes)
```bash
# Watch all tests
pnpm test:watch

# Watch specific file
pnpm test:watch tests/integration/stage-d-compatibility.test.ts
```

## API Testing

### Manual API Testing
```bash
# Start server
pnpm dev

# Test endpoints
curl http://localhost:3000/api/demo/data
curl http://localhost:3000/api/tasks
curl http://localhost:3000/api/projects
curl http://localhost:3000/api/releases
curl http://localhost:3000/api/versions

# Create task
curl -X POST http://localhost:3000/api/tasks \
  -H "Content-Type: application/json" \
  -d '{"title":"Test task","description":"Test description"}'

# Create project
curl -X POST http://localhost:3000/api/projects \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Project","description":"Test description"}'
```

### Load Testing (Optional)
```bash
# Install ab (Apache Bench)
sudo apt install apache2-utils

# Test endpoint performance
ab -n 1000 -c 10 http://localhost:3000/api/demo/data

# PostgreSQL vs SQLite comparison
DATABASE_TYPE=sqlite pnpm dev &
ab -n 1000 -c 10 http://localhost:3000/api/demo/data > sqlite_results.txt
kill %1

DATABASE_TYPE=postgresql pnpm dev &
ab -n 1000 -c 10 http://localhost:3000/api/demo/data > postgres_results.txt
kill %1
```

## Development Workflow

### Fresh Start
```bash
# Clean everything
rm -rf .output .nitro dist node_modules/.vite demo-data.db test-results

# Reinstall
pnpm install

# Run tests
pnpm test:run

# Start development
pnpm dev
```

### PostgreSQL Fresh Start
```bash
# Drop and recreate database
sudo -u postgres dropdb demo_data_dev
sudo -u postgres createdb demo_data_dev
sudo -u postgres psql -d demo_data_dev -c "GRANT ALL PRIVILEGES ON DATABASE demo_data_dev TO crearis_admin;"
sudo -u postgres psql -d demo_data_dev -c "GRANT ALL ON SCHEMA public TO crearis_admin;"

# Start with PostgreSQL
DATABASE_TYPE=postgresql \
DATABASE_URL="postgresql://crearis_admin:password@localhost:5432/demo_data_dev" \
pnpm dev

# Sync data from CSV
curl -X POST http://localhost:3000/api/demo/sync
```

## PostgreSQL Configuration

### Enable/Disable Passwordless Login

#### Enable (Development)
```bash
# Backup config
sudo cp /etc/postgresql/12/main/pg_hba.conf /etc/postgresql/12/main/pg_hba.conf.backup

# Edit config (change peer/md5 to trust for local)
sudo nano /etc/postgresql/12/main/pg_hba.conf

# Restart PostgreSQL
sudo systemctl restart postgresql
```

#### Disable (Production)
```bash
# Restore config
sudo cp /etc/postgresql/12/main/pg_hba.conf.backup /etc/postgresql/12/main/pg_hba.conf

# Or manually edit to use md5/peer
sudo nano /etc/postgresql/12/main/pg_hba.conf

# Restart PostgreSQL
sudo systemctl restart postgresql
```

### PostgreSQL Service Management
```bash
# Check status
sudo systemctl status postgresql

# Start service
sudo systemctl start postgresql

# Stop service
sudo systemctl stop postgresql

# Restart service
sudo systemctl restart postgresql

# View logs
sudo journalctl -u postgresql -n 50
```

## Migration Scripts

### Run Migration Scripts
```bash
# Update imports (migrate-endpoints.sh)
bash migrate-endpoints.sh

# Convert to async (convert-db-calls.py)
python3 convert-db-calls.py
```

## Build & Deploy

### Development Build
```bash
# Build for development
pnpm run build

# Test build locally
DATABASE_TYPE=postgresql \
DATABASE_URL="postgresql://crearis_admin:password@localhost:5432/demo_data_dev" \
node .output/server/index.mjs
```

### Production Build
```bash
# Build for production
pnpm run build

# Set production environment variables
export DATABASE_TYPE=postgresql
export DATABASE_URL="postgresql://user:password@prod-host:5432/database"
export NODE_ENV=production

# Start production server
node .output/server/index.mjs
```

## Environment Variables

### Required
```bash
# Database type (default: sqlite)
DATABASE_TYPE=postgresql

# PostgreSQL connection string
DATABASE_URL=postgresql://user:password@host:5432/database

# SQLite database path (when using SQLite)
DATABASE_PATH=./demo-data.db
```

### Testing
```bash
# Test database type
TEST_DATABASE_TYPE=postgresql

# Test database URL
TEST_DATABASE_URL=postgresql://user:password@host:5432/test_db
```

### Optional
```bash
# Node environment
NODE_ENV=development|production

# Server port
PORT=3000
```

## Troubleshooting

### Database Connection Issues
```bash
# Test PostgreSQL connection
psql -U crearis_admin -d demo_data_dev -c "SELECT 1;"

# Check PostgreSQL is running
sudo systemctl status postgresql

# View PostgreSQL logs
sudo tail -f /var/log/postgresql/postgresql-12-main.log
```

### Test Failures
```bash
# Run tests with verbose output
pnpm test:run -- --reporter=verbose

# Run single test file
pnpm test:run tests/integration/postgres-tables.test.ts

# Check test database exists
psql -U crearis_admin -l | grep demo_data_test
```

### API Endpoint Issues
```bash
# Check server logs
pnpm dev  # Look for errors in console

# Test specific endpoint
curl -v http://localhost:3000/api/demo/data

# Check database has data
psql -U crearis_admin -d demo_data_dev -c "SELECT COUNT(*) FROM events;"
```

## Quick Health Check

```bash
# All-in-one health check script
echo "=== Database Health Check ==="
echo "SQLite database:"
ls -lh demo-data.db
echo ""
echo "PostgreSQL status:"
sudo systemctl status postgresql | grep Active
echo ""
echo "Test results:"
pnpm test:run --reporter=dot
echo ""
echo "API endpoints:"
curl -s http://localhost:3000/api/demo/data | head -c 100
```

## Useful Queries

### SQLite
```bash
# List all tables
sqlite3 demo-data.db ".tables"

# Table schema
sqlite3 demo-data.db ".schema events"

# Count records
sqlite3 demo-data.db "SELECT COUNT(*) FROM events;"

# Export to CSV
sqlite3 demo-data.db ".mode csv" ".output events.csv" "SELECT * FROM events;"
```

### PostgreSQL
```bash
# List all tables
psql -U crearis_admin -d demo_data_dev -c "\dt"

# Table schema
psql -U crearis_admin -d demo_data_dev -c "\d events"

# Count records
psql -U crearis_admin -d demo_data_dev -c "SELECT COUNT(*) FROM events;"

# Export to CSV
psql -U crearis_admin -d demo_data_dev -c "\copy events TO 'events.csv' CSV HEADER"
```
