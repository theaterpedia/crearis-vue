# Sprint Input: XMLID Convention Reference

**Date:** 2026-01-12  
**Status:** Active Convention  
**Scope:** Posts, Events (and future entities)

---

## XMLID Format

```
{domaincode}.{entity}.{slug}
```

### Components

| Component | Description | Example |
|-----------|-------------|---------|
| `domaincode` | Project's domaincode from DB | `theaterpedia`, `opus`, `tanzhaus` |
| `entity` | Entity type with optional qualifier | `post_demo`, `event_kurs` |
| `slug` | URL-safe slug from title | `mein_erster_beitrag` |

---

## Posts

**Entity:** `post_demo`

**Format:** `{domaincode}.post_demo.{slug}`

**Examples:**
- `theaterpedia.post_demo.mein_erster_beitrag`
- `opus.post_demo.workshop_ankuendigung`

**Implementation:** `src/components/AddPostPanel.vue`

---

## Events

**Entity determination based on ctags (bitmask):**

### Decision Tree

```
1. Check if any ctags are set
   └─ NO  → entity = "event"
   └─ YES → Continue to step 2

2. Check Realisierung FIRST (priority)
   └─ online  → entity = "event_online"
   └─ hybrid  → entity = "event_hybrid"
   └─ präsenz or other → Continue to step 3

3. Check Format (fallback)
   └─ kurs      → entity = "event_kurs"
   └─ projekt   → entity = "event_projekt"
   └─ konferenz → entity = "event_konferenz"
   └─ other     → entity = "event"
```

### Priority Order
1. **Realisierung** (online, hybrid) takes precedence
2. **Format** (kurs, projekt, konferenz) is fallback
3. Only ONE qualifier - no chaining

### Examples

| Realisierung | Format | Entity | Full XMLID |
|--------------|--------|--------|------------|
| (none) | (none) | `event` | `theaterpedia.event.sommerworkshop` |
| online | kurs | `event_online` | `theaterpedia.event_online.zoom_session` |
| hybrid | projekt | `event_hybrid` | `theaterpedia.event_hybrid.mixed_produktion` |
| präsenz | kurs | `event_kurs` | `theaterpedia.event_kurs.tanzworkshop` |
| präsenz | projekt | `event_projekt` | `theaterpedia.event_projekt.theaterproduktion` |
| präsenz | konferenz | `event_konferenz` | `theaterpedia.event_konferenz.jahrestagung` |
| präsenz | (none) | `event` | `theaterpedia.event.offene_probe` |

**Implementation:** `src/components/EventPanel.vue` (or equivalent)

---

## Slug Generation

```typescript
function generateSlug(title: string): string {
    return title
        .toLowerCase()
        .trim()
        // German umlauts
        .replace(/ä/g, 'ae')
        .replace(/ö/g, 'oe')
        .replace(/ü/g, 'ue')
        .replace(/ß/g, 'ss')
        // Spaces/dashes to underscores
        .replace(/[\s\-]+/g, '_')
        // Remove non-alphanumeric except underscores
        .replace(/[^a-z0-9_]/g, '')
        // Collapse multiple underscores
        .replace(/_+/g, '_')
        // Trim underscores
        .replace(/^_|_$/g, '')
        // Max length
        .substring(0, 50)
}
```

---

## CTAG Bitmask Reference

Refer to `src/components/sysreg/TagFamilies.vue` and sysreg API for current bitmask values.

Key families for events:
- **Realisierung:** online, hybrid, präsenz
- **Format:** kurs, projekt, konferenz, workshop, etc.

---

## Duplicate Key Handling

Backend returns HTTP 409 with message containing `duplicate key` for constraint violations.

Frontend should show user-friendly message:
> "Du hast versucht, dieselbe Vorlage ein zweites Mal anzuwenden, dies geht nicht (ggf. später einmal). Bitte clicke 'Abbrechen' und versuche es erneut mit einer anderen Vorlage."

---

## Files Reference

| File | Purpose |
|------|---------|
| `src/components/AddPostPanel.vue` | Post creation with xmlid |
| `src/components/EventPanel.vue` | Event creation with xmlid |
| `server/api/posts/index.post.ts` | Post API with duplicate handling |
| `server/api/events/index.post.ts` | Event API with duplicate handling |
