/**
 * Database Table Field Types
 * 
 * AUTO-GENERATED from schema definition v0.0.2
 * Generated at: 2025-11-07T10:56:45.137Z
 * 
 * SCHEMA_REGISTRY: server/database/schema-definitions/v0.0.2.json
 * 
 * DO NOT EDIT MANUALLY - regenerate using:
 * npx tsx server/database/generate-types-from-schema.ts 0.0.2
 * 
 * These types represent the actual columns in the database tables.
 * Keep these in sync with the database schema by regenerating after migrations.
 * 
 * Usage:
 * - Use these types when preparing data for INSERT/UPDATE operations
 * - Ensures type safety and prevents referencing non-existent columns
 */

/**
 * Crearis_config table
 * Table: crearis_config
 */
export interface CrearisConfigTableFields {
    config: Record<string, any>
    id: number // default: nextval('crearis_config_id_seq'::regclass)
}

/**
 * Domains table
 * Table: domains
 */
export interface DomainsTableFields {
    admin_user_id?: number | null
    description?: string | null
    domainname?: string | null
    id: number // default: nextval('domains_id_seq'::regclass)
    project_id?: number | null
    sysdomain_id?: number | null
    textdomain?: string | null
    tld: string
}

/**
 * Event_instructors table
 * Table: event_instructors
 */
export interface EventInstructorsTableFields {
    added_at?: string | null // default: CURRENT_TIMESTAMP
    event_id: number
    instructor_id: number
}

/**
 * Events table
 * Table: events
 */
export interface EventsTableFields {
    address_id?: string | null
    cimg?: string | null
    created_at?: string | null
    date_begin?: string | null
    date_end?: string | null
    event_type?: string | null
    header_type?: string | null
    html?: string | null
    id: number // default: nextval('events_id_seq'::regclass)
    img_id?: number | null
    img_show?: boolean | null // default: false
    img_square?: Record<string, any> | null
    img_thumb?: Record<string, any> | null
    img_vert?: Record<string, any> | null
    img_wide?: Record<string, any> | null
    isbase?: number | null // default: 0
    lang?: string | null // default: 'de'::text
    location?: number | null
    md?: string | null
    name?: string | null
    project_id?: number | null
    public_user?: number | null
    rectitle?: string | null
    regio_id?: number | null
    seats_max?: number | null
    status?: string | null
    status_display?: string | null // GENERATED COLUMN (read-only)
    status_val?: Buffer | null
    tags_display?: any | null // default: '{}'::text[], GENERATED COLUMN (read-only)
    tags_ids?: any | null // default: '{}'::integer[]
    teaser?: string | null
    template?: string | null
    updated_at?: string | null
    user_id?: number | null
    version_id?: string | null
    xmlid?: string | null
}

/**
 * Events_tags table
 * Table: events_tags
 */
export interface EventsTagsTableFields {
    created_at?: string | null // default: CURRENT_TIMESTAMP
    event_id: number
    tag_id: number
}

/**
 * Form_input table
 * Table: form_input
 */
export interface FormInputTableFields {
    created_at?: string | null // default: CURRENT_TIMESTAMP
    email?: string | null
    id: string // default: (gen_random_uuid())::text
    input?: Record<string, any> | null
    name?: string | null
    project: number
    updated_at?: string | null // default: CURRENT_TIMESTAMP
    user?: string | null
}

/**
 * Hero_overrides table
 * Table: hero_overrides
 */
export interface HeroOverridesTableFields {
    cimg?: string | null
    created_at?: string | null // default: CURRENT_TIMESTAMP
    description?: string | null
    event_ids?: string | null
    heading?: string | null
    id: string
    updated_at?: string | null
}

/**
 * I18n_codes table
 * Table: i18n_codes
 */
export interface I18nCodesTableFields {
    created_at?: string | null // default: CURRENT_TIMESTAMP
    id: number // default: nextval('i18n_codes_id_seq'::regclass)
    name: string
    status: string // default: 'de'::text
    text: Record<string, any>
    type: string
    updated_at?: string | null // default: CURRENT_TIMESTAMP
    variation?: string | null // default: 'false'::text
}

