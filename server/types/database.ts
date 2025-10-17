/**
 * Database Table Field Types
 * 
 * These types represent the actual columns in the database tables.
 * Keep these in sync with the database schema migrations.
 * 
 * Usage:
 * - Use these types when preparing data for INSERT/UPDATE operations
 * - Ensures type safety and prevents referencing non-existent columns
 */

/**
 * Posts table fields
 * Based on: 000_base_schema.ts + 008_add_isbase_to_entities.ts + 009_add_project_relationships.ts + 012_add_extended_fields.ts
 */
export interface PostsTableFields {
    id: string
    name: string
    subtitle?: string | null
    teaser?: string | null
    author_id?: string | null
    blog_id?: string | null
    tag_ids?: string | null
    website_published?: string | null
    is_published?: string | null
    post_date?: string | null
    cover_properties?: string | null
    event_id?: string | null
    cimg?: string | null
    version_id?: string | null
    created_at?: string | null
    updated_at?: string | null
    status?: string | null
    // Added by migration 008
    isbase?: number
    // Added by migration 009
    project?: string | null
    template?: string | null
    public_user?: string | null
    // Added by migration 012
    header_type?: 'default' | 'simple' | 'columns' | 'banner' | 'cover' | 'bauchbinde'
    md?: string | null
    html?: string | null
}

/**
 * Events table fields
 * Based on: 000_base_schema.ts + 002_align_schema.ts + 009_add_project_relationships.ts + 011_add_event_type.ts + 012_add_extended_fields.ts
 */
export interface EventsTableFields {
    id: string
    name: string
    date_begin?: string | null
    date_end?: string | null
    address_id?: string | null
    user_id?: string | null
    seats_max?: number | null
    cimg?: string | null
    header_type?: 'default' | 'simple' | 'columns' | 'banner' | 'cover' | 'bauchbinde'
    rectitle?: string | null
    teaser?: string | null
    version_id?: string | null
    created_at?: string | null
    updated_at?: string | null
    status?: string | null
    // Added by migration 002
    isbase?: number
    // Added by migration 009
    project?: string | null
    template?: string | null
    public_user?: string | null
    location?: string | null
    // Added by migration 011
    event_type?: 'workshop' | 'project' | 'course' | 'conference' | 'online' | 'meeting'
    // Added by migration 012
    md?: string | null
    html?: string | null
}

/**
 * Locations table fields
 * Based on: 000_base_schema.ts + 008_add_isbase_to_entities.ts
 */
export interface LocationsTableFields {
    id: string
    name: string
    cimg?: string | null
    street?: string | null
    city?: string | null
    zip?: string | null
    version_id?: string | null
    created_at?: string | null
    updated_at?: string | null
    status?: string | null
    // Added by migration 008
    isbase?: number
}

/**
 * Instructors table fields (public_users)
 * Based on: 000_base_schema.ts + 008_add_isbase_to_entities.ts + 012_add_extended_fields.ts
 */
export interface InstructorsTableFields {
    id: string
    name: string
    email?: string | null
    cimg?: string | null
    bio?: string | null
    version_id?: string | null
    created_at?: string | null
    updated_at?: string | null
    status?: string | null
    // Added by migration 008
    isbase?: number
    // Added by migration 012
    header_type?: 'default' | 'simple' | 'columns' | 'banner' | 'cover' | 'bauchbinde'
    md?: string | null
    html?: string | null
    multiproject?: 'yes' | 'no'
}

/**
 * Projects table fields
 * Based on: migrations + 009_add_project_relationships.ts + 012_add_extended_fields.ts + 014_add_computed_columns_and_seed.ts
 */
export interface ProjectsTableFields {
    id: string
    name: string
    description?: string | null
    cimg?: string | null
    created_at?: string | null
    updated_at?: string | null
    status?: 'new' | 'draft' | 'demo' | 'active' | 'trash' // Updated by migration 013
    // Added by migration 009
    release?: string | null
    // Added by migration 012
    header_type?: 'default' | 'simple' | 'columns' | 'banner' | 'cover' | 'bauchbinde'
    md?: string | null
    html?: string | null
    type?: 'project' | 'regio' | 'special'
    // Updated by migration 014 - computed columns (read-only, auto-generated)
    is_regio?: boolean // GENERATED: computed as (type = 'regio')
    is_project?: boolean // GENERATED: computed as (type = 'project')
    regio?: string | null
    partner_projects?: string | null
    heading?: string | null
    theme?: number | null
    teaser?: string | null
    team_page?: 'yes' | 'no'
    cta_title?: string | null
    cta_form?: string | null
    cta_entity?: 'post' | 'event' | 'instructor'
    cta_link?: string | null
}

/**
 * Type guards for runtime validation
 */
export function isValidPostField(key: string): key is keyof PostsTableFields {
    const validFields: (keyof PostsTableFields)[] = [
        'id', 'name', 'subtitle', 'teaser', 'author_id', 'blog_id', 'tag_ids',
        'website_published', 'is_published', 'post_date', 'cover_properties',
        'event_id', 'cimg', 'version_id', 'created_at', 'updated_at', 'status',
        'isbase', 'project', 'template', 'public_user',
        'header_type', 'md', 'html'
    ]
    return validFields.includes(key as keyof PostsTableFields)
}

export function isValidEventField(key: string): key is keyof EventsTableFields {
    const validFields: (keyof EventsTableFields)[] = [
        'id', 'name', 'date_begin', 'date_end', 'address_id', 'user_id', 'seats_max',
        'cimg', 'header_type', 'rectitle', 'teaser', 'version_id', 'created_at',
        'updated_at', 'status', 'isbase', 'project', 'template', 'public_user',
        'location', 'event_type', 'md', 'html'
    ]
    return validFields.includes(key as keyof EventsTableFields)
}

/**
 * Helper to filter object to only include valid table fields
 */
export function filterToTableFields<T extends Record<string, any>>(
    data: T,
    validFields: string[]
): Partial<T> {
    const filtered: Partial<T> = {}
    for (const key of validFields) {
        if (key in data) {
            filtered[key as keyof T] = data[key as keyof T]
        }
    }
    return filtered
}

/**
 * Pages table fields
 * Based on: 013_alter_project_status_and_add_pages.ts
 */
export interface PagesTableFields {
    id: string
    project: string
    header_type?: 'simple' | 'columns' | 'banner' | 'cover' | 'bauchbinde'
    page_type: 'landing' | 'event' | 'post' | 'team'
    created_at?: string | null
    updated_at?: string | null
}

/**
 * Page Sections table fields
 * Based on: 013_alter_project_status_and_add_pages.ts
 */
export interface PageSectionsTableFields {
    id: string
    page: string
    scope: 'page' | 'header' | 'aside' | 'bottom'
    type: '1_postit' | '2_list' | '3_gallery'
    heading?: string | null
    created_at?: string | null
    updated_at?: string | null
}

/**
 * Form Input table fields
 * Based on: 013_alter_project_status_and_add_pages.ts
 */
export interface FormInputTableFields {
    id: string
    project: string
    name?: string | null
    email?: string | null
    user?: string | null
    input?: any // JSONB in PostgreSQL, TEXT in SQLite
    created_at?: string | null
    updated_at?: string | null
}
