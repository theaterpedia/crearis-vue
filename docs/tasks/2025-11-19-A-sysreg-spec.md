#### description and features
The  tags-by-bitmask-system created here and documented here will serve as foundation for the whole database to serve tags and status-keys in an easy i18n-translatable key-value-logic that can be implemented with typed enums on the front-end.

65 classes of information will be captured by the system:

- data-states like for instance 'trash', 'new' (required and unique)
- configuration-keys, settings and props, for instance 'seo', 'seo > description'
- record-tags (optional, combinations allowed) like for instance 'system', 'task' that instruct special, additional behavior
- 'common tags' like 'ages' and 'age-groups'
- 'topic tags' (typically used for blogging) like 'democracy', 'diversity' and sub-topics like 'democracy > constitution', 'diversity > gender'
- domain-specific 'categories' like (german) 'raumlauf', 'kreisspiel' and sub-categories like 'kreisspiel > impulskreis'

A central table with a simple index-structure makes sure, that within those 5 classes for different domains of status, configs and tagging no byte-value will be used in an ambiguous way. This will result in up to 5 fields that are available on entity-tables to control state and options from system to content with unified components and backend-logic.
A code-generator extracts all keys to a set of typings and interface-descriptions that can be imported by vue-components and composables to allow for typesafe implementations based on the keys.


#### merging, chainging and computation
The system creates two levels of merging/refining initial status ('new') (and tags) into more specific status ('new > idea')
Therefore it introduces one-level-deep 'chaining' of tags and status-expressions: simple tag 'teen' -> gets chained to 'teen > 10-13'

##### STATUS-examples
I describe this based on entity 'events', handling of default-status

3 Levels exist how on entity-creation the items data is constructed and refined
1. on item-creation default-values are set (on the db-level)
2. a template can be defined before an item get's created (on the db-level > see field 'template' in table events > holds xmlid)
3. the front-end form that instructs the creation can further tweak the item under creation

Those 3 levels bring 3 options where refining of initial/default values can happen
A: entity-item > entity-template (with database-trigger or vuejs-logic)
B: entity-item > page-item (vuejs-logic)
C: entity-template > page-item (vuejs-logic)


Example A:
1. for the entity 'event' status-default for new records is be 'new'
2. but as a general rule if a 'template' is set for the entity-item, then the template can bring in a variation like 'new > template'

Example B:
1. for the entity 'event' status-default for new records is 'new'
3. a vue-component that handles the registering for conference-tracks submitted by team-members sets the default-status to 'new > idea'

Rules:
- Level 3 takes precedence over 2 and 1.
- Level 2 takes precedence over 1.
- initial value ('new') cannot be altered by 2 and 3, only variation can be added


### Chaining with variations
#### example 'age'
the tag-category 'age' has these four options all | child | teen | adult
it can have 'sub-age', to be displayed with a breadcrumbs-like visualization

**example A: teen**
teen > 12-15
teen > 18-27
teen > all ages

**example B: all**
all > 18-27 + all adults
all > all children + all teens

#### example 'sub-age'
sub-age is built as fixed tags with these 3 groups + the 'default'-option

child default (if age: child|all -> default means 'all children', else this means 'no choice')
3-6
6-9
9-12

teen default (same as child for teens)
12-15
15-18
18-27

adult default (same as child for adults)
25-40
35-60
60+ (resembles 60-99)

default (or no choice -> default)

(all gives this default: age:all > sub-age:default )

#### Rules for age + sub-age
- sub-age: each group only 1 value allowed
- but this combination is allowed: 
    - age:all 
    - sub-age: 'child default' + 12-15
    -> display result is 'all > child + 12-15'
- age has to be either one of the four values, no combinations

#### logic for age + sub-age
If age:all is chosen, then sub-age 'child default' displays as 'children'
If age:all is chosen, then all sub-ages are available
If age:child is chosen, then sub-age 'child default' displays as 'all' or ('all ages')
If age:child is chosen, then only the child-group of sub-ages is available


### Implementation-Logic
a simple bitmask should be built, having age=2 bits + sub-age another group of 7 bits (1 for sub-age=all, 2 for each of the 3 groups)
maybe this can be reduced so that
