# Domain System and Schema Extensions

## Overview

Migration 015 introduces a comprehensive domain management system and extends the projects, users, and locations tables with new relationships and fields.

## System Seed Phase

A new "system-seed" phase runs **before all other seeding** to establish foundational data:
1. TLDs (top-level domains)
2. System domains (sysdomains)
3. Default users (admin, base, project1, project2)

## New Tables

### 1. TLDs Table (Top-Level Domains)

Stores available top-level domains without an ID field (name is the primary key).

**Schema**:
```sql
CREATE TABLE tlds (
    name TEXT PRIMARY KEY,
    description TEXT,
    relevance INTEGER CHECK (relevance IN (1, 2, 3, 4))
)
```

**System Seeded Data**:
| name   | description     | relevance |
|--------|-----------------|-----------|
| de     | Germany         | 1         |
| com    | Commercial      | 1         |
| org    | Organization    | 1         |
| info   | Information     | 1         |
| bayern | Bavaria         | 1         |
| eu     | European Union  | 1         |

### 2. Sysdomains Table (System Domains)

Stores predefined system domains with optional subdomains.

**Schema**:
```sql
CREATE TABLE sysdomains (
    id SERIAL PRIMARY KEY,
    tld TEXT NOT NULL REFERENCES tlds(name),
    domain TEXT NOT NULL,
    subdomain TEXT,
    description TEXT,
    options JSONB
)
```

**Computed Property**:
- `domainstring` (TEXT, GENERATED):
  - Returns `subdomain + '.' + domain` if subdomain is set
  - Returns `domain` otherwise

**System Seeded Data**:
| id | domain       | tld    | subdomain | domainstring  | options           |
|----|--------------|--------|-----------|---------------|-------------------|
| 1  | theaterpedia | org    | NULL      | theaterpedia  | NULL              |
| 2  | dasei        | eu     | NULL      | dasei         | {private: true}   |
| 3  | raumlauf     | de     | NULL      | raumlauf      | NULL              |
| 4  | brecht       | bayern | NULL      | brecht        | NULL              |
| 5  | crearis      | info   | NULL      | crearis       | {private: true}   |

### 3. Domains Table (Project Domains)

Manages domains for projects with flexible configuration options.

**Schema**:
```sql
CREATE TABLE domains (
    id SERIAL PRIMARY KEY,
    sysdomain_id INTEGER REFERENCES sysdomains(id),
    tld TEXT NOT NULL REFERENCES tlds(name),
    textdomain TEXT CHECK (textdomain IS NULL OR textdomain ~ '^[a-z0-9_]+$'),
    admin_user_id TEXT REFERENCES users(id),
    project_id TEXT REFERENCES projects(id),
    description TEXT
)
```

**Computed Property**:
- `domainname` (TEXT, UNIQUE, GENERATED):
  - If sysdomain chosen AND textdomain empty: `sysdomain.domainstring + '.' + tld`
  - If sysdomain chosen AND textdomain has value: `textdomain + '.' + sysdomain.domainstring + '.' + tld`
  - Otherwise: `textdomain + '.' + tld`

**Rules**:
1. `textdomain` can only contain valid subdomain characters (no dots)
   - Valid: `'project1'`, `'project1_showcase'`
   - Invalid: `'project1.showcase'`
2. If `sysdomain_id` is set, `tld` is automatically set to match `sysdomain.tld`

**Examples**:

```typescript
// Example 1: Using sysdomain without textdomain
{
  sysdomain_id: 1, // theaterpedia.org
  tld: 'org',      // auto-set from sysdomain
  textdomain: null,
  // Result: domainname = 'theaterpedia.org'
}

// Example 2: Using sysdomain with textdomain
{
  sysdomain_id: 1,      // theaterpedia.org
  tld: 'org',           // auto-set
  textdomain: 'project1',
  // Result: domainname = 'project1.theaterpedia.org'
}

// Example 3: Custom domain without sysdomain
{
  sysdomain_id: null,
  tld: 'com',
  textdomain: 'myproject',
  // Result: domainname = 'myproject.com'
}
```

## Extended Tables

### Projects Table Updates

**New Fields**:
```sql
ALTER TABLE projects ADD COLUMN owner_id TEXT REFERENCES users(id);
ALTER TABLE projects ADD COLUMN is_company BOOLEAN DEFAULT FALSE;
ALTER TABLE projects ADD COLUMN member_ids JSONB;  -- Array of user IDs
ALTER TABLE projects ADD COLUMN config JSONB;
ALTER TABLE projects ADD COLUMN domain_id INTEGER REFERENCES domains(id);
```

**New Computed Property**:
- `locations`: Collection of locations that have `project_id` pointing to this project
  - Computed in application layer by querying: `SELECT * FROM locations WHERE project_id = <project_id>`

**Updated Seeding**:
- Before seeding projects, default users are created
- Projects are assigned owners:
  - `tp` project → `owner_id: 'usr_project1'`
  - `regio1` project → `owner_id: 'usr_project2'`

### Users Table Updates

**New Fields**:
```sql
ALTER TABLE users ADD COLUMN instructor_id TEXT REFERENCES instructors(id);
```

**Relationship**:
- Links user accounts to instructor profiles
- Enables instructors to have login access

### Instructors Table Updates

