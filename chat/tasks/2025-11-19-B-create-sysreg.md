DEFINITION 'entity-tables': 

DEFINITION 'sysreg-classes' > this will be called 'tagfamily'
- status = 'system status/record status' (new, draft ...)
- config = configuration props, settings (seo, seo > description)
- rtags = 'record tags'
- ctags = 'common tags' (the age-groups for example)
- ttags = 'topic tags' (democracy, diversity, democracy > constitution)
- dtags = 'domain tags' ('raumlauf', 'kreisspiel' > 'kreisspiel > impulskreis')

CORE TASK: MIGRATION 022: Creatis sysreg-table
add a new status- and tags-schema
-> goal is to configure the status-names, status-values, tags via one central table that gets inherited using postgres table-inheritance-features
- learn from the table status: how in colum 'value' the hex-value of the tag/status is defined
- integrate tables status and tags into one table sysreg. It copies the schema of table status with these additions
    - field taglogic: category | subcategory | toggle | option
    - field is_default: true|false
    - field tagfamily: status | config | rtags | ctags | ttags | dtags
    - field value: bytea (with the max amount of bits available from postgres)
- copy the existing values
- sysreg has the id-column as index
- constraint requires: 'value' + 'tagfamiliy' are unique, both are required

MIGRATION 023: PREPARE deprecation of old system
- document the existing relations to tables status and tags and constraints on fk_fields that link to them, document generated columns that rely on them
- unlink the existing relations to tables status and tags, remove constraints from fk_fields
- rename the existing tables 'status' to 'status_depr' and 'tags' ot 'tags_depr'
- rename the existing fk_fields and generated columns that in the same way to '_depr'

MIGRATION 024: replace NEW SCHEMA - step1: add new tables as replacements
- Add 6 core tables that all inherit from sysreg and make these adaptions:
    - config
    - status
    - rtags
    - ctags
    - ttags
    - dtags 

- Add another core table 'alltables' that inherits from sysreg and make these adaptions:
    - add field is_entity (boolean)
- create table 'entities' to inherit from 'alltables'
- alter the schema of table sysreg, add fields 'table_vals' as Array(byte) + generated 'table_names' as Array(string) -> table_names to be retrieved from alltables


