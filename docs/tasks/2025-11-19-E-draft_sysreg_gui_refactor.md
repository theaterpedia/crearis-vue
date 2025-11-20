
#### refactor the existing front-end-code for setting and viewing tags
The following ideas were written prior to defining the sysreg-table-strategy. They keep certain good ideas but have to get reworked

-> target: alter the Tags-Manager to be reusable
- two types
	- tagToggle: on/off
	- tagOptions
		- option-bytes: 1, 2, 3, 4
- tagToggle-Component
- Container-Component (identical to tagsViewer?)
	- distinguish: groups and toggles- 
- tagsViewer (for the moment identical ...)
	- prop: editable
	- tags -> array of type tag: 
		- type tag
			- editable
			- tagtype
			- header
			- 
	- shows the tags/tag-groups in one row, each tag in one col with 2 sub-cols: header / value
	- showEmpty-Tags option -> falls nicht: (+)
	- 
- tagOptions-Component
	- do not display the option-value if "other", "default" are selected > used for the merge-system
	- 
- Name the Option-Groups
- DO NOT try to rebuild the Pills-GUI from ODOO 
	- would have CSS via Class (+later Inline-Enhancement)
- useTags-Composable
	- still has to be defined: create the tags for listings
	- 3 storage-options: byte, subtable, graphql
	- merge
	- i18n
	- configuration