# Deployment and rebuild: Short status

both deployment scripts (source/scripts)
- server_deploy_phase2_build.sh
- server_deploy_phase2a_build.sh:

include an **Interactive Prompt:**
- When you run the script, it now asks: "Enter choice [1-2]:"
  - **Option 1: Fresh Install** - Full setup (database, migrations, PM2, data files)
  - **Option 2: Rebuild Only** - Just rebuild (dependencies, build, sync)

**Rebuild Mode Safeguard:**
- When you select "Rebuild Only", it warns you about the manual step
- Asks for confirmation: "Have you removed the symlink? (yes/no):"
- Only proceeds if you confirm "yes"

**What Each Mode Executes:**

**Fresh Install (Option 1):**
```bash
create_database
install_dependencies
setup_source_data_symlink
run_migrations
run_migration_021  # (only in phase2_build.sh)
build_application
sync_to_live
setup_output_structure
copy_data_files
create_import_directory
setup_pm2
```

**Rebuild Only (Option 2):**
```bash
install_dependencies
setup_source_data_symlink  # Recreates the symlink
build_application
sync_to_live
```

The rebuild mode only executes the essential build steps and skips all database/PM2/data setup operations.
