# Projectlogin Workflow - System Documentation

**Sprint:** December 1-9, 2025  
**Status:** 🟡 In Development

---

## Overview

The Projectlogin Workflow system enables consistent login experience for project owners and members, allowing them to edit posts and events, add images, and configure external project presentation.

---

## Architecture

### Core Components

```
┌─────────────────────────────────────────────────────────────────┐
│                     FRONTEND (Vue 3)                             │
├─────────────────────────────────────────────────────────────────┤
│  Composables              │  Components                          │
│  ├── useProjectStatus     │  ├── tagFamilyDisplay                │
│  ├── useEventStatus       │  ├── tagGroupEditor                  │
│  ├── usePostStatus        │  ├── StatusBadge                     │
│  ├── useImageStatus       │  └── Kanban                          │
│  └── useWorkflow          │                                      │
├─────────────────────────────────────────────────────────────────┤
│                     API Layer (Nitro)                            │
├─────────────────────────────────────────────────────────────────┤
│  ├── /api/projects/*                                             │
│  ├── /api/events/*                                               │
│  ├── /api/posts/*                                                │
│  └── /api/sysreg/*                                               │
├─────────────────────────────────────────────────────────────────┤
│                     DATABASE (PostgreSQL)                        │
├─────────────────────────────────────────────────────────────────┤
│  Tables                   │  Sysreg Tables                       │
│  ├── projects             │  ├── sysreg_status                   │
│  ├── events               │  ├── sysreg_rtags                    │
│  ├── posts                │  └── sysreg_config (sidelined)       │
│  ├── images               │                                      │
│  ├── users                │  Triggers                            │
│  ├── tasks                │  ├── status_validation              │
│  └── features (new)       │  └── main_task_sync                  │
└─────────────────────────────────────────────────────────────────┘
```

### Status System (sysreg)

The status system uses bit-based representation for efficient storage and querying.

#### Status Categories (bits 0-16)
| Category | Bits | Description |
|----------|------|-------------|
| new | 0-2 | Newly created entities |
| demo | 3-5 | Demo/sample data |
| draft | 6-8 | Work in progress |
| confirmed | 9-11 | Reviewed and confirmed |
| released | 12-14 | Published/visible |
| archived | 15 | No longer active |
| trash | 16 | Marked for deletion |

#### Scope Toggles (bits 17-21)
| Scope | Bit | Description |
|-------|-----|-------------|
| team | 17 | Visible to team members |
| login | 18 | Visible to logged-in users |
| project | 19 | Visible within project |
| regio | 20 | Visible in region |
| public | 21 | Publicly visible |

→ [Detailed Status Documentation](./tasks/2025-11-19-A-sysreg-spec.md)

---

## Entity Documentation

| Entity | Doc | v0.2 | v0.3 | v0.4 |
|--------|-----|------|------|------|
| [Events](./Projectlogin_Workflow_Events.md) | 📄 | ⬜ | ⬜ | ⬜ |
| [Posts](./Projectlogin_Workflow_Posts.md) | 📄 | ⬜ | ⬜ | ⬜ |
| [Projects](./Projectlogin_Workflow_Projects.md) | 📄 | ⬜ | ⬜ | ⬜ |
| [Users](./Projectlogin_Workflow_Users.md) | 📄 | ⬜ | ⬜ | ⬜ |
| [Images](./Projectlogin_Workflow_Images.md) | 📄 | ⬜ | ⬜ | ⬜ |
| [Instructors](./Projectlogin_Workflow_Instructors.md) | 📄 | ⬜ | ⬜ | ⬜ |
| [Locations](./Projectlogin_Workflow_Locations.md) | 📄 | ⬜ | ⬜ | ⬜ |
| [Features](./Projectlogin_Workflow_Features.md) | 📄 | - | - | ⬜ |

---

## Workflow States

### Entity Lifecycle
```
new → draft → confirmed → released → archived
         ↓         ↓
       trash     trash
```

### Project Types
- **topic**: Simple projects with images and posts
- **project**: Full projects with events
- **regio**: Regional hubs with related projects focus
- **special**: Meta projects (dev, tp) with reduced automation

---

## Quick Links

### Daily Tasks
- [Nov 30](./tasks/2025-11-30.md) | [Dec 1](./tasks/2025-12-01.md) | [Dec 2](./tasks/2025-12-02.md)
- [Dec 3](./tasks/2025-12-03.md) | [Dec 4](./tasks/2025-12-04.md) | [Dec 5](./tasks/2025-12-05.md)
- [Dec 8](./tasks/2025-12-08.md) | [Dec 9](./tasks/2025-12-09.md)

### Sprint Documents
- [Sprint Roadmap](./tasks/2025-12-01-SPRINT-Projectlogin_Workflow.md)
- [TDD Implementation Plan](./tasks/2025-11-30-TDD-IMPLEMENTATION-PLAN.md)
- [Deferred Tasks](./tasks/2025-12-10-DEFERRED-from-Projectlogin_Workflow.md)

### Technical References
- [Vitest Infrastructure](./tasks/2025-11-13_VITEST_INFRASTRUCTURE_GUIDE.md)
- [Sysreg Spec](./tasks/2025-11-19-A-sysreg-spec.md)
- [Database Schema](./DATABASE_SCHEMA.md)
