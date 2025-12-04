# Daily Workflow: 5-Step Framework

**Purpose:** Define collaboration phases, role expectations, and behavioral presets for effective team work.

---

## Overview

| Phase | Time | Mode | Hans | Claude |
|-------|------|------|------|--------|
| Early Sunrise | 05:30-07:00 | Meta-reflection | Lead discussions | Ask questions, propose alternatives |
| Late Sunrise | 07:30-08:30 | Plan of Day | Clarify scope | Confirm understanding, no execution |
| Morning | 08:30-12:00 | Deep Work | Active guidance | Execute with guidance |
| Midday Report | 12:00-12:30 | Written Handoff | Review later | Write report, list questions |
| Afternoon | 14:00-18:00 | Surface to UI | 5-min hourly check-ins | More autonomous, create tests/UI |
| Evening | 18:00+ | Docs & Envisioning | Occasional assist | Prepare options, demo branches |

---

## Phase Details

### 1. Early Sunrise (05:30-07:00) - Meta

**Focus:** Team-work patterns, interaction quality, alternative scenarios

**What belongs here:**
- Reflection on yesterday's wins and left-outs
- Clarification of vague terms or scope
- Process improvements
- Alternative approaches before commitment

**What does NOT belong here:**
- Implementation
- Detailed task planning (save for late sunrise)

**Claude's behavioral preset:**
- Ask clarifying questions freely
- Propose 2-3 alternatives when scope is unclear
- Challenge assumptions gently
- No tool usage unless explicitly requested

---

### 2. Late Sunrise (07:30-08:30) - Plan of Day

**Focus:** Concrete tasks, blockers, dependencies

**Two modes:**

#### A) Standard Mode - Talk Through
When scope needs clarification or alternatives need discussion.

**Checkpoint questions:**
1. "What is the ONE thing we must deliver today?"
2. "Do I understand all terms in the scope?" (If not: ASK!)
3. "What can block us? Who/what do we depend on?"
4. "Which phase gets which task?"

#### B) Exploring Mode - Build Through
When scope is clear but direction needs exploration. Shortcut to hands-on prototyping.

**Strategies:**
| Strategy | When to use | Example |
|----------|-------------|---------|
| Demo files | Quick UI alternatives | `demo1.vue`, `demo2.vue`, `demo3.vue` |
| Git branches | Larger architectural choices | `explore/option-a`, `explore/option-b` |
| Throwaway scripts | API/data exploration | `temp/check-xyz.ts` |

**Exploring mode rules:**
- Max 30 minutes per option
- Each option must be independently testable
- Document tradeoffs in code comments
- Clean up or commit before morning session starts

**Output:** Updated daily task file with tasks assigned to phases (or: 2-3 demo options ready for review)

**Claude's behavioral preset:**
- If you see cryptic terms like "spearhead composables" → STOP and ASK
- Confirm understanding: "So we're building [specific], correct?"
- Don't start executing, only plan

---

### 3. Morning Session (08:30-12:00) - Deep Work

**Focus:** Fundamental implementation (API, composables, migrations, specs)

**Characteristics:**
- Hans is actively involved
- Frequent back-and-forth
- Complex decisions happen here
- OK to pause and discuss alternatives

**Claude's behavioral preset:**
- Execute with guidance
- Ask before major decisions
- Prefer smaller commits
- Document decisions in code comments

---

### 4. Midday Report (12:00-12:30) - Written Handoff

**Focus:** Create written artifact for afternoon continuity

**Report template:**
```markdown
## Morning Session Report - [Date]

### Completed
- [ ] Task 1
- [ ] Task 2

### In Progress
- [ ] Task with current state

### Open Questions
1. Question needing Hans's input
2. Another question

### Afternoon Proposal
Suggested focus: [specific task]
Estimated autonomy: [high/medium/low]
```

**Claude's behavioral preset:**
- Write the report proactively
- List concrete questions, not vague concerns
- Propose afternoon focus with confidence level

---

### 5. Afternoon Session (14:00-18:00) - Surface

**Focus:** Bring morning work to UI, tests, visible artifacts

**Characteristics:**
- Hans works on other things, available for check-ins
- Claude works more autonomously
- ~5 minute check-ins per hour
- Focus on tests, components, demo views

**Check-in structure:**
1. "Here's what I did in the last hour"
2. "Here's what I'll do next"
3. "Any blockers or questions?" (keep brief!)

**Claude's behavioral preset:**
- Make decisions within established patterns
- Commit frequently with clear messages
- Flag blockers immediately, don't wait
- If stuck >15 minutes, ask

---

### 6. Evening (18:00+) - Docs & Envisioning

**Focus:** Documentation from day's insights, prepare tomorrow's options

**What belongs here:**
- Update convention docs with new learnings
- Create demo code showing 2-3 directions
- Prepare experimental branches (easy rollback)
- Small migrations on dev-db for exploration

**Claude's behavioral preset:**
- Mostly autonomous
- ~1 check-in per hour (5 minutes)
- Prepare options, don't commit to direction
- Use git branches for experiments

---

## Behavioral Presets Summary

### When to STOP and ASK

| Trigger | Action |
|---------|--------|
| Cryptic term (e.g., "spearhead composables") | "What does X mean? Example?" |
| Scope change mid-session | "Should we update the plan?" |
| >2 approaches possible | "Option A vs B - which direction?" |
| Blocked >15 minutes | "I'm stuck on X, need help" |
| Phase transition | Summarize + propose next focus |

### When to EXECUTE without asking

| Situation | Action |
|-----------|--------|
| Pattern established (e.g., "add test like the others") | Do it |
| Bug fix with obvious solution | Fix + commit |
| Documentation update from code | Write it |
| Afternoon UI work within spec | Build it |

---

## Fundamental Rules

### Time Awareness
**Claude MUST ask for the current time** when:
- Starting a new session
- Time hasn't been mentioned in >30 minutes
- Planning phase-dependent work

**Hans MUST provide the time** when asked (or proactively when starting).

*Rationale: Claude cannot access local clock. Phase-appropriate behavior depends on knowing the time.*

---

## Convention Index

Quick links to key reference docs:

| Topic | Location |
|-------|----------|
| CSS Conventions | `chat/mcp/Opus-CSS-Conventions.md` |
| Capabilities System | `docs/dev/sysreg/capabilities-howto.md` |
| Auth System Spec | `chat/tasks/2025-12-01-AUTH-SYSTEM-SPEC.md` |
| Test Data Setup | `server/database/reset-test-data.ts` |
| Integration Tests | `tests/integration/posts-visibility.test.ts` |
| Sprint Roadmap | `chat/tasks/2025-12-01-SPRINT-Projectlogin_Workflow.md` |
| Deferred Tasks | `chat/tasks/2025-12-10-DEFERRED-from-Projectlogin_Workflow.md` |

---

## Daily Task File Template

```markdown
# Daily Tasks: [Date]

## Early Sunrise (05:30-07:00) - Meta
<!-- reflection, clarification, alternatives -->

## Late Sunrise (07:30-08:30) - Plan of Day  
**ONE thing to deliver:** [specific deliverable]

### Morning Tasks (08:30-12:00)
- [ ] Task 1
- [ ] Task 2

### Afternoon Tasks (14:00-18:00)
- [ ] Task 3
- [ ] Task 4

### Evening Tasks (18:00+)
- [ ] Task 5

## Midday Report
<!-- filled at 12:00 -->

## End of Day Summary
<!-- filled at end of day -->
```
