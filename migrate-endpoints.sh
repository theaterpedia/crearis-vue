#!/bin/bash

# Script to migrate API endpoints from db.ts to db-new.ts
# This updates import statements and converts sync to async calls

echo "🔄 Migrating API endpoints to db-new.ts..."

# Function to convert a file
convert_file() {
    local file="$1"
    echo "  Converting: $file"
    
    # Replace import statement
    sed -i "s/import db from '.*database\/db'/import { db } from '..\/..\/database\/db-new'/g" "$file"
    sed -i "s/import db from '\.\.\/\.\.\/database\/db'/import { db } from '..\/..\/database\/db-new'/g" "$file"
    sed -i "s/import db from '\.\.\/\.\.\/\.\.\/database\/db'/import { db } from '..\/..\/..\/database\/db-new'/g" "$file"
    
    # Convert db.prepare(...).run(...) to await db.run(..., [...])
    # This is complex, so we'll do manual conversion for critical files
}

# Migrate tasks endpoints
for file in server/api/tasks/*.ts; do
    if [ -f "$file" ]; then
        convert_file "$file"
    fi
done

# Migrate releases endpoints  
for file in server/api/releases/*.ts; do
    if [ -f "$file" ]; then
        convert_file "$file"
    fi
done

# Migrate projects endpoints
for file in server/api/projects/*.ts; do
    if [ -f "$file" ]; then
        convert_file "$file"
    fi
done

# Migrate versions endpoints
for file in server/api/versions/*.ts; do
    if [ -f "$file" ]; then
        convert_file "$file"
    fi
done

for file in server/api/versions/[id]/*.ts; do
    if [ -f "$file" ]; then
        convert_file "$file"
    fi
done

# Migrate auth endpoints
for file in server/api/auth/*.ts; do
    if [ -f "$file" ]; then
        convert_file "$file"
    fi
done

echo "✅ Import statements updated. Manual async conversion still needed for database calls."
echo "📝 Files that need manual review:"
find server/api -name "*.ts" -exec grep -l "db\.prepare" {} \;