/**
 * Images table
 * Table: images
 */
export interface ImagesTableFields {
    about?: string | null
    alt_text?: string | null
    author?: any | null
    created_at?: string | null // default: CURRENT_TIMESTAMP
    ctags?: any | null // default: '\x00'::bytea
    date?: string | null // default: CURRENT_TIMESTAMP
    embedformat?: any | null
    fileformat?: any | null // default: 'none'::image_file_type
    geo?: Record<string, any> | null
    has_issues?: boolean | null // default: false
    id: number // default: nextval('images_id_seq'::regclass)
    img_show?: boolean | null // default: false
    img_square?: Record<string, any> | null
    img_thumb?: Record<string, any> | null
    img_vert?: Record<string, any> | null
    img_wide?: Record<string, any> | null
    is_deprecated?: boolean | null // default: false
    is_internal?: boolean | null // default: false
    is_private?: boolean | null // default: false
    is_public?: boolean | null // default: false
    length?: number | null
    license?: any | null // default: 'BY'::media_licence
    name: string
    creator_id?: number | null  // Migration 050: renamed from owner_id
    producer?: any | null
    project_domaincode?: string | null
    project_id?: number | null
    publisher?: any | null
    root_id?: number | null
    rtags?: any | null // default: '\x00'::bytea
    shape_square?: any | null
    shape_thumb?: any | null
    shape_vertical?: any | null
    shape_wide?: any | null
    status_val?: Buffer | null
    title?: string | null
    updated_at?: string | null // default: CURRENT_TIMESTAMP
    url: string
    use_player?: boolean | null // default: false
    variations?: any | null
    x?: number | null
    xmlid?: string | null
    y?: number | null
}

/**
 * Instructors table
 * Table: instructors
 */
export interface InstructorsTableFields {
    cimg?: string | null
    city?: string | null
    country_id?: string | null
    created_at?: string | null // default: CURRENT_TIMESTAMP
    description?: string | null
    email?: string | null
    event_xmlid?: string | null
    header_size?: string | null
    header_type?: string | null
    html?: string | null
    id: number // default: nextval('instructors_id_seq'::regclass)
    img_id?: number | null
    img_show?: boolean | null // default: false
    img_square?: Record<string, any> | null
    img_thumb?: Record<string, any> | null
    img_vert?: Record<string, any> | null
    img_wide?: Record<string, any> | null
    is_user?: boolean | null // default: false
    isbase?: number | null // default: 0
    lang: string // default: 'de'::text
    md?: string | null
    multiproject?: string | null // default: 'yes'::text
    name: string
    phone?: string | null
    regio_id?: number | null
    status_display?: string | null // GENERATED COLUMN (read-only)
    status_val?: Buffer | null
    updated_at?: string | null
    version_id?: string | null
    xmlid?: string | null
}

/**
 * Interactions table
 * Table: interactions
 */
export interface InteractionsTableFields {
    actions?: Record<string, any> | null
    fields?: Record<string, any> | null
    from_mail?: string | null
    id: number // default: nextval('interactions_id_seq'::regclass)
    md?: string | null
    name: string
    project_id?: number | null
    status_id: number
    subject?: string | null
    timestamp: string // default: CURRENT_TIMESTAMP
    to_mail?: string | null
    user_id?: number | null
}

/**
 * Locations table
 * Table: locations
 */
export interface LocationsTableFields {
    category_id?: string | null
    cimg?: string | null
    city?: string | null
    country_id?: string | null
    created_at?: string | null // default: CURRENT_TIMESTAMP
    email?: string | null
    event_xmlid?: string | null
    header_size?: string | null
    header_type?: string | null
    id: number // default: nextval('locations_id_seq'::regclass)
    img_id?: number | null
    img_show?: boolean | null // default: false
    img_square?: Record<string, any> | null
    img_thumb?: Record<string, any> | null
    img_vert?: Record<string, any> | null
    img_wide?: Record<string, any> | null
    is_company?: string | null
    is_location_provider?: string | null
    isbase?: number | null // default: 0
    lang: string // default: 'de'::text
    md?: string | null
    name: string
    phone?: string | null
    project_id?: number | null
    status_display?: string | null // GENERATED COLUMN (read-only)
    status_val?: Buffer | null
    street?: string | null
    updated_at?: string | null
    version_id?: string | null
    xmlid?: string | null
    zip?: string | null
}

