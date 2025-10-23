/**
 * Database Table Field Types
 * 
 * These types represent the actual columns in the database tables.
 * Keep these in sync with the database schema migrations.
 * 
 * Last Updated: Migration 020 (i18n Core Implementation)
 * - Migration 019: Auto-increment INTEGER IDs, status_id, FK updates
 * - Migration 020: Added lang field and status_display computed column
 * 
 * Usage:
 * - Use these types when preparing data for INSERT/UPDATE operations
 * - Ensures type safety and prevents referencing non-existent columns
 */

/**
 * Posts table fields
 * Migration 019: Auto-increment ID, INTEGER FKs, status_id
 * Migration 020: status_display computed column
 */
export interface PostsTableFields {
    id: number  // Auto-increment INTEGER PRIMARY KEY
    name: string
    subtitle?: string | null
    teaser?: string | null
    author_id?: number | null  // INTEGER FK to users.id
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
    status_id: number  // INTEGER FK to status.id (Migration 019)
    status_display?: string  // Computed column (Migration 020, read-only)
    isbase?: number
    project_id: number  // INTEGER FK to projects.id (Migration 019)
    template?: string | null
    public_user?: number | null  // INTEGER FK to instructors.id (Migration 019)
    header_type?: 'default' | 'simple' | 'columns' | 'banner' | 'cover' | 'bauchbinde'
    md?: string | null
    html?: string | null
}

/**
 * Events table fields
 * Migration 019: Auto-increment ID, INTEGER FKs, status_id
 * Migration 020: status_display computed column
 */
export interface EventsTableFields {
    id: number  // Auto-increment INTEGER PRIMARY KEY
    name: string
    date_begin?: string | null
    date_end?: string | null
    start_time?: string | null
    end_time?: string | null
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
    status_id: number  // INTEGER FK to status.id (Migration 019)
    status_display?: string  // Computed column (Migration 020, read-only)
    isbase?: number
    project_id: number  // INTEGER FK to projects.id (Migration 019)
    template?: string | null
    public_user?: number | null  // INTEGER FK to instructors.id (Migration 019)
    location?: number | null  // INTEGER FK to locations.id (Migration 019)
    event_type?: 'workshop' | 'project' | 'course' | 'conference' | 'online' | 'meeting'
    md?: string | null
    html?: string | null
}

/**
 * Locations table fields
 * Migration 019: Auto-increment ID, status_id
 * Migration 020: lang field and status_display computed column
 */
export interface LocationsTableFields {
    id: number  // Auto-increment INTEGER PRIMARY KEY
    name: string
    cimg?: string | null
    street?: string | null
    city?: string | null
    zip?: string | null
    phone?: string | null
    email?: string | null
    version_id?: string | null
    created_at?: string | null
    updated_at?: string | null
    status_id: number  // INTEGER FK to status.id (Migration 019)
    status_display?: string  // Computed column (Migration 020, read-only)
    lang: string  // 'de' | 'en' | 'cz' (Migration 020)
    isbase?: number
}

/**
 * Instructors table fields (public_users)
 * Migration 019: Auto-increment ID, status_id
 * Migration 020: lang field and status_display computed column
 */
export interface InstructorsTableFields {
    id: number  // Auto-increment INTEGER PRIMARY KEY
    name: string
    email?: string | null
    phone?: string | null
    city?: string | null
    cimg?: string | null
    bio?: string | null
    version_id?: string | null
    created_at?: string | null
    updated_at?: string | null
    status_id: number  // INTEGER FK to status.id (Migration 019)
    status_display?: string  // Computed column (Migration 020, read-only)
    lang: string  // 'de' | 'en' | 'cz' (Migration 020)
    isbase?: number
    header_type?: 'default' | 'simple' | 'columns' | 'banner' | 'cover' | 'bauchbinde'
    md?: string | null
    html?: string | null
    multiproject?: 'yes' | 'no'
}

/**
 * Projects table fields
 * Migration 019: Auto-increment ID, domaincode separate field, INTEGER FKs
 */
