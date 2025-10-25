#!/usr/bin/env python3
"""
Update events.csv to format the 'name' field with pattern:
"Overline Overline **Headline Headline**"
"""

import csv
import re

INPUT_FILE = 'server/data/base/events.csv'
OUTPUT_FILE = 'server/data/base/events.csv'

def format_name(name):
    """
    Convert a name like "Forum-Theater: Konflikte im Alltag"
    to "Forum-Theater **Konflikte im Alltag**"
    
    Split on colon or dash, first part is overline, second is headline (bold)
    """
    if not name:
        return name
    
    # Try splitting on colon first
    if ':' in name:
        parts = name.split(':', 1)
        overline = parts[0].strip()
        headline = parts[1].strip()
        return f"{overline} **{headline}**"
    
    # If no colon, try splitting on dash (but be careful with compound words)
    # For now, if no colon, just make the whole thing bold
    return f"**{name}**"

def main():
    # Read the CSV file
    rows = []
    with open(INPUT_FILE, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        fieldnames = reader.fieldnames
        
        for row in reader:
            # Update the name field
            if row['name']:
                row['name'] = format_name(row['name'])
            rows.append(row)
    
    # Write back to CSV
    with open(OUTPUT_FILE, 'w', encoding='utf-8', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)
    
    print(f"✓ Updated {len(rows)} events in {OUTPUT_FILE}")
    print("\nSample transformations:")
    for i, row in enumerate(rows[:3], 1):
        print(f"  {i}. {row['name']}")

if __name__ == '__main__':
    main()