/**
 * Page_sections table
 * Table: page_sections
 */
export interface PageSectionsTableFields {
    created_at?: string | null // default: CURRENT_TIMESTAMP
    heading?: string | null
    id: string // default: (gen_random_uuid())::text
    page: string
    scope: string
    type: string
    updated_at?: string | null // default: CURRENT_TIMESTAMP
}

/**
 * Pages table
 * Table: pages
 */
export interface PagesTableFields {
    aside_has_content?: boolean | null
    aside_options?: Record<string, any> | null // default: '{}'::jsonb
    created_at?: string | null // default: CURRENT_TIMESTAMP
    footer_has_content?: boolean | null
    footer_options?: Record<string, any> | null // default: '{}'::jsonb
    header_has_content?: boolean | null
    header_options?: Record<string, any> | null // default: '{}'::jsonb
    header_size?: string | null // default: 'mini' (Migration 066)
    header_type?: string | null // default: 'simple'::text
    id: string // default: (gen_random_uuid())::text
    page_has_content?: boolean | null
    page_options?: Record<string, any> | null // default: '{}'::jsonb
    page_type: string
    project: number
    updated_at?: string | null // default: CURRENT_TIMESTAMP
}

/**
 * Participants table
 * Table: participants
 */
export interface ParticipantsTableFields {
    age?: number | null
    cimg?: string | null
    city?: string | null
    country_id?: string | null
    created_at?: string | null // default: CURRENT_TIMESTAMP
    description?: string | null
    event_xmlid?: string | null
    id: number // default: nextval('participants_id_seq'::regclass)
    is_user?: boolean | null // default: false
    lang: string // default: 'de'::text
    name: string
    status_display?: string | null // GENERATED COLUMN (read-only)
    status_val?: Buffer | null
    type?: string | null
    updated_at?: string | null
    version_id?: string | null
    xmlid?: string | null
}

/**
 * Posts table
 * Table: posts
 */
export interface PostsTableFields {
    author_id?: string | null
    blog_id?: string | null
    cimg?: string | null
    cover_properties?: string | null
    created_at?: string | null
    event_xmlid?: string | null
    header_size?: string | null // default: 'mini' (Migration 066)
    header_type?: string | null
    html?: string | null
    id: number // default: nextval('posts_id_seq'::regclass)
    img_id?: number | null
    img_show?: boolean | null // default: false
    img_square?: Record<string, any> | null
    img_thumb?: Record<string, any> | null
    img_vert?: Record<string, any> | null
    img_wide?: Record<string, any> | null
    is_published?: string | null
    isbase?: number | null // default: 0
    lang?: string | null // default: 'de'::text
    md?: string | null
    name?: string | null
    creator_id?: number | null  // Migration 050: renamed from owner_id
    post_date?: string | null
    project_id?: number | null
    public_user?: number | null
    regio_id?: number | null
    // Role visibility columns (Migration 046 - maintained by triggers)
    r_anonym?: boolean | null  // default: false
    r_partner?: boolean | null  // default: false
    r_participant?: boolean | null  // default: false
    r_member?: boolean | null  // default: true
    r_creator?: boolean | null  // default: true (Migration 050: renamed from r_owner)
    status?: string | null
    status_display?: string | null // GENERATED COLUMN (read-only)
    status_val?: Buffer | null
    subtitle?: string | null
    tag_ids?: string | null
    tags_display?: any | null // default: '{}'::text[], GENERATED COLUMN (read-only)
    tags_ids?: any | null // default: '{}'::integer[]
    teaser?: string | null
    template?: string | null
    updated_at?: string | null
    version_id?: string | null
    website_published?: string | null
    xmlid?: string | null
}

/**
 * Posts_tags table
 * Table: posts_tags
 */
