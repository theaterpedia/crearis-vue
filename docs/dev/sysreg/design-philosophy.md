# Sysreg Design Philosophy: The 4-Byte Sandbox

> **For:** Expert developers joining the project  
> **Created:** December 5, 2025  
> **Core Principle:** The smaller the sandbox, the better the improvisation.

---

## The Paradox of Constraints

In drama-in-education and improvisation work, there's a counterintuitive truth: **the smaller the sandbox, the better the performance**. Give actors an infinite stage with no rules, and they freeze. Give them a 2-meter square and three words they must use, and magic happens.

This principle drives the entire sysreg architecture.

Our sandbox is **4 bytes** - a single 32-bit INTEGER. Everything fits:
- Who can do what
- To which entity
- In which state
- Under what project type

No JSONB sprawl. No relational joins across capability tables. No "flexible" schemas that become unmaintainable. One integer, bitwise operations, done.

---

## Why This Works

### 1. Forced Clarity

When you have 32 bits, you can't be vague. Every capability must be precisely defined and allocated. There's no room for "we'll figure out the edge cases later" because the edge cases must fit in the same 32 bits.

### 2. UI Follows Naturally

A constrained data model produces constrained UI. The `StatusEditor` component emerged almost automatically from the bit structure - each status is a button, each transition is an allowed bit pattern. No complex state machines, no configuration files, no "flexibility" that users must navigate.

### 3. Performance by Design

Bitwise AND/OR operations are the fastest operations a CPU can perform. Filtering 10,000 records by capability? One integer comparison per row. No JSON parsing, no string matching, no joins.

### 4. Single Source of Truth

One table (`sysreg_config`), one value column, one editor (`CapabilitiesEditor`). Change a bit pattern, and the entire system - triggers, API middleware, UI composables - responds consistently.

---

## Example 1: The Create Capability Decision

### The Problem

Early design allocated bits 17-19 for "create capability" with subcategories:

| Value | Meaning |
|-------|---------|
| 000 | No create |
| 001 | Full create |
| 010 | Create as draft only |
| 011 | Create from template |

This seemed reasonable until we asked: **what entity state do you check for create permission?**

The record doesn't exist yet. There is no state.

### The "Flexible" Solution (Rejected)

Add a JSONB metadata field:
```json
{"type": "create_rule", "target_entity": "post", "initial_state": "draft"}
```

This "solves" the problem by escaping the constraint. But now we have two paradigms (bits + JSON), two code paths, two mental models.

### The Sandbox Solution (Adopted)

Recognize that **create is a project-level capability**, not an entity-level one:

- "Can I create posts in this project?" → Check project config
- "Can I transition this post from draft to review?" → Check entity capability

This insight **frees bits 17-19** for a different purpose: encoding `to_status` in transition rules.

Now a single sysreg_config entry can express:
- Entity: post (bits 3-7)
- From state: draft (bits 8-10)
- To state: review (bits 17-19) ← repurposed!
- Roles: owner, member (bits 25-29)
- Capability: manage > status (bits 20-22)

One integer. No JSON. No ambiguity.

---

## Example 2: Status Subcategories

### The Problem

We have 7 status categories (new, demo, draft, review, released, archived, trash). But we also need subcategories like `draft_user` and `draft_review`.

### The "Flexible" Solution (Rejected)

Separate `status_category` and `status_subcategory` columns. Or a hierarchical status table with parent references.

### The Sandbox Solution (Adopted)

Allocate **3 bits per category** in the status field:

| Bits | Category | Capacity |
|------|----------|----------|
| 0-2 | new | 8 substates |
| 3-5 | demo | 8 substates |
| 6-8 | draft | 8 substates |
| ... | ... | ... |

Within draft (bits 6-8):
- `64` = draft (category itself)
- `128` = draft_user
- `256` = draft_review (originally misnamed as just "review")

The bit position **encodes the hierarchy**. No joins, no lookups. `status & 0b111000000` extracts the draft category. `status === 256` identifies specifically draft_review.

---

## The Discipline

Working within 32 bits requires discipline:

1. **Question every "what if"** - If a capability doesn't fit cleanly, the model is wrong, not the constraint.

2. **Merge, don't multiply** - Before adding a new bit group, ask if an existing one can be repurposed or if the concept belongs elsewhere (project config, entity settings).

3. **Name precisely** - `draft_review` not `review`. The name must reflect the bit position's meaning.

4. **Document bit allocation** - The bit layout IS the spec. Keep it in one place, keep it current.

---

## The Payoff

When the sandbox is right, implementation becomes almost mechanical:

- **StatusEditor**: Read allowed transitions from config, render as buttons
- **CapabilitiesEditor**: Map bit groups to form fields, compute integer on change
- **API middleware**: `(config.value & roleBits) !== 0` - one line permission check
- **DB triggers**: `bit_or()` aggregation sets visibility flags

No frameworks. No configuration languages. No "flexibility" tax.

Just 4 bytes, used well.

---

## Further Reading

- [AUTH-SYSTEM-SPEC](../../chat/tasks/2025-12-01-AUTH-SYSTEM-SPEC.md) - Complete bit allocation
- [capabilities-howto](./capabilities-howto.md) - Working with the matrix
- [CAPABILITIES_REFACTORING_PLAN](../devdocs/CAPABILITIES_REFACTORING_PLAN.md) - Migration details

---

*"Constraints are the friend of creativity." - Every improv teacher ever*
