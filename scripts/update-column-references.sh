#!/bin/bash
# Update all *_val column references in composables and components

echo "Updating *_val column references to non-suffixed names..."

# Find all TypeScript/Vue files in src/ that contain *_val references
files=$(grep -rl '\(status_val\|config_val\|ctags_val\|rtags_val\|ttags_val\|dtags_val\)' src/)

for file in $files; do
    echo "Processing: $file"
    
    # Create backup
    cp "$file" "$file.bak"
    
    # Replace column names (being careful with context)
    # Only replace in property access and parameter contexts
    sed -i 's/\.status_val/.status/g' "$file"
    sed -i 's/\.config_val/.config/g' "$file"
    sed -i 's/\.ctags_val/.ctags/g' "$file"
    sed -i 's/\.rtags_val/.rtags/g' "$file"
    sed -i 's/\.ttags_val/.ttags/g' "$file"
    sed -i 's/\.dtags_val/.dtags/g' "$file"
    
    # Replace in object literals and type definitions
    sed -i 's/\bstatus_val:/status:/g' "$file"
    sed -i 's/\bconfig_val:/config:/g' "$file"
    sed -i 's/\bctags_val:/ctags:/g' "$file"
    sed -i 's/\brtags_val:/rtags:/g' "$file"
    sed -i 's/\bttags_val:/ttags:/g' "$file"
    sed -i 's/\bdtags_val:/dtags:/g' "$file"
    
    # Replace as parameters
    sed -i 's/\bstatus_val\?:/status?:/g' "$file"
    sed -i 's/\bconfig_val\?:/config?:/g' "$file"
    sed-i 's/\bctags_val\?:/ctags?:/g' "$file"
    sed -i 's/\brtags_val\?:/rtags?:/g' "$file"
    sed -i 's/\bttags_val\?:/ttags?:/g' "$file"
    sed -i 's/\bdtags_val\?:/dtags?:/g' "$file"
    
    # Replace in query parameters (URLSearchParams context)
    sed -i "s/'status_val'/'status'/g" "$file"
    sed -i "s/'config_val'/'config'/g" "$file"
    sed -i "s/'ctags_val'/'ctags'/g" "$file"
    sed -i "s/'rtags_val'/'rtags'/g" "$file"
    sed -i "s/'ttags_val'/'ttags'/g" "$file"
    sed -i "s/'dtags_val'/'dtags'/g" "$file"
    
    echo "  ✓ Updated $file"
done

echo ""
echo "✅ Column reference update complete"
echo "Backups created with .bak extension"
echo ""
echo "Review changes and remove backups if satisfied:"
echo "  find src/ -name '*.bak' -delete"