export interface PostsTagsTableFields {
    created_at?: string | null // default: CURRENT_TIMESTAMP
    post_id: number
    tag_id: number
}

/**
 * Project_members table
 * Table: project_members
 */
export interface ProjectMembersTableFields {
    added_at?: string | null // default: CURRENT_TIMESTAMP
    project_id: number
    role?: string | null // default: 'member'::text
    user_id: number
}

/**
 * Projects table
 * Table: projects
 */
export interface ProjectsTableFields {
    aside_context?: Record<string, any> | null // default: '{}'::jsonb
    aside_has_content?: boolean | null
    aside_list?: string | null // default: ''::text
    aside_options_ext?: Record<string, any> | null // default: '{}'::jsonb
    aside_postit?: Record<string, any> | null // default: '{}'::jsonb
    aside_toc?: Record<string, any> | null // default: '{}'::jsonb
    cimg?: string | null
    config?: Record<string, any> | null
    created_at?: string | null // default: CURRENT_TIMESTAMP
    cta_entity?: string | null
    cta_form?: string | null
    cta_link?: string | null
    cta_title?: string | null
    description?: string | null
    domain_id?: number | null
    domaincode: string
    footer_gallery?: string | null // default: ''::text
    footer_has_content?: boolean | null
    footer_options_ext?: Record<string, any> | null // default: '{}'::jsonb
    footer_postit?: Record<string, any> | null // default: '{}'::jsonb
    footer_repeat?: Record<string, any> | null // default: '{}'::jsonb
    footer_sitemap?: string | null // default: ''::text
    footer_slider?: string | null // default: ''::text
    header_alert?: Record<string, any> | null // default: '{}'::jsonb
    header_has_content?: boolean | null
    header_options_ext?: Record<string, any> | null // default: '{}'::jsonb
    header_postit?: Record<string, any> | null // default: '{}'::jsonb
    header_size?: string | null
    header_type?: string | null
    heading?: string | null
    html?: string | null
    id: number // default: nextval('projects_id_seq'::regclass)
    img_id?: number | null
    img_show?: boolean | null // default: false
    img_square?: Record<string, any> | null
    img_thumb?: Record<string, any> | null
    img_vert?: Record<string, any> | null
    img_wide?: Record<string, any> | null
    is_company?: boolean | null // default: false
    is_location_provider?: boolean | null // default: false
    is_onepage?: boolean | null
    is_regio?: boolean | null
    is_service?: boolean | null
    is_sidebar?: boolean | null
    is_topic?: boolean | null
    md?: string | null
    member_ids?: Record<string, any> | null
    name?: string | null
    owner_id?: number | null
    page_background?: string | null // default: ''::text
    page_cssvars?: Record<string, any> | null // default: '{}'::jsonb
    page_has_content?: boolean | null
    page_navigation?: Record<string, any> | null // default: '{}'::jsonb
    page_options_ext?: Record<string, any> | null // default: '{}'::jsonb
    partner_projects?: string | null
    regio?: number | null
    status_val?: Buffer | null
    status_old?: string | null // default: 'new'::text
    team_page?: string | null // default: 'yes'::text
    teaser?: string | null
    theme?: number | null
    type?: string | null // default: 'project'::text
    updated_at?: string | null
}

/**
 * Record_versions table
 * Table: record_versions
 */
export interface RecordVersionsTableFields {
    created_at?: string | null // default: CURRENT_TIMESTAMP
    data: string
    id: string
    record_id: string
    record_type: string
    version_id: string
}

/**
 * Releases table
 * Table: releases
 */
export interface ReleasesTableFields {
    created_at?: string | null // default: CURRENT_TIMESTAMP
    description?: string | null
    id: string
    release_date?: string | null
    state?: string | null // default: 'idea'::text
    updated_at?: string | null
    version: string
    version_major: number
    version_minor: number
}

/**
 * Status table
 * Table: status
 */
export interface StatusTableFields {
    desc_i18n?: Record<string, any> | null
    description?: string | null
    id: number // default: nextval('status_id_seq'::regclass)
    name: string
    name_i18n?: Record<string, any> | null
    table: string
    value: number
}

