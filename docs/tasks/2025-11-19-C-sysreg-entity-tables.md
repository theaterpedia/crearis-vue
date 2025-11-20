

MIGRATION 025 Align ENTITY-Tables: Scheme
025A: alter entity-tables to make use of the new sysreg-based statusses and tags
025B: based on _depr-Field-Entries it should be possible to update the data

## Update the entity-tables to the new status- and tags-schema
- adapt the relevant tables to the new system, optimize towards simple front-end-code
	- target/features
		- no usage of dual status_id / status_value system on the front-end
		- no double-entries for similar tag-names
		- optimized for upfront-loading and server-side rendering
		- enable hardcoded tag-values, setting tag-options with bitmasks, decouple components from the need to run queries for tags
	- remove the status-field (generated?) from alle entity-tables
	- remove the status_id-field from all entity-tables
	- every entity-record has a default-language and provides (text) tag and description of that language
	- add fields status_val, status_label, status_desc + generate-logic that computes status_label, status_desc from the lang + status_val-entry of the record
	- find all occurencies in the entity-endpoints where reading oder writing took place and create one MD-Registry for all Entities that Lists A Task "Update Endpoint [api-adress]" per endpoint of the entity. Then find Components and Composables that address the endpoint and add their file-name onto the index

MIGRATION 026: Data-Updates / system-seed the new sysreg-based tables
Now it becomes obvious, what kind of deprecated tags- and status-values already are on the entity-tables
run cross-checks to make sure that all existing keys and values will be supported from the new system
seed the new system

MIGRATION 027: Data-Updates / align the data of the entity-tables