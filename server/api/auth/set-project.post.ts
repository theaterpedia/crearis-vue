import { defineEventHandler, readBody, createError, getCookie } from 'h3'
import { db } from '../../database/init'
import { sessions } from '../../utils/session-store'

// Helper function to calculate capabilities based on project record
function calculateCapabilities(project: {
    isOwner: boolean
    isMember: boolean
    isInstructor: boolean
    isAuthor: boolean
}): Record<string, Set<string>> {
    const capabilities: Record<string, Set<string>> = {}

    // Owner has full access
    if (project.isOwner) {
        capabilities.project = new Set(['settings', 'events', 'posts'])
        return capabilities
    }

    // Member has broad access
    if (project.isMember) {
        capabilities.project = new Set(['events.create', 'events.alter', 'posts.create', 'posts.alter'])
    }

    // Author can manage posts
    if (project.isAuthor) {
        if (!capabilities.project) capabilities.project = new Set()
        capabilities.project.add('events.alter')
        capabilities.project.add('posts.create')
        capabilities.project.add('posts.alter')
    }

    // Instructor can manage posts
    if (project.isInstructor) {
        if (!capabilities.project) capabilities.project = new Set()
        capabilities.project.add('posts.alter')
        capabilities.project.add('posts.create')
    }

    return capabilities
}

export default defineEventHandler(async (event) => {
    const sessionId = getCookie(event, 'sessionId')

    if (!sessionId || !sessions.has(sessionId)) {
        throw createError({
            statusCode: 401,
            message: 'Not authenticated'
        })
    }

    const session = sessions.get(sessionId)!

    // Only allow in project role
    if (session.activeRole !== 'project') {
        throw createError({
            statusCode: 403,
            message: 'Project role required'
        })
    }

    const body = await readBody(event)
    const { projectId } = body

    // If clearing project selection
    if (projectId === null) {
        session.projectId = null
        session.projectName = undefined
        session.capabilities = {}
        sessions.set(sessionId, session)

        return {
            success: true,
            projectId: null
        }
    }

    // Validate project exists in user's projects
    if (!session.projects || session.projects.length === 0) {
        throw createError({
            statusCode: 404,
            message: 'No projects available'
        })
    }

    const project = session.projects.find((p: any) => p.id === projectId)

    if (!project) {
        throw createError({
            statusCode: 404,
            message: 'Project not found or access denied'
        })
    }

    // Set active project
    session.projectId = project.id
    session.projectName = project.name

    // Calculate and set capabilities
    session.capabilities = calculateCapabilities(project)

    sessions.set(sessionId, session)

    return {
        success: true,
        projectId: project.id,
        projectName: project.name,
        capabilities: Object.fromEntries(
            Object.entries(session.capabilities).map(([key, value]) => [key, Array.from(value)])
        )
    }
})
