#!/usr/bin/env python3
"""
Fix Unsplash URLs in CSV files to include proper CORS parameters.

This script scans CSV files in server/data/base and server/data/root directories,
finds Unsplash image URLs, and adds CORS-friendly parameters to them.

Original format:
    https://images.unsplash.com/photo-xxx?w=1600&h=900&fit=crop

Updated format:
    https://images.unsplash.com/photo-xxx?w=1600&h=900&fit=crop&q=80&fm=jpg&crop=entropy&cs=tinysrgb

Usage:
    python fix-unsplash-urls.py
"""

import csv
import os
import re
from pathlib import Path
from typing import List, Tuple


def fix_unsplash_url(url: str) -> str:
    """
    Fix an Unsplash URL by adding CORS-friendly parameters.
    
    Args:
        url: Original Unsplash URL
        
    Returns:
        Fixed URL with CORS parameters
    """
    if not url or 'images.unsplash.com' not in url:
        return url
    
    # Check if URL already has the CORS parameters
    if 'fm=jpg' in url and 'cs=tinysrgb' in url:
        return url
    
    # Add CORS parameters if not present
    if '?' in url:
        # URL already has parameters
        if url.endswith('&'):
            url = url.rstrip('&')
        
        # Add missing parameters
        params_to_add = []
        if 'q=' not in url:
            params_to_add.append('q=80')
        if 'fm=' not in url:
            params_to_add.append('fm=jpg')
        if 'crop=' not in url and 'fit=crop' in url:
            params_to_add.append('crop=entropy')
        if 'cs=' not in url:
            params_to_add.append('cs=tinysrgb')
        
        if params_to_add:
            url = url + '&' + '&'.join(params_to_add)
    else:
        # No parameters at all
        url = url + '?q=80&fm=jpg&crop=entropy&cs=tinysrgb'
    
    return url


def process_csv_file(file_path: Path) -> Tuple[int, int]:
    """
    Process a single CSV file and fix Unsplash URLs.
    
    Args:
        file_path: Path to the CSV file
        
    Returns:
        Tuple of (rows_processed, urls_fixed)
    """
    rows_processed = 0
    urls_fixed = 0
    
    try:
        # Read the CSV file
        with open(file_path, 'r', encoding='utf-8', newline='') as f:
            reader = csv.reader(f)
            rows = list(reader)
        
        if not rows:
            return 0, 0
        
        # Process each row
        modified = False
        for row_idx, row in enumerate(rows):
            for col_idx, cell in enumerate(row):
                if 'images.unsplash.com' in cell:
                    original_url = cell
                    fixed_url = fix_unsplash_url(cell)
                    
                    if original_url != fixed_url:
                        rows[row_idx][col_idx] = fixed_url
                        urls_fixed += 1
                        modified = True
                        print(f"  Fixed URL in row {row_idx + 1}, column {col_idx + 1}")
                        print(f"    Before: {original_url[:80]}...")
                        print(f"    After:  {fixed_url[:80]}...")
            
            rows_processed += 1
        
        # Write back if modified
        if modified:
            with open(file_path, 'w', encoding='utf-8', newline='') as f:
                writer = csv.writer(f)
                writer.writerows(rows)
            print(f"  ✓ Updated {file_path}")
        else:
            print(f"  - No changes needed for {file_path}")
        
    except Exception as e:
        print(f"  ✗ Error processing {file_path}: {e}")
    
    return rows_processed, urls_fixed


def main():
    """Main function to process all CSV files."""
    print("=" * 70)
    print("Unsplash URL Fixer for CSV Files")
    print("=" * 70)
    print()
    
    # Define directories to scan
    base_dir = Path(__file__).parent
    directories = [
        base_dir / 'server' / 'data' / 'base',
        base_dir / 'server' / 'data' / 'root'
    ]
    
    total_files = 0
    total_rows = 0
    total_urls_fixed = 0
    
    for directory in directories:
        if not directory.exists():
            print(f"⚠ Directory not found: {directory}")
            continue
        
        print(f"Scanning directory: {directory}")
        print("-" * 70)
        
        # Find all CSV files
        csv_files = list(directory.glob('*.csv'))
        
        if not csv_files:
            print(f"  No CSV files found in {directory}")
            continue
        
        print(f"Found {len(csv_files)} CSV file(s)")
        print()
        
        for csv_file in csv_files:
            print(f"Processing: {csv_file.name}")
            rows, urls = process_csv_file(csv_file)
            total_files += 1
            total_rows += rows
            total_urls_fixed += urls
            print()
    
    # Summary
    print("=" * 70)
    print("SUMMARY")
    print("=" * 70)
    print(f"Files processed:  {total_files}")
    print(f"Total rows:       {total_rows}")
    print(f"URLs fixed:       {total_urls_fixed}")
    print()
    
    if total_urls_fixed > 0:
        print("✓ All Unsplash URLs have been updated with CORS parameters!")
        print("  The updated parameters include:")
        print("  - q=80          (quality)")
        print("  - fm=jpg        (format)")
        print("  - crop=entropy  (smart cropping)")
        print("  - cs=tinysrgb   (color space - enables CORS)")
    else:
        print("✓ No URLs needed to be updated.")
    print()


if __name__ == '__main__':
    main()
