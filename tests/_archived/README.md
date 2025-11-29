# Archived Test Files

**Archived Date:** 2025-11-29  
**Reason:** BYTEA→INTEGER Migration (Migrations 036-042)

---

## Archived Files

### From `tests/unit/`

| File | Original Purpose | Reason for Archive |
|------|-----------------|-------------------|
| `useSysregTags.spec.ts` | Tests BYTEA manipulation (`parseByteaHex`, `byteArrayToBits`, etc.) | System now uses INTEGER, not BYTEA |
| `sysreg-integration.spec.ts` | Integration tests for sysreg composables with BYTEA workflows | Uses obsolete hex string operations |

### From `tests/helpers/`

| File | Original Purpose | Reason for Archive |
|------|-----------------|-------------------|
| `sysreg-bytea-helpers.ts` | BYTEA assertion utilities (`byteaEqual`, `expectBitSet`, etc.) | Helper functions for obsolete BYTEA format |

---

## Migration Context

After Migrations 036-042, the sysreg system changed from:
- **BYTEA** columns storing hex values (`\x01`, `\x02`, `\x04`)
- To **INTEGER** columns storing bit flags (1, 2, 4, 8, 16...)

These tests were designed for the BYTEA system and cannot be adapted without complete rewrite.

---

## Replacement Tests

New tests should:
1. Use integer values directly (e.g., `status: 4` instead of `status: '\\x04'`)
2. Import from `useSysregOptions` for value lookups
3. Use bitwise operations (`value & bit`) instead of BYTEA parsing

---

## Do Not Delete

These files are preserved for reference during the transition period. They document the original BYTEA implementation patterns.
