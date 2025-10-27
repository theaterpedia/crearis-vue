# Project Renaming Guide: demo-data → crearis-vue

This document provides instructions for completing the repository rename from `demo-data` to `crearis-vue`.

## ✅ Completed Changes

The following files have been updated with the new project name:

### Core Configuration
- ✅ `package.json` - Updated name, description, URLs, and keywords
- ✅ `README.md` - Updated title, description, URLs, and project structure
- ✅ `CHANGELOG.md` - Updated release links
- ✅ `src/types.ts` - Updated file header comment
- ✅ `scripts/setup-postgresql.sh` - Updated script title
- ✅ `.gitignore` - Added new database filename pattern
- ✅ `.env.database.example` - Updated SQLite path example

### Documentation Updates
- Enhanced package description to reflect full feature set
- Added comprehensive features list
- Updated project structure to show all major directories
- Improved keywords for better discoverability

## 🔄 Steps to Complete Repository Rename

### 1. Rename Local Working Directory

```bash
# Navigate to parent directory
cd /home/persona/crearis/

# Rename the project folder
mv demo-data crearis-vue

# Navigate into the renamed directory
cd crearis-vue
```

### 2. Rename GitHub Repository

**Option A: Via GitHub Web Interface (Recommended)**

1. Go to https://github.com/theaterpedia/demo-data
2. Click on **Settings** tab
3. Scroll down to the **Danger Zone** section
4. Click **Rename repository**
5. Enter new name: `crearis-vue`
6. Click **I understand, rename repository**

GitHub will automatically:
- Set up redirects from old URLs
- Update all clone URLs
- Preserve all issues, PRs, and stars

**Option B: Via GitHub CLI**

```bash
gh repo rename crearis-vue --repo theaterpedia/demo-data
```

### 3. Update Git Remote URL (After GitHub Rename)

```bash
# Check current remote
git remote -v

# Update to new URL
git remote set-url origin git@github.com:theaterpedia/crearis-vue.git

# Verify the change
git remote -v
```

### 4. Update Local Git Configuration

```bash
# Optional: Update local branch tracking
git branch --unset-upstream
git branch -u origin/beta_project
```

### 5. Reinstall Dependencies (Optional but Recommended)

```bash
# Clear any cached references
rm -rf node_modules
rm pnpm-lock.yaml

# Reinstall with new package name
pnpm install
```

## 📝 Post-Rename Checklist

- [ ] Rename local working directory from `demo-data` to `crearis-vue`
- [ ] Rename GitHub repository to `crearis-vue`
- [ ] Update git remote URL
- [ ] Pull latest changes: `git pull`
- [ ] Test development server: `pnpm dev`
- [ ] Verify all links in README.md work
- [ ] Update any external documentation or wiki references
- [ ] Notify team members of the new repository URL
- [ ] Update CI/CD pipelines (if any) with new repository name
- [ ] Update deployment configurations with new repository URLs

## 🔗 New URLs

After renaming, the repository will be available at:

- **Repository**: https://github.com/theaterpedia/crearis-vue
- **Clone URL (HTTPS)**: https://github.com/theaterpedia/crearis-vue.git
- **Clone URL (SSH)**: git@github.com:theaterpedia/crearis-vue.git
- **Issues**: https://github.com/theaterpedia/crearis-vue/issues

## ⚠️ Important Notes

### GitHub Automatic Redirects
- GitHub automatically redirects from old URLs to new ones
- Old clone URLs will continue to work
- Issues and PR links remain valid
- Stars, watchers, and forks are preserved

### Database Files
- SQLite database files are not renamed automatically
- New installations will use `crearis-vue.db`
- Existing `demo-data.db` files will continue to work
- Both patterns are in `.gitignore` for compatibility

### Breaking Changes
- NPM package name changed from `crearis-demo-data` to `crearis-vue`
- If this package is used as a dependency, dependents need to update

## 🎯 Why This Rename?

The new name `crearis-vue` better reflects the project's current state:

1. **More Descriptive**: Not just demo data, but a full application
2. **Technology Clear**: Indicates Vue.js framework
3. **Brand Alignment**: Matches the Crearis project family
4. **Professional**: Better suited for production use
5. **Comprehensive**: Reflects the rich feature set (150+ components, auth, project management, etc.)

## 📚 Additional Resources

- [GitHub Repository Renaming Guide](https://docs.github.com/en/repositories/creating-and-managing-repositories/renaming-a-repository)
- [Git Remote Management](https://git-scm.com/docs/git-remote)

---

**Date**: October 27, 2025
**Branch**: beta_project
**Status**: Ready for repository rename
