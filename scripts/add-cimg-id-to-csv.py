#!/usr/bin/env python3
"""
Add cimg_id Fields to CSV Files

This script adds two new columns to CSV files in the root and base filesets:
1. cimg_id/id_nr - Default field for direct image ID references (empty by default)
2. cimg_id/id - Field for XML-key based image lookup (empty by default)

These fields will be populated later when the image system is fully integrated.

Usage:
    python3 scripts/add-cimg-id-to-csv.py
"""

import csv
import os
import sys
from pathlib import Path
from typing import List

# Define file paths
PROJECT_ROOT = Path(__file__).parent.parent
DATA_DIR = PROJECT_ROOT / "server" / "data"

# Files that need cimg_id fields
ROOT_FILES = ["projects.csv", "users.csv"]
BASE_FILES = ["events.csv", "posts.csv", "locations.csv", "instructors.csv", "children.csv", "teens.csv", "adults.csv"]

def add_cimg_id_fields(file_path: Path, fileset: str) -> None:
    """
    Add cimg_id/id_nr and cimg_id/id columns to a CSV file.
    
    Args:
        file_path: Path to the CSV file
        fileset: Name of the fileset (for logging)
    """
    if not file_path.exists():
        print(f"  ⚠️  File not found: {file_path}")
        return
    
    print(f"  📝 Processing: {file_path.name}")
    
    try:
        # Read the CSV file
        with open(file_path, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            fieldnames = reader.fieldnames
            rows = list(reader)
        
        if not fieldnames:
            print(f"    ❌ No headers found in {file_path.name}")
            return
        
        # Check if fields already exist
        if 'cimg_id/id_nr' in fieldnames and 'cimg_id/id' in fieldnames:
            print(f"    ℹ️  Fields already exist, skipping")
            return
        
        # Add new fields at the end if they don't exist
        new_fieldnames = list(fieldnames)
        if 'cimg_id/id_nr' not in new_fieldnames:
            new_fieldnames.append('cimg_id/id_nr')
        if 'cimg_id/id' not in new_fieldnames:
            new_fieldnames.append('cimg_id/id')
        
        # Add empty values for new fields in all rows
        for row in rows:
            if 'cimg_id/id_nr' not in row:
                row['cimg_id/id_nr'] = ''
            if 'cimg_id/id' not in row:
                row['cimg_id/id'] = ''
        
        # Write back to file
        with open(file_path, 'w', encoding='utf-8', newline='') as f:
            writer = csv.DictWriter(f, fieldnames=new_fieldnames)
            writer.writeheader()
            writer.writerows(rows)
        
        print(f"    ✅ Added cimg_id fields ({len(rows)} rows)")
        
    except Exception as e:
        print(f"    ❌ Error processing {file_path.name}: {e}")
        sys.exit(1)

def process_fileset(fileset_name: str, file_list: List[str]) -> None:
    """
    Process all files in a fileset.
    
    Args:
        fileset_name: Name of the fileset (root or base)
        file_list: List of CSV filenames to process
    """
    print(f"\n📦 Processing fileset: {fileset_name}")
    print("=" * 50)
    
    fileset_dir = DATA_DIR / fileset_name
    
    if not fileset_dir.exists():
        print(f"  ❌ Fileset directory not found: {fileset_dir}")
        return
    
    processed = 0
    for filename in file_list:
        file_path = fileset_dir / filename
        add_cimg_id_fields(file_path, fileset_name)
        processed += 1
    
    print(f"  ✓ Processed {processed} files in '{fileset_name}' fileset")

def main():
    """Main execution function."""
    print("🖼️  Adding cimg_id Fields to CSV Files")
    print("=" * 50)
    
    # Check if data directory exists
    if not DATA_DIR.exists():
        print(f"❌ Data directory not found: {DATA_DIR}")
        print("Please run this script from the project root directory.")
        sys.exit(1)
    
    # Process root fileset
    process_fileset("root", ROOT_FILES)
    
    # Process base fileset
    process_fileset("base", BASE_FILES)
    
    print("\n✅ All CSV files have been updated!")
    print("\n📋 Summary:")
    print(f"   Root files: {len(ROOT_FILES)}")
    print(f"   Base files: {len(BASE_FILES)}")
    print(f"   Total files: {len(ROOT_FILES) + len(BASE_FILES)}")
    print("\n💡 Next steps:")
    print("   1. Review the updated CSV files")
    print("   2. Populate cimg_id/id_nr with direct image IDs where needed")
    print("   3. Populate cimg_id/id with XML keys for image lookup where needed")
    print("   4. Run migration 022 to import the data")

if __name__ == "__main__":
    main()
