/**
 * Type definitions for crearis-vue entities
 * Updated for Migration 019 (auto-increment IDs, status_id) and Migration 020 (i18n)
 */

export interface Event {
    id: number  // Auto-increment INTEGER (Migration 019)
    xmlid?: string  // Old TEXT identifier for legacy compatibility (Migration 019)
    name: string
    teaser?: string
    description?: string
    cimg?: string
    date_begin?: string
    date_end?: string
    start_time?: string
    end_time?: string
    event_type?: string
    isbase: number
    project_id: number  // INTEGER FK to projects.id (Migration 019)
    template?: string
    public_user?: number  // INTEGER FK to instructors.id (Migration 019)
    location?: number  // INTEGER FK to locations.id (Migration 019)
    status_id: number  // INTEGER FK to status.id (Migration 019)
    status_display?: string  // Computed column (Migration 020)
    created_at?: string
    updated_at?: string
}

export interface Post {
    id: number  // Auto-increment INTEGER (Migration 019)
    xmlid?: string  // Old TEXT identifier for legacy compatibility (Migration 019)
    name: string
    teaser?: string
    content?: string
    cimg?: string
    date_published?: string
    isbase: number
    project_id: number  // INTEGER FK to projects.id (Migration 019)
    template?: string
    public_user?: number  // INTEGER FK to instructors.id (Migration 019)
    author_id?: number  // INTEGER FK to users.id (Migration 019)
    status_id: number  // INTEGER FK to status.id (Migration 019)
    status_display?: string  // Computed column (Migration 020)
    created_at?: string
    updated_at?: string
}

export interface Location {
    id: number  // Auto-increment INTEGER (Migration 019)
    name: string
    street?: string
    zip?: string
    city?: string
    country?: string
    phone?: string
    email?: string
    website?: string
    cimg?: string
    description?: string
    isbase: number
    status_id: number  // INTEGER FK to status.id (Migration 019)
    status_display?: string  // Computed column (Migration 020)
    lang: string  // 'de' | 'en' | 'cz' (Migration 020)
    created_at?: string
    updated_at?: string
}

export interface Instructor {
    id: number  // Auto-increment INTEGER (Migration 019)
    name: string
    description?: string
    phone?: string
    email?: string
    city?: string
    cimg?: string
    isbase: number
    status_id: number  // INTEGER FK to status.id (Migration 019)
    status_display?: string  // Computed column (Migration 020)
    lang: string  // 'de' | 'en' | 'cz' (Migration 020)
    created_at?: string
    updated_at?: string
}

export interface Participant {
    id: number  // Auto-increment INTEGER (Migration 019)
    name: string
    type: 'teen' | 'kid' | 'adult'
    age?: number
    email?: string
    phone?: string
    isbase: number
    project_events?: string // JSON array of event IDs
    status_id: number  // INTEGER FK to status.id (Migration 019)
    status_display?: string  // Computed column (Migration 020)
    lang: string  // 'de' | 'en' | 'cz' (Migration 020)
    created_at?: string
    updated_at?: string
}

export interface Task {
    id: string  // nanoid (kept as TEXT)
    name: string  // Renamed from title (Migration 019)
    description?: string
    status_id: number  // INTEGER FK to status.id (Migration 019)
    status_display?: string  // Computed column (Migration 020)
    status_value?: number  // From JOIN with status table
    status_name?: string  // From JOIN with status table
    category: 'main' | 'admin' | 'release'
    priority: 'low' | 'medium' | 'high' | 'urgent'
    record_type?: string
    record_id?: string
    assigned_to?: string
    due_date?: string
    completed_at?: string
    release_id?: string
    cimg?: string  // Renamed from image (Migration 019)
    prompt?: string
    lang: string  // 'de' | 'en' | 'cz' (Migration 020)
    created_at?: string
    updated_at?: string
}

export interface Project {
    id: number  // Auto-increment INTEGER PRIMARY KEY (Migration 019)
    domaincode: string  // Unique TEXT identifier (old id value)
    name?: string  // Project title/display name
    heading?: string  // Legacy field for backward compatibility
    description?: string
    owner_id: number  // INTEGER FK to users.id (Migration 019)
    status?: string  // Project status
    type?: string  // 'project' | 'regio' | 'special' | 'topic' | 'location'
    is_regio?: boolean  // Computed column
    is_topic?: boolean  // Computed column
    is_onepage?: boolean  // Computed column
    is_service?: boolean  // Computed column
    regio?: number  // INTEGER FK to projects.id (self-reference)
    theme?: number
    cimg?: string
    teaser?: string
    config?: any  // JSONB
    domain_id?: number  // INTEGER FK to domains.id
    created_at?: string
    updated_at?: string
}

export interface Release {
    id: string  // nanoid (kept as TEXT)
    version: string
    version_major: number
    version_minor: number
    description?: string
    state: 'idea' | 'draft' | 'final' | 'trash'
    release_date?: string
    created_at?: string
    updated_at?: string
}

export interface Status {
    id: number  // Auto-increment INTEGER PRIMARY KEY
    table: string  // Table this status applies to
    value: number  // Numeric status value
    name: string  // Status name/identifier
    name_i18n: any  // JSONB with translations {de: '...', en: '...', cz: '...'}
    desc_i18n?: any  // JSONB with description translations (optional)
}

export interface StatusInfo {
    id: number
    value: number
    name: string
    displayName: string  // Translated name based on language
    displayDesc: string | null  // Translated description
}

export interface User {
    id: number  // Auto-increment INTEGER (Migration 019)
    sysmail: string  // System email (unique, required)
    extmail?: string  // External email (unique, optional)
    username: string
    password: string  // Password hash
    role: 'admin' | 'user' | 'base'
    status_id: number  // INTEGER FK to status.id (Migration 019)
    status_display?: string  // Computed column (Migration 020)
    instructor_id?: number  // INTEGER FK to instructors.id (Migration 019)
    lang: string  // 'de' | 'en' | 'cz' (Migration 020)
    created_at?: string
    updated_at?: string
}

export interface Config {
    id: string
    key: string
    value: string
    description?: string
}
