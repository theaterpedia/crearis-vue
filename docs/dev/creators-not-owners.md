# From Owners to Creators: Rethinking Record Relationships

> **For:** Expert developers and open-source enthusiasts  
> **Created:** December 5, 2025  
> **Context:** The system is called "Crearis" - Latin for "you create"

---

## The Problem with "Owner"

In most systems, we talk about "owners":
- Record owner
- Project owner
- Resource owner
- Data owner

This language carries baggage. Ownership implies:
- **Possession** - "this is mine"
- **Hierarchy** - "I control, you don't"
- **Exclusivity** - "one owner per thing"
- **Transfer** - "ownership can be given/taken"

For a collaborative platform rooted in drama-in-education - where flat hierarchies and shared creation are core values - "owner" is the wrong metaphor.

---

## The Creator Alternative

**Creator** shifts the mental model:

| Owner Thinking | Creator Thinking |
|----------------|------------------|
| "I own this post" | "I created this post" |
| "Transfer ownership" | "Others can co-create" |
| "Owner permissions" | "Creator relationship" |
| "Who owns this?" | "Who started this?" |

A creator is a **fact about history**, not a claim of control. You created something. That's immutable. What happens next is about collaboration, not possession.

### Why This Matters for Capabilities

When bit 29 was called "owner", config entries like this felt natural:
```
post_owner_manage → "owners can manage their posts"
```

But this conflates two things:
1. **Origin** - who created the record (historical fact)
2. **Authority** - who can manage it now (capability)

With "creator":
```
post_creator_manage → "creators can manage posts they created"
```

The capability is granted *because of* the creator relationship, not because of "ownership rights."

---

## Beyond "Roles": Relationship Types

The bits 25-29 were labeled "Roles" in the original spec:

| Bit | Old Name | Type |
|-----|----------|------|
| 25 | anonym | Access level |
| 26 | partner | Project membership |
| 27 | participant | Project membership |
| 28 | member | Project membership |
| 29 | owner | ??? |

But these aren't all the same kind of thing:

- **anonym** = Authentication state (not logged in)
- **partner/participant/member** = Project relationship (how you joined)
- **creator** = Record relationship (you made this)

### Proposed: "Relationships" or "Relations"

Instead of "Role bits (25-29)", consider:

**"Relation bits"** - describes how user relates to the record/project:

| Bit | Relation | Determined By |
|-----|----------|---------------|
| 25 | `anonym` | Session state |
| 26 | `partner` | `project_members.configrole` |
| 27 | `participant` | `project_members.configrole` |
| 28 | `member` | `project_members.configrole` |
| 29 | `creator` | `entity.creator_id === user.id` |

The word "relation" captures:
- It's a **relationship**, not a fixed identity
- The same user has **different relations** to different records
- Relations are **contextual** - you're a creator here, a participant there

---

## The Crearis Connection

The platform name "Crearis" comes from Latin *creare* (to create). The second-person singular passive: "you are created" or "you create."

This isn't accidental. Drama-in-education philosophy emphasizes:
- **Co-creation** over consumption
- **Process** over product
- **Ensemble** over hierarchy
- **Emergence** over control

A system built on "creators" and "relations" embeds these values in its data model. Every API call, every permission check, every UI label reinforces: **you are here to create, together.**

---

## Implementation Notes

### Database Column Rename

```sql
-- Migration: Rename owner_id to creator_id on content entities
ALTER TABLE posts RENAME COLUMN owner_id TO creator_id;
ALTER TABLE images RENAME COLUMN owner_id TO creator_id;
ALTER TABLE events RENAME COLUMN owner_id TO creator_id;
```

### Sysreg Constant Update

```typescript
// Before
const ROLE_OWNER = 1 << 29

// After
const RELATION_CREATOR = 1 << 29

// Or grouped
const RELATIONS = {
  ANONYM: 1 << 25,
  PARTNER: 1 << 26,
  PARTICIPANT: 1 << 27,
  MEMBER: 1 << 28,
  CREATOR: 1 << 29,
}
```

### Config Entry Naming

```
// Old style
post_owner_manage

// New style  
post_creator_manage
post_P_owner_approve  // P_ = project owner (the person, via FK lookup)
```

Note: "project owner" stays as "owner" because projects ARE owned (legal entity, responsibility). Only record-level "owner" becomes "creator."

---

## Summary

| Concept | Old Term | New Term | Why |
|---------|----------|----------|-----|
| Who made this record | owner | **creator** | Historical fact, not possession |
| Bits 25-29 | roles | **relations** | Contextual relationships, not identities |
| Column on entities | owner_id | **creator_id** | Consistency |
| Project owner | owner | **owner** | Projects have legal ownership |

The language we use shapes how we think. "Creators" and "relations" align the codebase with Crearis's educational philosophy: flat hierarchies, collaborative creation, and the belief that everyone who participates is creating something together.

---

## Further Reading

- [Design Philosophy: The 4-Byte Sandbox](./design-philosophy.md)
- [AUTH-SYSTEM-SPEC](../../chat/tasks/2025-12-01-AUTH-SYSTEM-SPEC.md)
- [capabilities-howto](./capabilities-howto.md)

---

*"In the theatre, we don't have owners. We have creators, collaborators, and an audience that completes the work."*
