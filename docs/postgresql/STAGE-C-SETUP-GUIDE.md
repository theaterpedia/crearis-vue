# Stage C: PostgreSQL Automated Setup Guide

**Quick, automated PostgreSQL setup for the demo-data project**

---

## 🎯 Overview

Stage C provides a fully automated PostgreSQL setup script that:
- ✅ Checks if PostgreSQL is installed and running
- ✅ Creates or validates your `.env` file with database configuration
- ✅ Tests the database connection
- ✅ Creates the database and user if needed (with your permission)
- ✅ Validates the complete setup

**Time Required:** 2-5 minutes (depending on whether PostgreSQL is already installed)

---

## 🚀 Quick Start

### One-Command Setup

```bash
bash scripts/setup-postgresql.sh
```

The script will guide you through the entire process interactively.

---

## 📋 Prerequisites

### What You Need

1. **PostgreSQL Server** (will be checked by script)
   - If not installed, see [Installation Guide](#postgresql-installation)
   
2. **Superuser Access** (only if creating new database/user)
   - Default PostgreSQL superuser: `postgres`
   - You'll be prompted for the password when needed

3. **Terminal Access**
   - Bash shell (Linux/macOS) or Git Bash (Windows)

---

## 🔧 What The Script Does

### Step 1: PostgreSQL Detection
```bash
# Checks if PostgreSQL is installed
which psql

# Checks if PostgreSQL server is running
pg_isready
```

**If not installed or running:** Script stops and provides installation instructions.

### Step 2: Environment Configuration
The script creates/validates `.env` file with these settings:

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_TYPE` | `postgresql` | Database engine to use |
| `DB_USER` | `crearis_admin` | PostgreSQL user name |
| `DB_PASSWORD` | *(required)* | User password (prompted twice) |
| `DB_NAME` | `crearis_admin` | Database name |
| `DB_HOST` | `localhost` | PostgreSQL server host |
| `DB_PORT` | `5432` | PostgreSQL server port |
| `DATABASE_URL` | *(generated)* | Full connection string |

**Interactive Prompts:**
- Username (press Enter for default)
- Password (required, must match confirmation)
- Database name (press Enter for default)
- Host (press Enter for default)
- Port (press Enter for default)

### Step 3: Connection Test
```bash
# Tests connection with provided credentials
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "SELECT 1"
```

**If successful:** ✅ Setup complete!  
**If fails:** Proceeds to Step 4

### Step 4: Database Creation (Optional)
If the database doesn't exist, the script:

1. **Asks for confirmation** to create database and user
2. **Prompts for PostgreSQL superuser credentials**
   - Username (default: `postgres`)
   - Password (not stored)
3. **Executes SQL commands** as superuser:
   ```sql
   CREATE USER crearis_admin WITH PASSWORD 'your_password';
   CREATE DATABASE crearis_admin OWNER crearis_admin;
   GRANT ALL PRIVILEGES ON DATABASE crearis_admin TO crearis_admin;
   ```
4. **Waits 3 seconds** for changes to propagate
5. **Retests connection** (Step 3 again)

---

## 📝 Detailed Usage

### Running the Script

```bash
# Make script executable (first time only)
chmod +x scripts/setup-postgresql.sh

# Run the script
./scripts/setup-postgresql.sh

# Or use bash directly
bash scripts/setup-postgresql.sh
```

### Example Session

```
🔍 Checking PostgreSQL installation...
✅ PostgreSQL is installed: /usr/bin/psql

🔍 Checking if PostgreSQL server is running...
✅ PostgreSQL server is running and accepting connections

📝 Setting up environment configuration...

.env file not found. Let's create it!

PostgreSQL Configuration
------------------------
Username [crearis_admin]: 
Password: ********
Confirm password: ********
Database name [crearis_admin]: 
Host [localhost]: 
Port [5432]: 

✅ Environment file created successfully!

🔗 Testing database connection...
❌ Cannot connect to database 'crearis_admin'

Would you like to create the database and user? (y/n): y

PostgreSQL Superuser Credentials
---------------------------------
These credentials are needed to create the database and user.
They will NOT be stored.

Superuser username [postgres]: 
Superuser password: ********

🔧 Creating database and user...
✅ User 'crearis_admin' created
✅ Database 'crearis_admin' created
✅ Privileges granted

⏳ Waiting 3 seconds for changes to propagate...

🔗 Retesting database connection...
✅ Successfully connected to PostgreSQL!

🎉 PostgreSQL setup complete!

Next steps:
1. Run: pnpm install
2. Run: pnpm dev
3. The application will create tables automatically
```

---

## 🔒 Security Notes

### Password Handling
- Passwords are entered using `read -s` (silent mode - not displayed)
- Superuser password is **never stored** - only used temporarily
- User password is stored in `.env` (should be in `.gitignore`)

### Best Practices
```bash
# Always add .env to .gitignore
echo ".env" >> .gitignore

# Set proper file permissions
chmod 600 .env

# Use different passwords for different environments
# - Development: simple password
# - Production: strong password (20+ characters)
```

### Environment File Location
```
demo-data/
├── .env                      # Created by script (git-ignored)
├── .env.database.example     # Template (committed to git)
├── scripts/
│   └── setup-postgresql.sh   # Setup script
└── ...
```

---

## 🛠️ PostgreSQL Installation

### Linux (Ubuntu/Debian)
```bash
# Install PostgreSQL
sudo apt update
sudo apt install postgresql postgresql-contrib

# Start PostgreSQL service
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Check status
sudo systemctl status postgresql
```

### Linux (Fedora/RHEL/CentOS)
```bash
# Install PostgreSQL
sudo dnf install postgresql-server postgresql-contrib

# Initialize database
sudo postgresql-setup --initdb

# Start PostgreSQL service
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### macOS (Homebrew)
```bash
# Install PostgreSQL
brew install postgresql@15

# Start PostgreSQL service
brew services start postgresql@15

# Or start manually
pg_ctl -D /usr/local/var/postgresql@15 start
```

### macOS (Postgres.app)
1. Download from https://postgresapp.com/
2. Move to Applications folder
3. Double-click to start
4. Click "Initialize" to create a server

### Windows
1. Download installer from https://www.postgresql.org/download/windows/
2. Run installer and follow wizard
3. Remember the superuser password you set
4. PostgreSQL service starts automatically

### Verify Installation
```bash
# Check if psql is available
psql --version

# Check if server is running
pg_isready

# Connect as superuser (to test)
psql -U postgres
```

---

## 🐛 Troubleshooting

### PostgreSQL Not Running

**Error:**
```
❌ PostgreSQL server is not running
```

**Solution:**
```bash
# Linux
sudo systemctl start postgresql
sudo systemctl status postgresql

# macOS (Homebrew)
brew services start postgresql@15

# macOS (Postgres.app)
# Just open the Postgres.app

# Check if it's running
pg_isready
```

### Connection Refused

**Error:**
```
psql: error: connection to server at "localhost" (::1), port 5432 failed: 
Connection refused
```

**Possible Causes:**
1. PostgreSQL not running (see above)
2. Wrong port number
3. PostgreSQL listening on different interface

**Solution:**
```bash
# Check PostgreSQL configuration
sudo cat /etc/postgresql/*/main/postgresql.conf | grep port

# Check if PostgreSQL is listening
sudo netstat -plnt | grep postgres

# Try connecting on different host
psql -h 127.0.0.1 -U postgres
```

### Authentication Failed

**Error:**
```
psql: error: connection to server at "localhost", port 5432 failed: 
FATAL: password authentication failed for user "crearis_admin"
```

**Solutions:**
1. **Wrong password:** Re-run script and enter correct password
2. **User doesn't exist:** Run script and allow database creation
3. **Authentication method issue:**
   ```bash
   # Check pg_hba.conf
   sudo nano /etc/postgresql/*/main/pg_hba.conf
   
   # Ensure this line exists:
   local   all   all   md5
   host    all   all   127.0.0.1/32   md5
   
   # Reload PostgreSQL
   sudo systemctl reload postgresql
   ```

### Database Already Exists

**Error:**
```
ERROR: database "crearis_admin" already exists
```

**Solution:**
This is actually fine! The script will connect to the existing database.
If you want to start fresh:
```bash
# Drop and recreate (WARNING: deletes all data)
psql -U postgres -c "DROP DATABASE crearis_admin;"
psql -U postgres -c "DROP USER crearis_admin;"

# Then re-run setup script
bash setup-postgresql.sh
```

### Permission Denied

**Error:**
```
ERROR: permission denied to create database
```

**Solution:**
You need to use PostgreSQL superuser credentials (usually `postgres`).
The script will prompt for these when creating the database.

### Port Already in Use

**Error:**
```
could not bind IPv4 address "127.0.0.1": Address already in use
```

**Solution:**
```bash
# Find what's using port 5432
sudo lsof -i :5432

# If it's another PostgreSQL instance, stop it
sudo systemctl stop postgresql

# Or use a different port in .env
DB_PORT=5433
```

---

## 🧪 Testing Your Setup

### Quick Test
```bash
# Test connection
psql -h localhost -p 5432 -U crearis_admin -d crearis_admin -c "SELECT version();"

# Should output PostgreSQL version info
```

### Full Application Test
```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev

# Application should start and create tables automatically
# Check http://localhost:3000 (or your configured port)
```

### Manual Database Check
```bash
# Connect to database
psql -h localhost -U crearis_admin -d crearis_admin

# List tables (after running app once)
\dt

# Exit
\q
```

---

## 🔄 Starting Over

If you need to completely reset:

```bash
# 1. Remove .env file
rm .env

# 2. Drop database and user (as superuser)
psql -U postgres <<EOF
DROP DATABASE IF EXISTS crearis_admin;
DROP USER IF EXISTS crearis_admin;
EOF

# 3. Re-run setup script
bash scripts/setup-postgresql.sh
```

---

## 📚 Related Documentation

- [Stage A: Database Infrastructure](./stage-a-complete.md)
- [Stage B: Testing Infrastructure](../vitest/stage-b-complete.md)
- [Stage D: Coverage & Validation](./README.md#stage-d)
- [Main Documentation Index](../INDEX.md)

---

## 💡 Tips & Best Practices

### Development Workflow
1. **Use SQLite for quick testing** - no setup needed
2. **Use PostgreSQL for production-like testing**
3. **Switch easily** via `DATABASE_TYPE` in `.env`

### Multiple Environments
```bash
# Development
.env.development
DATABASE_TYPE=postgresql
DB_NAME=crearis_dev

# Testing
.env.test
DATABASE_TYPE=postgresql
DB_NAME=crearis_test

# Production
.env.production
DATABASE_TYPE=postgresql
DB_NAME=crearis_prod
```

### Backup & Restore
```bash
# Backup database
pg_dump -U crearis_admin crearis_admin > backup.sql

# Restore database
psql -U crearis_admin crearis_admin < backup.sql
```

---

## ✅ Success Checklist

After running the script, verify:

- [ ] PostgreSQL is installed and running
- [ ] `.env` file exists with correct configuration
- [ ] Can connect using: `psql -h localhost -U crearis_admin -d crearis_admin`
- [ ] Application starts with: `pnpm dev`
- [ ] No connection errors in console
- [ ] Can access application in browser

---

## 📞 Getting Help

**If the script fails:**
1. Read the error message carefully
2. Check [Troubleshooting](#troubleshooting) section
3. Verify PostgreSQL is running: `pg_isready`
4. Check PostgreSQL logs:
   ```bash
   # Linux
   sudo tail -f /var/log/postgresql/postgresql-*-main.log
   
   # macOS (Homebrew)
   tail -f /usr/local/var/log/postgresql@15.log
   ```

**Common Issues:**
- PostgreSQL not installed → See [Installation](#postgresql-installation)
- Wrong password → Re-run script, enter password carefully
- Port conflict → Change `DB_PORT` in `.env`

---

**Stage C Status:** ✅ Complete  
**Last Updated:** October 15, 2025  
**Script:** `setup-postgresql.sh`  
**Time to Setup:** 2-5 minutes

🎉 **Happy Developing!**
