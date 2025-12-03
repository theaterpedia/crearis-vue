# MR3: Export API & Admin UI

**Status**: 🔴 Not Started  
**Estimated Time**: 1-2 hours  
**Prerequisites**: [MR2: Export System & JSON Schema](./MR2_EXPORT_SYSTEM.md)  
**Next Step**: [MR4: Import System & Data Packages](./MR4_IMPORT_SYSTEM.md)

---

## 🎯 Objective

Create API endpoint and admin UI for triggering database exports. Users can click a button in ImagesCoreAdmin to create backup tarballs for master-slave synchronization.

---

## 📋 Tasks

### Task 1: Create Export API Endpoint (30 min)

**File**: `server/api/admin/backup/export.post.ts`

```typescript
import { exportAllTables, createBackupTarball } from '~/server/database/backup/export'
import { db } from '~/server/database/db-new'
import path from 'path'

export default defineEventHandler(async (event) => {
  try {
    const dataPath = path.join(process.cwd(), 'data')
    
    console.log('🚀 Starting backup export...')
    const index = await exportAllTables(db, dataPath)
    
    console.log('📦 Creating tarball...')
    const tarFile = await createBackupTarball(dataPath, index)
    
    return {
      success: true,
      backup: {
        timestamp: index.created_at,
        tables: index.tables,
        total_records: index.metadata.total_records,
        tar_file: path.basename(tarFile),
        full_path: tarFile
      }
    }
  } catch (error: any) {
    console.error('❌ Backup export failed:', error)
    return {
      success: false,
      error: error.message
    }
  }
})
```

**Validation**:
```bash
curl -X POST http://localhost:3000/api/admin/backup/export
```

---

### Task 2: Add Export UI to ImagesCoreAdmin (30 min)

**File**: `src/views/admin/ImagesCoreAdmin.vue`

Find the "Import Images" section and add after it:

```vue
<!-- System Backup Section -->
<section class="data-section backup-section">
  <h2>🗄️ System Backup</h2>
  <p class="section-description">
    Export database to JSON tarball for master-slave sync
  </p>
  
  <button 
    @click="handleExportBackup" 
    :disabled="exportingBackup"
    class="btn-export"
  >
    {{ exportingBackup ? '⏳ Exporting...' : '📦 Create Backup' }}
  </button>
  
  <div v-if="lastBackup" class="backup-info">
    <h3>Last Backup</h3>
    <dl>
      <dt>Timestamp:</dt>
      <dd>{{ formatTimestamp(lastBackup.timestamp) }}</dd>
      
      <dt>Tables:</dt>
      <dd>{{ lastBackup.tables.join(', ') }}</dd>
      
      <dt>Records:</dt>
      <dd>{{ lastBackup.total_records.toLocaleString() }}</dd>
      
      <dt>File:</dt>
      <dd><code>{{ lastBackup.tar_file }}</code></dd>
    </dl>
  </div>
  
  <div v-if="exportError" class="error-message">
    ❌ Export failed: {{ exportError }}
  </div>
</section>
```

Add to `<script setup>`:

```typescript
const exportingBackup = ref(false)
const lastBackup = ref<any>(null)
const exportError = ref<string | null>(null)

const handleExportBackup = async () => {
  exportingBackup.value = true
  exportError.value = null
  
  try {
    const response = await fetch('/api/admin/backup/export', {
      method: 'POST'
    })
    const result = await response.json()
    
    if (result.success) {
      lastBackup.value = result.backup
      alert(`✅ Backup created: ${result.backup.tar_file}`)
    } else {
      exportError.value = result.error
      alert(`❌ Backup failed: ${result.error}`)
    }
  } catch (error: any) {
    console.error('Backup error:', error)
    exportError.value = error.message
    alert('❌ Backup failed')
  } finally {
    exportingBackup.value = false
  }
}

const formatTimestamp = (timestamp: string) => {
  return new Date(timestamp.replace(/T|-/g, (m, i) => 
    i < 10 ? m : ':'
  )).toLocaleString()
}
```

Add CSS:

```css
.backup-section {
  margin-top: 2rem;
  padding: 1.5rem;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-background-soft);
}

.section-description {
  color: var(--color-text-muted);
  margin-bottom: 1rem;
}

.btn-export {
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  font-weight: 600;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-export:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.backup-info {
  margin-top: 1.5rem;
  padding: 1rem;
  background: var(--color-background);
  border-radius: 6px;
}

.backup-info h3 {
  margin-bottom: 0.75rem;
  font-size: 1rem;
}

.backup-info dl {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 0.5rem 1rem;
  font-size: 0.9rem;
}

.backup-info dt {
  font-weight: 600;
}

.backup-info dd {
  margin: 0;
}

.backup-info code {
  font-family: monospace;
  background: var(--color-background-soft);
  padding: 0.2rem 0.4rem;
  border-radius: 3px;
}

.error-message {
  margin-top: 1rem;
  padding: 0.75rem;
  background: #fee;
  border: 1px solid #fcc;
  border-radius: 4px;
  color: #c33;
}
```

---

### Task 3: Test Export Workflow (30 min)

**Manual Testing**:

1. **Start dev server**:
   ```bash
   pnpm dev
   ```

2. **Open ImagesCoreAdmin**:
   - Navigate to `/admin/images`
   - Scroll to "System Backup" section

3. **Test export**:
   - Click "Create Backup" button
   - Wait for completion (watch console)
   - Verify backup info displays

4. **Verify files**:
   ```bash
   ls -lh data/sync/
   # Should see *.backup.tar.gz file
   
   tar -tzf data/sync/*.backup.tar.gz
   # Should list: backup-index.json, events.json, posts.json, etc.
   ```

5. **Test error handling**:
   - Stop database
   - Click export button
   - Verify error message displays

---

## 🎯 Success Criteria

- [ ] API endpoint created and works
- [ ] Export button in admin UI
- [ ] Button shows loading state during export
- [ ] Backup info displays after export
- [ ] Error messages display on failure
- [ ] Tarball created in `/data/sync/`
- [ ] Console logging shows progress
- [ ] UI responsive during export

---

## 🔍 Testing Checklist

### API Testing

```bash
# Test endpoint
curl -X POST http://localhost:3000/api/admin/backup/export

# Expected response:
{
  "success": true,
  "backup": {
    "timestamp": "2025-11-09T10-30-00-000Z",
    "tables": ["events", "posts", ...],
    "total_records": 157,
    "tar_file": "2025-11-09T10-30-00-000Z.backup.tar.gz"
  }
}
```

### UI Testing

- [ ] Button appears in ImagesCoreAdmin
- [ ] Button disabled during export
- [ ] Loading text shows during export
- [ ] Success message on completion
- [ ] Backup info displays correctly
- [ ] Timestamp formatted properly
- [ ] Table list readable
- [ ] Error handling works

### File Verification

```bash
# Extract and check
cd data/sync
mkdir -p /tmp/backup-test
tar -xzf *.backup.tar.gz -C /tmp/backup-test
ls /tmp/backup-test/
cat /tmp/backup-test/backup-index.json | jq .
```

---

## 🔗 Related Files

- [Master Plan](./2025-11-09_MIGRATION_REFACTOR_PLAN.md)
- [Previous: MR2 Export System](./MR2_EXPORT_SYSTEM.md)
- [Next: MR4 Import System](./MR4_IMPORT_SYSTEM.md)

---

**Last Updated**: November 9, 2025  
**Status**: Ready for implementation
