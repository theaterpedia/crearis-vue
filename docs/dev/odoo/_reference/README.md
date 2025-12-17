# OCA Event Session Python Reference

> **Source**: [OCA/event](https://github.com/OCA/event) - `event_session` module  
> **License**: AGPL-3.0  
> **Odoo Version**: 16.0

These are reference copies of the Python model files from the OCA `event_session` module.
They are included here for API development reference since the original files are outside
source control in `temp_import/`.

## Files

| File | Model | Purpose |
|------|-------|---------|
| `event_event.py` | `event.event` | Parent event with `use_sessions` flag, computed dates from sessions |
| `event_session.py` | `event.session` | Core session model with delegation inheritance from `event.event` |
| `event_registration.py` | `event.registration` | Registration with `session_id` field |
| `event_type.py` | `event.type` | Event type with `use_sessions` boolean |

## Key Concepts

### Delegation Inheritance
```python
class EventSession(models.Model):
    _name = "event.session"
    _inherits = {"event.event": "event_id"}  # ← Delegation inheritance
```

This means `event.session` has access to ALL fields from `event.event` directly,
and the `event_id` field links to the actual parent record.

### Field Relationships
```
event.type.use_sessions → event.event.use_sessions → event.session
                       ↓
                  event.registration.session_id
```

## Usage

These files are for **reading reference only**. Do not modify them.
For actual API interactions, see `/docs/odoo/api/`.