/**
 * Sysdomains table
 * Table: sysdomains
 */
export interface SysdomainsTableFields {
    description?: string | null
    domain: string
    domainstring?: string | null
    id: number // default: nextval('sysdomains_id_seq'::regclass)
    options?: Record<string, any> | null
    subdomain?: string | null
    tld: string
}

/**
 * System_config table
 * Table: system_config
 */
export interface SystemConfigTableFields {
    description?: string | null
    key: string
    updated_at?: string | null // default: CURRENT_TIMESTAMP
    value: string
}

/**
 * Tags table
 * Table: tags
 */
export interface TagsTableFields {
    desc_i18n?: Record<string, any> | null
    description?: string | null
    id: number // default: nextval('tags_id_seq'::regclass)
    name: string
    name_i18n?: Record<string, any> | null
}

/**
 * Tasks table
 * Table: tasks
 */
export interface TasksTableFields {
    assigned_to?: string | null
    category?: string | null // default: 'project'::text
    cimg?: string | null
    completed_at?: string | null
    created_at?: string | null // default: CURRENT_TIMESTAMP
    description?: string | null
    due_date?: string | null
    entity_name?: string | null
    filter?: string | null
    id: string
    lang: string // default: 'de'::text
    logic?: string | null
    name: string
    priority?: string | null // default: 'medium'::text
    prompt?: string | null
    record_id?: string | null
    record_type?: string | null
    release_id?: string | null
    status_display?: string | null // GENERATED COLUMN (read-only)
    status_val?: Buffer | null
    updated_at?: string | null
    version_id?: string | null
}

/**
 * Tlds table
 * Table: tlds
 */
export interface TldsTableFields {
    description?: string | null
    name: string
    relevance?: number | null
}

/**
 * Users table
 * Table: users
 */
export interface UsersTableFields {
    created_at?: string | null // default: CURRENT_TIMESTAMP
    extmail?: string | null
    id: number // default: nextval('users_id_seq'::regclass)
    img_id?: number | null
    img_show?: boolean | null // default: false
    img_square?: Record<string, any> | null
    img_thumb?: Record<string, any> | null
    img_vert?: Record<string, any> | null
    img_wide?: Record<string, any> | null
    partner_id?: number | null // Link to partners table (replaces instructor_id and participant_id)
    lang: string // default: 'de'::text
    password: string
    role: string
    status_display?: string | null // GENERATED COLUMN (read-only)
    status_val?: Buffer | null
    sysmail: string
    updated_at?: string | null // default: CURRENT_TIMESTAMP
    username: string
}

/**
 * Versions table
 * Table: versions
 */
export interface VersionsTableFields {
    created_at?: string | null // default: CURRENT_TIMESTAMP
    created_by?: string | null
    csv_exported?: number | null // default: 0
    description?: string | null
    id: string
    is_active?: number | null // default: 0
    name: string
    notes?: string | null
    snapshot_data?: string | null
    version_number: string
}

// Type guard functions

export function isValidCrearisConfigField(key: string): key is keyof CrearisConfigTableFields {
    const validFields: (keyof CrearisConfigTableFields)[] = [
        'id', 'config'
    ]
    return validFields.includes(key as keyof CrearisConfigTableFields)
}

export function isValidDomainsField(key: string): key is keyof DomainsTableFields {
    const validFields: (keyof DomainsTableFields)[] = [
        'id', 'sysdomain_id', 'tld', 'textdomain', 'admin_user_id', 'project_id', 'description', 'domainname'
    ]
    return validFields.includes(key as keyof DomainsTableFields)
}

export function isValidEventInstructorsField(key: string): key is keyof EventInstructorsTableFields {
    const validFields: (keyof EventInstructorsTableFields)[] = [
        'event_id', 'instructor_id', 'added_at'
    ]
    return validFields.includes(key as keyof EventInstructorsTableFields)
}

