/**
 * Type definitions for demo-data entities
 */

export interface Event {
    id: string
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
    project?: string
    template?: string
    public_user?: string
    location?: string
}

export interface Post {
    id: string
    name: string
    teaser?: string
    content?: string
    cimg?: string
    date_published?: string
    isbase: number
    project?: string
    template?: string
    public_user?: string
}

export interface Location {
    id: string
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
}

export interface Instructor {
    id: string
    name: string
    description?: string
    phone?: string
    email?: string
    city?: string
    cimg?: string
    isbase: number
}

export interface Participant {
    id: string
    name: string
    type: 'teen' | 'kid' | 'adult'
    age?: number
    email?: string
    phone?: string
    isbase: number
    project_events?: string // JSON array of event IDs
}

export interface Task {
    id: string
    title: string
    description?: string
    status: 'idea' | 'new' | 'draft' | 'final' | 'reopen'
    category: 'main' | 'admin' | 'custom'
    priority: 'low' | 'medium' | 'high' | 'urgent'
    record_type?: string
    record_id?: string
    assigned_to?: string
    due_date?: string
    release_id?: string
    image?: string
    prompt?: string
    logic?: string
    filter?: string
}

export interface Project {
    id: string
    name: string  // domaincode (mapped from database id)
    heading?: string  // heading field from database
    description?: string
    owner: string
    release?: string
    created_at?: string
    updated_at?: string
}

export interface Release {
    id: string
    version: string
    version_major: number
    version_minor: number
    description?: string
    release_date?: string
}

export interface User {
    id: string
    username: string
    email?: string
    role: 'admin' | 'user' | 'guest'
}

export interface Config {
    id: string
    key: string
    value: string
    description?: string
}
