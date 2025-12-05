# Main Task Auto-Creation: How It Works

## Question
> "Every entity has a main-task attached - is this handled by the seed-script? If not, create it."

## Answer: ✅ YES, It's Handled (via Database Triggers)

The main-task creation **IS handled** but **NOT directly in the seed script**. Instead, it uses the **database trigger pattern** which is the correct architectural approach.

---

## How It Works

### 1. Migration Creates Triggers (migrate-stage2.ts)

The `migrate-stage2.ts` migration creates **AFTER INSERT triggers** for all 5 entity types:

```typescript
// server/database/migrate-stage2.ts:226-238
CREATE TRIGGER IF NOT EXISTS create_event_main_task
AFTER INSERT ON events
BEGIN
  INSERT INTO tasks (id, title, category, status, record_type, record_id)
  VALUES (
    (SELECT lower(hex(randomblob(8)))),
    '{{main-title}}',
    'main',
    'new',
    'event',
    NEW.id
  );
END
```

**5 Triggers Created:**
- `create_event_main_task` → fires when event is inserted
- `create_post_main_task` → fires when post is inserted
- `create_location_main_task` → fires when location is inserted
- `create_instructor_main_task` → fires when instructor is inserted
- `create_participant_main_task` → fires when participant is inserted

### 2. Seed Script Inserts Entities (seed.ts)

The seed script inserts entities without any mention of tasks:

```typescript
// server/database/seed.ts:183-210
console.log('   📅 Seeding events...')
for (const event of events) {
    await db.run(`
        INSERT INTO events (id, name, date_start, date_end, ...)
        VALUES (?, ?, ?, ?, ...)
        ON CONFLICT(id) DO UPDATE SET ...
    `, [event.id, event.name, event.date_start, ...])
}
console.log(`   ✅ Seeded ${events.length} events`)
```

**No explicit task creation code needed!**

### 3. Triggers Fire Automatically

When the seed script executes `INSERT INTO events`, the database **automatically**:
1. Inserts the event row
2. Fires the `AFTER INSERT` trigger
3. Creates a main task with:
   - `title = '{{main-title}}'`
   - `category = 'main'`
   - `status = 'new'`
   - `record_type = 'event'`
   - `record_id = NEW.id` (the event's ID)

### 4. ON CONFLICT Behavior

The seed script uses `ON CONFLICT(id) DO UPDATE SET ...`:

**First Seeding (Fresh Database):**
- INSERT executes → Trigger fires → Main task created ✅

**Re-Seeding (Data Already Exists):**
- UPDATE executes → Trigger does NOT fire
- BUT: Main task already exists from first seeding ✅

**Result:** Main tasks are created once and preserved across re-seeding.

---

## Why This Approach is Correct

### ✅ Separation of Concerns
- **Seed script**: Handles data import/seeding
- **Database triggers**: Handles data integrity rules

### ✅ DRY Principle
- Trigger code runs for ALL entity insertions (seed, API, manual SQL)
- No need to duplicate task-creation logic in multiple places

### ✅ Data Integrity
- **Impossible** to create an entity without a main task
- Even if someone manually inserts via SQL, trigger still fires

### ✅ Maintenance
- If task structure changes, update trigger once (not every insertion point)

---

## Where Triggers Are Used

### 1. During Seeding ✅
- seed.ts inserts entities → triggers create main tasks

### 2. During API Operations ✅
- POST /api/events → INSERT event → trigger creates main task

### 3. During Manual Operations ✅
- Direct SQL INSERT → trigger creates main task

### 4. During Testing ✅
- Test fixtures → INSERT entities → trigger creates main tasks

---

## Verification

### Check Triggers Exist
```sql
SELECT name FROM sqlite_master 
WHERE type='trigger' AND name LIKE '%main_task%';
```

**Expected Result:**
```
create_event_main_task
create_post_main_task
create_location_main_task
create_instructor_main_task
create_participant_main_task
delete_event_main_task
delete_post_main_task
delete_location_main_task
delete_instructor_main_task
delete_participant_main_task
```

### Count Entities vs Main Tasks
```sql
SELECT 
    (SELECT COUNT(*) FROM events) +
    (SELECT COUNT(*) FROM posts) +
    (SELECT COUNT(*) FROM locations) +
    (SELECT COUNT(*) FROM instructors) +
    (SELECT COUNT(*) FROM participants) as total_entities,
    (SELECT COUNT(*) FROM tasks WHERE category='main') as total_main_tasks;
```

**Expected Result:** `total_entities = total_main_tasks`

---

## Code Locations

| Component | File | Lines | Purpose |
|-----------|------|-------|---------|
| Trigger Creation | `server/database/migrate-stage2.ts` | 226-300 | Creates AFTER INSERT triggers |
| Entity Seeding | `server/database/seed.ts` | 183-410 | Inserts entities (triggers fire) |
| Cascade Deletion | `server/database/migrate-stage2.ts` | 311-380 | BEFORE DELETE triggers |

---

## Conclusion

### ✅ Main-Task Creation IS Handled

The seed script **doesn't need explicit task-creation code** because:
1. Triggers are created during migration
2. Triggers fire automatically on entity INSERT
3. This ensures **every entity always has a main task**

### 🎯 No Changes Needed

The current implementation follows database best practices:
- Automatic data integrity enforcement
- DRY principle (no duplication)
- Separation of concerns
- Works for all insertion methods (seed, API, manual)

### 📝 Design Pattern

This is a **declarative approach**:
- **NOT**: "Seed script must remember to create tasks"
- **YES**: "Database guarantees every entity has a task"

---

## Related Documentation

- [DATA_RULES_VALIDATION.md](./DATA_RULES_VALIDATION.md) - Complete validation report
- [docs/postgresql/database-setup.md](./docs/postgresql/database-setup.md) - Database setup guide
- [server/database/migrate-stage2.ts](./server/database/migrate-stage2.ts) - Trigger implementation
- [server/database/seed.ts](./server/database/seed.ts) - Seeding implementation