export interface ProjectsTableFields {
    id: number  // Auto-increment INTEGER PRIMARY KEY
    domaincode: string  // Unique TEXT identifier (old id value)
    name?: string | null  // Project title/display name
    description?: string | null
    cimg?: string | null
    created_at?: string | null
    updated_at?: string | null
    status?: 'new' | 'draft' | 'demo' | 'active' | 'trash'
    owner_id: number  // INTEGER FK to users.id (Migration 019)
    release?: string | null
    header_type?: 'default' | 'simple' | 'columns' | 'banner' | 'cover' | 'bauchbinde'
    header_size?: 'small' | 'medium' | 'large'
    md?: string | null
    html?: string | null
    type?: 'project' | 'regio' | 'special' | 'topic' | 'location'
    // Computed columns (read-only, auto-generated)
    is_regio?: boolean  // GENERATED: (type = 'regio')
    is_topic?: boolean  // GENERATED: (type = 'topic')
    is_onepage?: boolean  // GENERATED: from config->>'onepage'
    is_service?: boolean  // GENERATED: from config->>'service'
    is_company?: boolean
    is_location_provider?: boolean
    regio?: number | null  // INTEGER FK to projects.id (self-reference)
    partner_projects?: string | null
    heading?: string | null
    theme?: number | null
    teaser?: string | null
    team_page?: 'yes' | 'no'
    cta_title?: string | null
    cta_form?: string | null
    cta_entity?: 'post' | 'event' | 'instructor'
    cta_link?: string | null
    config?: any  // JSONB in PostgreSQL, TEXT in SQLite
    domain_id?: number | null  // INTEGER FK to domains.id
    member_ids?: any  // JSONB
}

/**
 * Tasks table fields
 * Migration 019: status_id, renamed columns (title→name, image→cimg)
 * Migration 020: lang field and status_display computed column
 */
export interface TasksTableFields {
    id: string  // nanoid (kept as TEXT)
    name: string  // Renamed from title
    description?: string | null
    category: 'admin' | 'main' | 'release'
    status_id: number  // INTEGER FK to status.id (Migration 019)
    status_display?: string  // Computed column (Migration 020, read-only)
    lang: string  // 'de' | 'en' | 'cz' (Migration 020)
    priority: 'low' | 'medium' | 'high' | 'urgent'
    release_id?: string | null  // FK to releases.id
    record_type?: string | null
    record_id?: string | null
    assigned_to?: string | null
    cimg?: string | null  // Renamed from image
    prompt?: string | null
    due_date?: string | null
    completed_at?: string | null
    created_at?: string | null
    updated_at?: string | null
}

/**
 * Users table fields
 * Migration 019: Auto-increment ID, status_id, instructor_id as INTEGER
 * Migration 020: lang field and status_display computed column
 */
export interface UsersTableFields {
    id: number  // Auto-increment INTEGER PRIMARY KEY
    sysmail: string  // System email (unique, required)
    extmail?: string | null  // External email (unique, optional)
    username: string
    password: string  // Password hash (bcrypt)
    role: 'admin' | 'user' | 'base'
    status_id: number  // INTEGER FK to status.id (Migration 019)
    status_display?: string  // Computed column (Migration 020, read-only)
    lang: string  // 'de' | 'en' | 'cz' (Migration 020)
    instructor_id?: number | null  // INTEGER FK to instructors.id (Migration 019)
    created_at?: string | null
    updated_at?: string | null
}

/**
 * Participants table fields
 * Migration 019: Auto-increment ID, status_id
 * Migration 020: lang field and status_display computed column
 */
export interface ParticipantsTableFields {
    id: number  // Auto-increment INTEGER PRIMARY KEY
    name: string
    type: 'teen' | 'kid' | 'adult'
    age?: number | null
    email?: string | null
    phone?: string | null
    isbase?: number
    project_events?: string | null  // JSON array of event IDs
    status_id: number  // INTEGER FK to status.id (Migration 019)
    status_display?: string  // Computed column (Migration 020, read-only)
    lang: string  // 'de' | 'en' | 'cz' (Migration 020)
    created_at?: string | null
    updated_at?: string | null
}

/**
 * Status table fields
 * Stores status definitions with i18n translations
 */
export interface StatusTableFields {
    id: number  // Auto-increment INTEGER PRIMARY KEY
    table: string  // Table this status applies to
    value: number  // Numeric status value
    name: string  // Status name/identifier
    name_i18n: any  // JSONB with translations {de: '...', en: '...', cz: '...'}
    desc_i18n?: any | null  // JSONB with description translations (optional)
}

/**
 * Releases table fields
 */
export interface ReleasesTableFields {
    id: string  // nanoid (kept as TEXT)
    version: string
    version_major: number
    version_minor: number
    description?: string | null
    state: 'idea' | 'draft' | 'final' | 'trash'
    release_date?: string | null
    created_at?: string | null
    updated_at?: string | null
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
