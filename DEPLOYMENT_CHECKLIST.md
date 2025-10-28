# 🚀 Deployment Checklist - Quick Reference

**Date:** October 28, 2025  
**Status:** Ready for Production  
**Build System:** Nitro 3.0 + Vite 5.4.21

---

## Pre-Deployment Verification

### ✅ Local Testing
- [ ] Database migrations tested: `pnpm db:rebuild`
- [ ] Production build successful: `pnpm build`
- [ ] Local production server runs: `pnpm start`
- [ ] All routes accessible (/, /login, /projects, /api/*)
- [ ] PASSWORDS.csv generated in `server/data/`

### ✅ Repository State
- [ ] All changes committed and pushed
- [ ] Branch: `beta_project` (or deployment branch)
- [ ] Tag created (optional): `v0.x.x`
- [ ] `.gitignore` includes: `PASSWORDS.csv`, `.env`, `.output/`, `server/public/`

---

## Phase 1: Repository Clone (as root)

```bash
# Run Phase 1 script
sudo bash /opt/crearis/scripts/server_deploy_phase1_clone.sh
```

**Creates:**
- `/opt/crearis/source/` - Git repository
- `/opt/crearis/live/` - Production runtime
- `/opt/crearis/data/` - Persistent data (mode 700)
- `/opt/crearis/logs/` - Application logs
- `/opt/crearis/backups/` - Database backups

**Manual Step:**
```bash
# Create .env file in source directory
sudo -u pruvious nano /opt/crearis/source/.env
# Configure: DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME
```

---

## Phase 2: Build & Deploy (as pruvious)

```bash
# Run Phase 2 script
sudo -u pruvious bash /opt/crearis/scripts/server_deploy_phase2_build.sh
```

**Actions:**
1. ✅ Test database connection
2. ✅ Create database if needed
3. ✅ Install dependencies: `pnpm install`
4. ✅ Run migrations: Database schema + seed data
5. ✅ Build application:
   - Vite → `server/public/`
   - Nitro → `.output/`
6. ✅ Sync to live: `rsync .output/ → /opt/crearis/live/`
7. ✅ Create symlink: `live/server/data → /opt/crearis/data`
8. ✅ Copy data files (preserves existing)
9. ✅ Secure permissions:
   - `chmod 700 /opt/crearis/data`
   - `chmod 600 /opt/crearis/data/PASSWORDS.csv`
10. ✅ Generate PM2 config with `NODE_ENV=production`

**Verify:**
```bash
# Check symlink
ls -la /opt/crearis/live/server/data
# Should show: data -> /opt/crearis/data

# Check PASSWORDS.csv
ls -la /opt/crearis/data/PASSWORDS.csv
# Should show: -rw------- (600 permissions)

# Count users in PASSWORDS.csv
wc -l /opt/crearis/data/PASSWORDS.csv
# Should show: 24 (header + 6 system + 17 CSV users)
```

---

## Phase 3: Start Application (as pruvious)

```bash
cd /opt/crearis/live

# Stop old process if exists
pm2 delete crearis-vue 2>/dev/null || true

# Start new process
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Enable PM2 on system boot
pm2 startup
# Follow the printed command (run as root)
```

**Verify:**
```bash
# Check PM2 status
pm2 status

# View logs
pm2 logs crearis-vue --lines 50

# Test application
curl http://localhost:3000/
# Should return HTML with Vue app

# Test API
curl http://localhost:3000/api/status/all
# Should return JSON
```

---

## Post-Deployment: Password Distribution

### 🔐 Security Critical Steps

1. **Secure Copy of PASSWORDS.csv**
   ```bash
   # From server (as pruvious)
   cd /opt/crearis/data
   
   # Create encrypted backup
   tar -czf passwords-$(date +%Y%m%d).tar.gz PASSWORDS.csv
   gpg --encrypt --recipient admin@example.com passwords-*.tar.gz
   
   # Copy to local machine
   scp pruvious@server:/opt/crearis/data/passwords-*.tar.gz.gpg ./
   ```

2. **Distribution Method Options**
   - Encrypted email attachment
   - Password manager (1Password, Bitwarden, etc.)
   - Secure file sharing (Tresorit, SpiderOak, etc.)
   - In-person USB transfer (for high security)

3. **User Instructions**
   - Each user gets their specific password from PASSWORDS.csv
   - Format: `sysmail,extmail,password`
   - System users: admin@theaterpedia.org, base@theaterpedia.org, etc.
   - **Must change password on first login**

4. **Post-Distribution Cleanup**
   ```bash
   # Option 1: Delete PASSWORDS.csv (recommended)
   rm /opt/crearis/data/PASSWORDS.csv
   
   # Option 2: Encrypt PASSWORDS.csv
   gpg --encrypt --recipient admin@example.com /opt/crearis/data/PASSWORDS.csv
   rm /opt/crearis/data/PASSWORDS.csv
   mv /opt/crearis/data/PASSWORDS.csv.gpg /opt/crearis/backups/
   
   # Keep encrypted backup in secure location
   ```

---

## Phase 4: Domain & SSL (as root)

```bash
# Run Phase 3 script
sudo bash /opt/crearis/scripts/server_deploy_phase3_domain.sh
```

**Actions:**
- Configure Nginx reverse proxy
- Set up SSL certificates (Let's Encrypt)
- Configure domain routing

---

## Troubleshooting

### Issue: Routes return 404 or serve Vite dev server

**Cause:** `NODE_ENV` not set to production

**Fix:**
```bash
# Check PM2 environment
pm2 show crearis-vue | grep NODE_ENV
# Should show: NODE_ENV: 'production'

# If wrong, regenerate ecosystem.config.js:
cd /opt/crearis/source
sudo -u pruvious bash /opt/crearis/scripts/server_deploy_phase2_build.sh
# (It will regenerate config without rebuilding if .output exists)
```

### Issue: "Cannot find module" errors

**Cause:** Dependencies not installed or wrong Node version

**Fix:**
```bash
cd /opt/crearis/source
node --version  # Should be >= 20.10.0
pnpm install --frozen-lockfile
```

### Issue: Symlink broken

**Cause:** Symlink not created or wrong path

**Fix:**
```bash
cd /opt/crearis/live
rm -rf server/data
ln -sfn /opt/crearis/data server/data
ls -la server/data  # Verify symlink
```

### Issue: Database connection failed

**Cause:** Wrong credentials or PostgreSQL not running

**Fix:**
```bash
# Check PostgreSQL
sudo systemctl status postgresql

# Test connection
PGPASSWORD=yourpass psql -h localhost -U crearis_admin -d crearis_db -c '\q'

# Check .env file
cat /opt/crearis/source/.env | grep DB_
```

### Issue: Build fails with "publicAssets" error

**Cause:** Old Nitro version or wrong config

**Fix:**
```bash
cd /opt/crearis/source
pnpm update nitro@latest
# Check nitro.config.ts has publicAssets configuration
```

---

## Update/Redeploy Procedure

```bash
# 1. Pull latest code (as pruvious)
cd /opt/crearis/source
git fetch origin
git checkout beta_project
git pull origin beta_project

# 2. Rebuild (as pruvious)
pnpm install --frozen-lockfile
pnpm build

# 3. Sync to live
rsync -av --delete .output/ /opt/crearis/live/

# 4. Verify symlink still exists
ls -la /opt/crearis/live/server/data

# 5. Restart application
cd /opt/crearis/live
pm2 restart crearis-vue

# 6. Verify
pm2 logs crearis-vue --lines 20
curl http://localhost:3000/
```

**Note:** Data files (`/opt/crearis/data/`) are NOT overwritten during updates.

---

## Rollback Procedure

```bash
# 1. Stop current version
pm2 stop crearis-vue

# 2. Checkout previous version
cd /opt/crearis/source
git checkout <previous-tag-or-commit>

# 3. Rebuild
pnpm install --frozen-lockfile
pnpm build

# 4. Sync to live
rsync -av --delete .output/ /opt/crearis/live/

# 5. Restart
cd /opt/crearis/live
pm2 restart crearis-vue
```

---

## Critical Files Reference

### Must Exist After Deployment

```
/opt/crearis/
├── source/.env                       # Database credentials
├── live/
│   ├── server/
│   │   ├── index.mjs                # Nitro entry point
│   │   └── data -> /opt/crearis/data # SYMLINK
│   ├── public/index.html            # Vue SPA
│   └── ecosystem.config.js          # PM2 config (NODE_ENV=production)
└── data/
    ├── PASSWORDS.csv (600)          # Passwords for distribution
    ├── root/users.csv               # Root fileset
    └── base/events.csv              # Base fileset
```

### File Permissions

```bash
/opt/crearis/data/                   # drwx------ (700)
/opt/crearis/data/PASSWORDS.csv      # -rw------- (600)
/opt/crearis/live/.env               # -rw------- (600)
/opt/crearis/live/server/data        # lrwxrwxrwx (symlink)
```

---

## Support Documentation

- **Build System:** [docs/NITRO_3_BUILD_SUCCESS.md](docs/NITRO_3_BUILD_SUCCESS.md)
- **Password System:** [docs/PASSWORD_SYSTEM.md](docs/PASSWORD_SYSTEM.md)
- **Full Deployment:** [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)
- **Database Schema:** [docs/DATABASE_SCHEMA.md](docs/DATABASE_SCHEMA.md)

---

## Emergency Contacts

- System Admin: admin@theaterpedia.org
- Database Backup: `/opt/crearis/backups/`
- Logs: `/opt/crearis/logs/`
- PM2 Logs: `pm2 logs crearis-vue`

---

**Last Updated:** October 28, 2025  
**Deployment System:** Nitro 3.0 Build + PostgreSQL 12+  
**Node.js:** >= 20.10.0 Required
