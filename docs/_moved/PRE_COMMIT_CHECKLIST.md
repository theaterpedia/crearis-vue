# Pre-Commit Checklist

Before committing to GitHub, verify:

## ✅ Code Quality
- [ ] All files follow project code style
- [ ] No console.log or debug code left in
- [ ] TypeScript compiles without errors
- [ ] No TODO or FIXME comments without issue references

## ✅ Build & Test
- [ ] `pnpm install` runs successfully
- [ ] `pnpm run build` completes without errors
- [ ] Build output exists in `.output/` directory
- [ ] Production server starts: `node .output/server/index.mjs`
- [ ] API endpoints respond correctly

## ✅ Documentation
- [ ] README.md is up to date
- [ ] CHANGELOG.md includes new changes
- [ ] API endpoints are documented
- [ ] Environment variables are documented

## ✅ Configuration Files
- [ ] .gitignore includes all necessary patterns
- [ ] package.json has correct metadata
- [ ] Dependencies are up to date
- [ ] No sensitive data in any files

## ✅ Git Hygiene
- [ ] .gitignore excludes build artifacts (.output/, dist/, node_modules/)
- [ ] .gitignore excludes database files (*.db)
- [ ] .gitignore excludes environment files (.env*)
- [ ] Only source files are tracked

## ✅ Ready to Commit
```bash
# Add all files
git add .

# Review changes
git status
git diff --cached

# Commit with descriptive message
git commit -m "Initial commit: Standalone demo-data server

Extracted from crearis-nuxt monorepo and transformed into standalone server application with Nitro, Vue 3, and SQLite."

# Push to GitHub
git push origin main
```

## 🚀 Post-Commit
- [ ] Verify GitHub Actions CI passes
- [ ] Create a release tag (v0.1.0)
- [ ] Update GitHub repository description
- [ ] Add topics to GitHub repo (vue, nitro, server, sqlite, etc.)
