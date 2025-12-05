# Sysreg Admin View

The **sysreg** (system registry) admin view allows management of core system tables.

## Overview

<div class="screenshot-placeholder">
Screenshot: Sysreg Admin View - Main Interface
</div>

## Tables

### Status Table (`sysreg_statuses`)

Defines entity lifecycle states:

| ID | Name | Description |
|----|------|-------------|
| 1 | idea | Initial concept |
| 2 | draft | Work in progress |
| 3 | review | Under review |
| 4 | published | Live/public |
| 5 | archived | No longer active |
| 18 | new | New project (stepper mode) |
| 19 | demo | Demo project (stepper mode) |

<div class="screenshot-placeholder">
Screenshot: Status table in admin view
</div>

### Config Table (`sysreg_configs`)

System-wide configuration values:

| Key | Type | Description |
|-----|------|-------------|
| site_name | string | Default site name |
| default_theme | number | Default theme ID |
| ... | ... | ... |

<div class="screenshot-placeholder">
Screenshot: Config table in admin view
</div>

### Rtags Table (`sysreg_rtags`)

Role-based visibility tags:

| Bit | Name | Description |
|-----|------|-------------|
| 2 | r_partner | Partner visibility |
| 4 | r_participant | Participant visibility |
| 8 | r_member | Member visibility |

<div class="screenshot-placeholder">
Screenshot: Rtags table in admin view
</div>

## Tag Families

### Ctags (Content Tags)

Content classification tags:

<div class="screenshot-placeholder">
Screenshot: Ctags management
</div>

### Ttags (Thematic Tags)

Thematic/topic tags:

<div class="screenshot-placeholder">
Screenshot: Ttags management
</div>

### Dtags (Documentation Tags)

Documentation/metadata tags:

<div class="screenshot-placeholder">
Screenshot: Dtags management
</div>

## Editing Records

1. Click on a row to select
2. Edit values in the form panel
3. Click **Save** to persist changes

<div class="screenshot-placeholder">
Screenshot: Edit form panel
</div>

## Adding Records

1. Click **"+ Add"** button
2. Fill in required fields
3. Click **Save**

## Deleting Records

::: warning Caution
Deleting sysreg records can break system functionality. Only delete unused entries.
:::

1. Select the record
2. Click **Delete**
3. Confirm the action

---

*See also: [i18n Configuration](/admin/i18n)*