export function isValidEventsField(key: string): key is keyof EventsTableFields {
    const validFields: (keyof EventsTableFields)[] = [
        'id', 'xmlid', 'name', 'date_begin', 'date_end', 'address_id', 'user_id', 'seats_max', 'cimg', 'header_type', 'rectitle', 'teaser', 'version_id', 'created_at', 'updated_at', 'status', 'isbase', 'template', 'public_user', 'location', 'event_type', 'md', 'html', 'status_id', 'lang', 'tags_ids', 'tags_display', 'project_id', 'regio_id', 'img_id', 'img_show', 'img_thumb', 'img_square', 'img_wide', 'img_vert', 'status_display'
    ]
    return validFields.includes(key as keyof EventsTableFields)
}

export function isValidEventsTagsField(key: string): key is keyof EventsTagsTableFields {
    const validFields: (keyof EventsTagsTableFields)[] = [
        'event_id', 'tag_id', 'created_at'
    ]
    return validFields.includes(key as keyof EventsTagsTableFields)
}

export function isValidFormInputField(key: string): key is keyof FormInputTableFields {
    const validFields: (keyof FormInputTableFields)[] = [
        'id', 'project', 'name', 'email', 'user', 'input', 'created_at', 'updated_at'
    ]
    return validFields.includes(key as keyof FormInputTableFields)
}

export function isValidHeroOverridesField(key: string): key is keyof HeroOverridesTableFields {
    const validFields: (keyof HeroOverridesTableFields)[] = [
        'id', 'cimg', 'heading', 'description', 'event_ids', 'created_at', 'updated_at'
    ]
    return validFields.includes(key as keyof HeroOverridesTableFields)
}

export function isValidI18nCodesField(key: string): key is keyof I18nCodesTableFields {
    const validFields: (keyof I18nCodesTableFields)[] = [
        'id', 'name', 'variation', 'type', 'text', 'status', 'created_at', 'updated_at'
    ]
    return validFields.includes(key as keyof I18nCodesTableFields)
}

export function isValidImagesField(key: string): key is keyof ImagesTableFields {
    const validFields: (keyof ImagesTableFields)[] = [
        'id', 'xmlid', 'name', 'url', 'project_id', 'project_domaincode', 'status_id', 'owner_id', 'alt_text', 'title', 'date', 'geo', 'x', 'y', 'shape_wide', 'shape_square', 'shape_vertical', 'shape_thumb', 'fileformat', 'embedformat', 'license', 'length', 'about', 'author', 'producer', 'publisher', 'variations', 'root_id', 'use_player', 'ctags', 'is_public', 'is_private', 'is_internal', 'is_deprecated', 'has_issues', 'rtags', 'created_at', 'updated_at', 'img_show', 'img_thumb', 'img_square', 'img_wide', 'img_vert'
    ]
    return validFields.includes(key as keyof ImagesTableFields)
}

export function isValidInstructorsField(key: string): key is keyof InstructorsTableFields {
    const validFields: (keyof InstructorsTableFields)[] = [
        'id', 'xmlid', 'name', 'email', 'phone', 'city', 'country_id', 'cimg', 'description', 'event_xmlid', 'version_id', 'status_id', 'multiproject', 'header_type', 'md', 'html', 'isbase', 'created_at', 'updated_at', 'is_user', 'header_size', 'regio_id', 'img_id', 'img_show', 'img_thumb', 'img_square', 'img_wide', 'img_vert', 'lang', 'status_display'
    ]
    return validFields.includes(key as keyof InstructorsTableFields)
}

export function isValidInteractionsField(key: string): key is keyof InteractionsTableFields {
    const validFields: (keyof InteractionsTableFields)[] = [
        'id', 'user_id', 'name', 'project_id', 'timestamp', 'status_id', 'actions', 'to_mail', 'from_mail', 'subject', 'md', 'fields'
    ]
    return validFields.includes(key as keyof InteractionsTableFields)
}

