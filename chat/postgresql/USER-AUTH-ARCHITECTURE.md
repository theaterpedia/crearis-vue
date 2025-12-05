# User Authentication & Projects Architecture

## Current Design

The `projects` table serves dual purposes:
1. **User Accounts** - Authentication credentials (username, password_hash, role)
2. **Project Information** - Project metadata (name, description, status)

This design allows one user account per project initially, with the flexibility to separate them in the future.

## Projects Table Schema

```sql
CREATE TABLE projects (
  -- Authentication fields
  id            TEXT PRIMARY KEY,
  username      TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role          TEXT NOT NULL CHECK(role IN ('admin', 'base', 'project')),
  
  -- Project fields
  name          TEXT,
  description   TEXT,
  status        TEXT DEFAULT 'draft' CHECK(status IN ('draft', 'active', 'archived')),
  
  -- Timestamps
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at    TEXT
)
```

## User Roles

- **admin**: Full system access, can manage all projects and users
- **base**: Base project user with standard permissions
- **project**: Individual project user with project-specific permissions

## Default Users

After running the seed script, two default users are created:

```
Username: admin
Password: admin123
Role:     admin

Username: base
Password: base123
Role:     base
```

**⚠️ IMPORTANT**: Change these passwords in production!

## Authentication Flow

1. User submits username/password to `/api/auth/login`
2. System queries `projects` table for matching username
3. Password is verified using bcrypt against `password_hash`
4. Session token is generated and returned
5. User's `role` determines access permissions

## Future Migration Path

When ready to support multiple projects per user:

1. Keep `projects` table for project data only
2. Create separate `user_projects` junction table:
   ```sql
   CREATE TABLE user_projects (
     user_id TEXT REFERENCES users(id),
     project_id TEXT REFERENCES projects(id),
     role TEXT,
     PRIMARY KEY (user_id, project_id)
   )
   ```
3. Migrate existing project records:
   - Copy auth fields to `users` table
   - Create `user_projects` entries linking users to their projects
   - Remove auth fields from `projects` table

## Seeding Users

To create the default admin and base users:

```bash
# With PostgreSQL
DATABASE_TYPE=postgresql \
DATABASE_URL="postgresql://crearis_admin:password@localhost:5432/crearis_admin_dev" \
npx tsx server/database/seed-users.ts

# With SQLite
npx tsx server/database/seed-users.ts
```

The seed script:
- ✅ Checks if users already exist (idempotent)
- ✅ Creates admin and base users
- ✅ Hashes passwords with bcrypt
- ✅ Sets appropriate roles
- ✅ Displays created credentials

## Database Compatibility

The schema works identically on both:
- ✅ SQLite (development)
- ✅ PostgreSQL (production)

Both databases use the same queries thanks to the database adapter pattern.

## API Endpoints

### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "admin123"
}
```

Response:
```json
{
  "success": true,
  "token": "session-token-here",
  "user": {
    "id": "user-id",
    "username": "admin",
    "role": "admin"
  }
}
```

### Get Session
```http
GET /api/auth/session
Authorization: Bearer session-token-here
```

Response:
```json
{
  "authenticated": true,
  "user": {
    "id": "user-id",
    "username": "admin",
    "role": "admin"
  }
}
```

## Security Notes

1. **Password Hashing**: All passwords are hashed using bcrypt (10 rounds)
2. **Session Management**: Sessions stored in memory (consider Redis for production)
3. **HTTPS Required**: Always use HTTPS in production
4. **Password Policy**: Implement strong password requirements in production
5. **Rate Limiting**: Add rate limiting to login endpoint to prevent brute force attacks

## Testing

Test the authentication:

```bash
# Login as admin
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# Login as base
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"base","password":"base123"}'
```

## Production Checklist

Before deploying to production:

- [ ] Change default passwords
- [ ] Enable HTTPS
- [ ] Add rate limiting to login endpoint
- [ ] Implement password complexity requirements
- [ ] Set up session persistence (Redis/database)
- [ ] Add password reset functionality
- [ ] Implement account lockout after failed attempts
- [ ] Add audit logging for authentication events
- [ ] Set up monitoring for suspicious login activity
