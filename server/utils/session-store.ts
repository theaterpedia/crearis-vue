/**
 * Session Store Utility
 * 
 * Centralized session storage to avoid circular dependencies between API routes.
 * Previously, sessions were exported from login.post.ts which caused 
 * "Cannot access before initialization" errors in the bundled output.
 */

interface ProjectRecord {
    id: string  // Legacy: stores domaincode for backward compatibility
    domaincode: string  // NEW: explicit domaincode field (same as id for now)
    name: string  // domaincode
    heading?: string  // heading from database
    username: string
    isOwner: boolean
    isMember: boolean
    isInstructor: boolean
    isAuthor: boolean
}

export interface SessionData {
    userId: number
    sysmail: string  // Added for permission checks
    username: string
    status: number | null  // User status for onboarding flow
    partner_id: number | null  // Linked partner for onboarding
    img_id: number | null  // Avatar image for onboarding
    availableRoles: string[]
    activeRole: string
    projectId: string | null
    projectName?: string
    projects?: ProjectRecord[]
    capabilities?: Record<string, Set<string>>
    expiresAt: number
}

// In-memory session store (for development - use Redis in production)
export const sessions = new Map<string, SessionData>()

// Clean up expired sessions every 5 minutes
setInterval(() => {
    const now = Date.now()
    for (const [sessionId, session] of sessions.entries()) {
        if (session.expiresAt < now) {
            sessions.delete(sessionId)
        }
    }
}, 5 * 60 * 1000)