export function isValidLocationsField(key: string): key is keyof LocationsTableFields {
    const validFields: (keyof LocationsTableFields)[] = [
        'id', 'xmlid', 'name', 'phone', 'email', 'city', 'zip', 'street', 'country_id', 'is_company', 'category_id', 'cimg', 'header_type', 'header_size', 'md', 'is_location_provider', 'event_xmlid', 'version_id', 'status_id', 'project_id', 'isbase', 'created_at', 'updated_at', 'img_id', 'img_show', 'img_thumb', 'img_square', 'img_wide', 'img_vert', 'lang', 'status_display'
    ]
    return validFields.includes(key as keyof LocationsTableFields)
}

export function isValidPageSectionsField(key: string): key is keyof PageSectionsTableFields {
    const validFields: (keyof PageSectionsTableFields)[] = [
        'id', 'page', 'scope', 'type', 'heading', 'created_at', 'updated_at'
    ]
    return validFields.includes(key as keyof PageSectionsTableFields)
}

export function isValidPagesField(key: string): key is keyof PagesTableFields {
    const validFields: (keyof PagesTableFields)[] = [
        'id', 'project', 'header_type', 'page_type', 'created_at', 'updated_at', 'page_options', 'header_options', 'aside_options', 'footer_options', 'page_has_content', 'aside_has_content', 'header_has_content', 'footer_has_content'
    ]
    return validFields.includes(key as keyof PagesTableFields)
}

export function isValidParticipantsField(key: string): key is keyof ParticipantsTableFields {
    const validFields: (keyof ParticipantsTableFields)[] = [
        'id', 'xmlid', 'name', 'age', 'city', 'country_id', 'cimg', 'description', 'event_xmlid', 'type', 'version_id', 'status_id', 'created_at', 'updated_at', 'is_user', 'lang', 'status_display'
    ]
    return validFields.includes(key as keyof ParticipantsTableFields)
}

export function isValidPostsField(key: string): key is keyof PostsTableFields {
    const validFields: (keyof PostsTableFields)[] = [
        'id', 'xmlid', 'name', 'subtitle', 'teaser', 'author_id', 'blog_id', 'tag_ids', 'website_published', 'is_published', 'post_date', 'cover_properties', 'event_xmlid', 'cimg', 'version_id', 'created_at', 'updated_at', 'status', 'isbase', 'template', 'public_user', 'header_type', 'md', 'html', 'status_id', 'lang', 'tags_ids', 'tags_display', 'project_id', 'regio_id', 'img_id', 'img_show', 'img_thumb', 'img_square', 'img_wide', 'img_vert', 'status_display'
    ]
    return validFields.includes(key as keyof PostsTableFields)
}

export function isValidPostsTagsField(key: string): key is keyof PostsTagsTableFields {
    const validFields: (keyof PostsTagsTableFields)[] = [
        'post_id', 'tag_id', 'created_at'
    ]
    return validFields.includes(key as keyof PostsTagsTableFields)
}

export function isValidProjectMembersField(key: string): key is keyof ProjectMembersTableFields {
    const validFields: (keyof ProjectMembersTableFields)[] = [
        'project_id', 'user_id', 'role', 'added_at'
    ]
    return validFields.includes(key as keyof ProjectMembersTableFields)
}

export function isValidProjectsField(key: string): key is keyof ProjectsTableFields {
    const validFields: (keyof ProjectsTableFields)[] = [
        'id', 'domaincode', 'name', 'description', 'status_old', 'owner_id', 'created_at', 'updated_at', 'header_type', 'header_size', 'md', 'html', 'type', 'is_regio', 'is_topic', 'is_onepage', 'is_service', 'is_sidebar', 'regio', 'partner_projects', 'heading', 'theme', 'cimg', 'teaser', 'team_page', 'cta_title', 'cta_form', 'cta_entity', 'cta_link', 'is_company', 'is_location_provider', 'config', 'domain_id', 'member_ids', 'page_background', 'page_cssvars', 'page_navigation', 'page_options_ext', 'aside_postit', 'aside_toc', 'aside_list', 'aside_context', 'aside_options_ext', 'header_alert', 'header_postit', 'header_options_ext', 'footer_gallery', 'footer_postit', 'footer_slider', 'footer_repeat', 'footer_sitemap', 'footer_options_ext', 'page_has_content', 'aside_has_content', 'header_has_content', 'footer_has_content', 'img_id', 'img_show', 'img_thumb', 'img_square', 'img_wide', 'img_vert', 'status_id'
    ]
    return validFields.includes(key as keyof ProjectsTableFields)
}

