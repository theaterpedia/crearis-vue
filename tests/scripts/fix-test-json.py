#!/usr/bin/env python3
"""
Fix JSON text fields in i18n test files.

Converts TypeScript object literals to JSON strings:
  text: { de: 'ok', en: 'ok' }  ->  text: '{"de":"ok","en":"ok"}'
"""

import re
import sys

def ts_object_to_json_string(ts_obj):
    """Convert TypeScript object literal to JSON string."""
    # Remove outer braces and split by commas
    ts_obj = ts_obj.strip()[1:-1]  # Remove { }
    
    # Match key: 'value' or key: "value" patterns
    pairs = re.findall(r"(\w+):\s*['\"]([^'\"]+)['\"]", ts_obj)
    
    # Build JSON string
    json_pairs = [f'"{key}":"{value}"' for key, value in pairs]
    return '{' + ','.join(json_pairs) + '}'

def fix_json_in_line(line):
    """Fix JSON text fields in a single line."""
    # Pattern: text: { key: 'value', ... }
    pattern = r"text:\s*\{([^}]+)\}"
    
    def replacer(match):
        ts_obj = '{' + match.group(1) + '}'
        json_str = ts_object_to_json_string(ts_obj)
        return f"text: '{json_str}'"
    
    # Only replace if not already a string
    if "text: '" in line or 'text: "' in line:
        return line  # Already fixed
    
    return re.sub(pattern, replacer, line)

def process_file(filepath):
    """Process a test file and fix JSON formatting."""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        lines = content.split('\n')
        modified = False
        new_lines = []
        
        for line in lines:
            if 'text:' in line and '{' in line and "text: '" not in line and 'text: "' not in line:
                new_line = fix_json_in_line(line)
                if new_line != line:
                    modified = True
                    print(f"Fixed line in {filepath}")
                new_lines.append(new_line)
            else:
                new_lines.append(line)
        
        if modified:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write('\n'.join(new_lines))
            print(f"✓ Updated {filepath}\n")
            return True
        else:
            print(f"✓ No changes needed in {filepath}\n")
            return False
            
    except Exception as e:
        print(f"✗ Error processing {filepath}: {e}", file=sys.stderr)
        return False

def main():
    files = [
        'tests/unit/i18n-composable.test.ts',
        'tests/integration/i18n-api.test.ts'
    ]
    
    print("Fixing JSON formatting in i18n test files...\n")
    
    total_modified = 0
    for filepath in files:
        if process_file(filepath):
            total_modified += 1
    
    print(f"Summary: Modified {total_modified} of {len(files)} files")
    return 0

if __name__ == '__main__':
    sys.exit(main())
