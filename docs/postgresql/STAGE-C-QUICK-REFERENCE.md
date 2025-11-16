# Stage C: PostgreSQL Setup - Quick Reference

**One-command PostgreSQL setup for demo-data**

---

## 🚀 Quick Commands

```bash
# Run automated setup
bash scripts/setup-postgresql.sh

# Test connection manually
psql -h localhost -U crearis_admin -d crearis_admin

# Reset and start over
rm .env && bash scripts/setup-postgresql.sh

# Check PostgreSQL status
pg_isready
```

---

## 📝 What the Script Does

1. ✅ Checks PostgreSQL is installed and running
2. ✅ Creates `.env` file with your configuration
3. ✅ Tests database connection
4. ✅ Creates database and user (if needed, with permission)

---

## ⚙️ Configuration Defaults

| Setting | Default Value |
|---------|---------------|
| Username | `crearis_admin` |
| Database | `crearis_admin` |
| Host | `localhost` |
| Port | `5432` |

**Password:** Must be provided (no default)

---

## 🔧 Common Issues

### PostgreSQL Not Running
```bash
# Linux
sudo systemctl start postgresql

# macOS (Homebrew)
brew services start postgresql@15
```

### Connection Refused
```bash
# Check if PostgreSQL is listening
pg_isready

# Check port
sudo netstat -plnt | grep 5432
```

### Authentication Failed
- Wrong password → Re-run script
- User doesn't exist → Allow script to create database

---

## 📚 Documentation

- **Full Guide:** `docs/postgresql/STAGE-C-SETUP-GUIDE.md`
- **Complete Details:** `docs/postgresql/stage-c-complete.md`
- **PostgreSQL Docs:** `docs/postgresql/README.md`

---

## ✅ Success Checklist

After running script:
- [ ] No errors shown
- [ ] "PostgreSQL Setup Complete!" message displayed
- [ ] Can run: `pnpm dev` without errors
- [ ] Application starts successfully

---

**Time Required:** 2-5 minutes  
**Status:** ✅ Production Ready  
**Last Updated:** October 15, 2025