export function isValidRecordVersionsField(key: string): key is keyof RecordVersionsTableFields {
    const validFields: (keyof RecordVersionsTableFields)[] = [
        'id', 'version_id', 'record_type', 'record_id', 'data', 'created_at'
    ]
    return validFields.includes(key as keyof RecordVersionsTableFields)
}

export function isValidReleasesField(key: string): key is keyof ReleasesTableFields {
    const validFields: (keyof ReleasesTableFields)[] = [
        'id', 'version', 'version_major', 'version_minor', 'description', 'state', 'release_date', 'created_at', 'updated_at'
    ]
    return validFields.includes(key as keyof ReleasesTableFields)
}

export function isValidStatusField(key: string): key is keyof StatusTableFields {
    const validFields: (keyof StatusTableFields)[] = [
        'id', 'value', 'name', 'table', 'description', 'name_i18n', 'desc_i18n'
    ]
    return validFields.includes(key as keyof StatusTableFields)
}

export function isValidSysdomainsField(key: string): key is keyof SysdomainsTableFields {
    const validFields: (keyof SysdomainsTableFields)[] = [
        'id', 'tld', 'domain', 'subdomain', 'description', 'options', 'domainstring'
    ]
    return validFields.includes(key as keyof SysdomainsTableFields)
}

export function isValidSystemConfigField(key: string): key is keyof SystemConfigTableFields {
    const validFields: (keyof SystemConfigTableFields)[] = [
        'key', 'value', 'description', 'updated_at'
    ]
    return validFields.includes(key as keyof SystemConfigTableFields)
}

export function isValidTagsField(key: string): key is keyof TagsTableFields {
    const validFields: (keyof TagsTableFields)[] = [
        'id', 'name', 'description', 'name_i18n', 'desc_i18n'
    ]
    return validFields.includes(key as keyof TagsTableFields)
}

export function isValidTasksField(key: string): key is keyof TasksTableFields {
    const validFields: (keyof TasksTableFields)[] = [
        'id', 'name', 'description', 'category', 'priority', 'record_type', 'record_id', 'assigned_to', 'created_at', 'updated_at', 'due_date', 'completed_at', 'version_id', 'release_id', 'cimg', 'prompt', 'logic', 'filter', 'entity_name', 'status_id', 'lang', 'status_display'
    ]
    return validFields.includes(key as keyof TasksTableFields)
}

export function isValidTldsField(key: string): key is keyof TldsTableFields {
    const validFields: (keyof TldsTableFields)[] = [
        'name', 'description', 'relevance'
    ]
    return validFields.includes(key as keyof TldsTableFields)
}

export function isValidUsersField(key: string): key is keyof UsersTableFields {
    const validFields: (keyof UsersTableFields)[] = [
        'id', 'sysmail', 'extmail', 'username', 'password', 'role', 'status_val', 'partner_id', 'lang', 'created_at', 'updated_at', 'img_id', 'img_show', 'img_thumb', 'img_square', 'img_wide', 'img_vert', 'status_display'
    ]
    return validFields.includes(key as keyof UsersTableFields)
}

export function isValidVersionsField(key: string): key is keyof VersionsTableFields {
    const validFields: (keyof VersionsTableFields)[] = [
        'id', 'version_number', 'name', 'description', 'created_at', 'created_by', 'is_active', 'snapshot_data', 'csv_exported', 'notes'
    ]
    return validFields.includes(key as keyof VersionsTableFields)
}

/**
 * Filter an object to only include fields that exist in the table
 * Useful for preparing data for INSERT/UPDATE operations
 */
export function filterToTableFields<T extends Record<string, any>>(
    data: T,
    validFields: string[]
): Partial<T> {
    const filtered: Record<string, any> = {}
    for (const key of validFields) {
        if (key in data) {
            filtered[key] = data[key]
        }
    }
    return filtered as Partial<T>
}
