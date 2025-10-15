#!/usr/bin/env python3
"""
Script to convert API endpoints from sync db calls to async db-new calls
"""

import re
import sys
from pathlib import Path

def convert_file(filepath):
    """Convert a TypeScript API file to use async db calls"""
    print(f"Converting: {filepath}")
    
    with open(filepath, 'r') as f:
        content = f.read()
    
    original = content
    
    # 1. Make event handler async if it uses await
    if 'await db.' in content or 'defineEventHandler((' in content:
        content = re.sub(
            r'defineEventHandler\(\(event\) =>',
            'defineEventHandler(async (event) =>',
            content
        )
        content = re.sub(
            r'defineEventHandler\(\(\) =>',
            'defineEventHandler(async () =>',
            content
        )
    
    # 2. Convert db.prepare().all() to await db.all()
    content = re.sub(
        r'db\.prepare\((.*?)\)\.all\((.*?)\)',
        r'await db.all(\1, [\2])',
        content
    )
    
    # 3. Convert db.prepare().get() to await db.get()
    content = re.sub(
        r'db\.prepare\((.*?)\)\.get\((.*?)\)',
        r'await db.get(\1, [\2])',
        content
    )
    
    # 4. Convert db.prepare().run() to await db.run()
    content = re.sub(
        r'db\.prepare\((.*?)\)\.run\((.*?)\)',
        r'await db.run(\1, [\2])',
        content
    )
    
    # 5. Handle cases where .all() or .get() have no parameters
    content = content.replace('await db.all(sql, [])', 'await db.all(sql)')
    content = content.replace('await db.get(sql, [])', 'await db.get(sql)')
    content = content.replace('await db.all(sql, [...params])', 'await db.all(sql, params)')
    content = content.replace('await db.get(sql, [...params])', 'await db.get(sql, params)')
    content = content.replace('await db.run(sql, [...params])', 'await db.run(sql, params)')
    
    # Write back if changed
    if content != original:
        with open(filepath, 'w') as f:
            f.write(content)
        print(f"  ✅ Converted")
        return True
    else:
        print(f"  ⏭️  No changes needed")
        return False

def main():
    # Find all TypeScript files in server/api
    api_dir = Path('server/api')
    ts_files = list(api_dir.rglob('*.ts'))
    
    converted = 0
    for filepath in ts_files:
        if 'node_modules' not in str(filepath):
            if convert_file(filepath):
                converted += 1
    
    print(f"\n✅ Converted {converted} files")

if __name__ == '__main__':
    main()