**New Computed Property**:
- `is_user` (BOOLEAN, computed in app):
  - Returns `true` if `EXISTS(SELECT 1 FROM users WHERE instructor_id = <instructor_id>)`
  - Returns `false` otherwise
  - Indicates whether the instructor has a user account

### Locations Table Updates

**New Fields**:
```sql
ALTER TABLE locations ADD COLUMN project_id TEXT REFERENCES projects(id);
```

**Updated Seeding**:
- After seeding projects, the first demo location is linked to `project1` (if it exists)
- Query: `SELECT id FROM locations WHERE id LIKE '_demo.%' LIMIT 1`
- Update: `SET project_id = 'tp'` (project1's ID)

## System Seed Users

**Created Before Project Seeding**:

| id             | username  | role    | password    |
|----------------|-----------|---------|-------------|
| usr_admin      | admin     | admin   | password123 |
| usr_base       | base      | base    | password123 |
| usr_project1   | project1  | user    | password123 |
| usr_project2   | project2  | user    | password123 |

These users are used as project owners during project seeding.

## Migration Phases

The migration executes in this order:

1. **System Seed: TLDs** → Create table + seed 6 TLDs
2. **System Seed: Sysdomains** → Create table + seed 5 system domains
3. **Domains Table** → Create table with computed `domainname` and triggers
4. **Projects Extensions** → Add owner, is_company, members, config, domain fields
5. **Users Extensions** → Add instructor_id field
6. **Instructors Extensions** → Document is_user computed property
7. **Locations Extensions** → Add project_id field
8. **System Seed: Users** → Create default users (admin, base, project1, project2)
9. **Update Projects** → Assign owners to existing projects
10. **Link Location** → Attempt to link first demo location to project1

## Usage Examples

### Creating a Domain for a Project

```typescript
// Option 1: Use system domain
await db.run(`
  INSERT INTO domains (sysdomain_id, tld, project_id, description)
  VALUES (1, 'org', 'tp', 'Main Theaterpedia domain')
`)
// Result: domainname = 'theaterpedia.org'

// Option 2: Add subdomain to system domain
await db.run(`
  INSERT INTO domains (sysdomain_id, tld, textdomain, project_id, description)
  VALUES (1, 'org', 'showcase', 'tp', 'Showcase subdomain')
`)
// Result: domainname = 'showcase.theaterpedia.org'

// Option 3: Custom domain
await db.run(`
  INSERT INTO domains (tld, textdomain, project_id, description)
  VALUES ('com', 'myproject', 'tp', 'Custom domain')
`)
// Result: domainname = 'myproject.com'
```

### Querying Project Locations

```typescript
// Get all locations for a project
const locations = await db.all(`
  SELECT * FROM locations 
  WHERE project_id = ?
`, ['tp'])

// Or use the computed property in app code
const project = await getProject('tp')
const projectLocations = await project.getLocations()
```

### Linking User to Instructor

```typescript
// Create instructor profile for a user
await db.run(`
  INSERT INTO instructors (id, name, email)
  VALUES ('inst_123', 'John Doe', 'john@example.com')
`)

// Link user to instructor
await db.run(`
  UPDATE users 
  SET instructor_id = 'inst_123'
  WHERE id = 'usr_123'
`)

// Check if instructor has user account
const instructor = await db.get(`
  SELECT i.*, 
         EXISTS(SELECT 1 FROM users WHERE instructor_id = i.id) as is_user
  FROM instructors i
  WHERE i.id = 'inst_123'
`)
```

### Managing Project Members

```typescript
// Add members to project
await db.run(`
  UPDATE projects 
  SET member_ids = $1
  WHERE id = $2
`, [
  JSON.stringify(['usr_123', 'usr_456', 'usr_789']),
  'tp'
])

// Query projects with member info
const project = await db.get(`
  SELECT p.*, 
         u.username as owner_username
  FROM projects p
  LEFT JOIN users u ON p.owner_id = u.id
  WHERE p.id = 'tp'
`)
```

## Database Constraints & Validations

### TLD Name Validation
- Primary key constraint ensures uniqueness
- Relevance must be 1, 2, 3, or 4

### Textdomain Validation
- PostgreSQL: `CHECK (textdomain ~ '^[a-z0-9_]+$')`
- SQLite: `CHECK (textdomain NOT LIKE '%.%')`
- Valid: lowercase letters, numbers, underscores
- Invalid: dots, spaces, special characters

### Domain Name Uniqueness
- Unique index on `domainname` computed column
- Prevents duplicate domain names across projects

### Sysdomain TLD Enforcement
- Trigger automatically sets `tld` to match `sysdomain.tld`
- Ensures consistency when using system domains

## Benefits

1. **Flexible Domain Management**: Projects can use system domains or custom domains
2. **Subdomain Support**: Easy creation of subdomains on system domains
3. **User Ownership**: Clear project ownership and membership tracking
4. **Instructor Integration**: Instructors can have user accounts for login
5. **Location Association**: Projects can claim locations
6. **Configuration Storage**: JSONB config field for flexible project settings

## Future Enhancements

Potential additions:
- Domain SSL certificate management
- Domain DNS record tracking
- Multi-project membership management UI
- Instructor-user account creation wizard
- Location project assignment UI
- Domain transfer between projects

## Files Modified

- `server/database/migrations/015_domain_system_and_extensions.ts` - New migration
- `server/database/migrations/index.ts` - Migration registry updated
