/**
 * useAdminActions - Composable for admin action registry
 * 
 * Provides three patterns:
 * 1. SimpleButton: Execute action, show toast on completion
 * 2. StateButton: Show state on button (icon, taskId, message)
 * 3. CallbackLogic: Execute callback function with result
 * 
 * All actions have consistent signature:
 * - input: string | number | object
 * - actionState (optional): ref that will be updated (null | false | true | number | string)
 * - actionCallback (optional): function called with (state, result)
 */

import { ref, type Ref } from 'vue'

export type ActionState = null | boolean | number | string
export type ActionCallback = (state: ActionState, result: any) => void

export interface ActionOptions {
    actionState?: Ref<ActionState>
    actionCallback?: ActionCallback
}

export interface ActionResult {
    success: boolean
    data?: any
    error?: string
    taskId?: number
}

/**
 * Base action executor
 */
async function executeAction(
    endpoint: string,
    method: string,
    payload: any,
    options?: ActionOptions
): Promise<ActionResult> {
    const { actionState, actionCallback } = options || {}

    // Set state to null (processing)
    if (actionState) {
        actionState.value = null
    }

    try {
        const response = await fetch(endpoint, {
            method,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        })

        const result = await response.json()

        if (response.ok) {
            const finalState: ActionState = result.taskId ? result.taskId : true

            if (actionState) {
                actionState.value = finalState
            }

            if (actionCallback) {
                actionCallback(finalState, result)
            }

            return {
                success: true,
                data: result,
                taskId: result.taskId,
            }
        } else {
            if (actionState) {
                actionState.value = false
            }

            if (actionCallback) {
                actionCallback(false, result)
            }

            return {
                success: false,
                error: result.error || 'Action failed',
            }
        }
    } catch (error) {
        if (actionState) {
            actionState.value = false
        }

        if (actionCallback) {
            actionCallback(false, { error: (error as Error).message })
        }

        return {
            success: false,
            error: (error as Error).message,
        }
    }
}

/**
 * User Actions
 */

export async function createUser(
    input: string | number | { id: string; username: string; password: string; role: string },
    options?: ActionOptions
): Promise<ActionResult> {
    const payload = typeof input === 'object' ? input : { id: input }
    return executeAction('/api/users', 'POST', payload, options)
}

export async function alterUser(
    input: string | number | { id: string;[key: string]: any },
    options?: ActionOptions
): Promise<ActionResult> {
    const payload = typeof input === 'object' ? input : { id: input }
    const userId = typeof input === 'object' ? input.id : input
    return executeAction(`/api/users/${userId}`, 'PATCH', payload, options)
}

/**
 * Project Actions
 */

export async function createProject(
    input: string | number | { id: string; username: string; name: string; owner_id?: string },
    options?: ActionOptions
): Promise<ActionResult> {
    const payload = typeof input === 'object' ? input : { id: input }
    return executeAction('/api/projects', 'POST', payload, options)
}

export async function alterProject(
    input: string | number | { id: string;[key: string]: any },
    options?: ActionOptions
): Promise<ActionResult> {
    const payload = typeof input === 'object' ? input : { id: input }
    const projectId = typeof input === 'object' ? input.id : input
    return executeAction(`/api/projects/${projectId}`, 'PATCH', payload, options)
}

export async function createProjectForUser(
    input: { userId: string; projectData: { id: string; username: string; name: string; description?: string } },
    options?: ActionOptions
): Promise<ActionResult> {
    const payload = {
        ...input.projectData,
        owner_id: input.userId,
    }
    return executeAction('/api/projects', 'POST', payload, options)
}

/**
 * Domain Actions
 */

export async function createDomain(
    input: string | { domainname: string; admin_user_id?: string; project_id?: string },
    options?: ActionOptions
): Promise<ActionResult> {
    const payload = typeof input === 'object' ? input : { domainname: input }
    return executeAction('/api/domains', 'POST', payload, options)
}

export async function checkDomainAvailability(
    domainname: string
): Promise<{ available: boolean; domain?: any }> {
    try {
        const response = await fetch(`/api/domains/check?name=${encodeURIComponent(domainname)}`)
        const result = await response.json()
        return result
    } catch (error) {
        return { available: false }
    }
}

/**
 * User-Project Relationship Actions
 */

export async function addUserToProject(
    input: { userId: string; projectId: string },
    options?: ActionOptions
): Promise<ActionResult> {
    return executeAction('/api/projects/add-member', 'POST', input, options)
}

export async function removeUserFromProject(
    input: { userId: string; projectId: string },
    options?: ActionOptions
): Promise<ActionResult> {
    return executeAction('/api/projects/remove-member', 'POST', input, options)
}

export async function createUserForProject(
    input: { projectId: string; userData: { id: string; username: string; password: string; role: string } },
    options?: ActionOptions
): Promise<ActionResult> {
    // First create the user
    const userResult = await executeAction('/api/users', 'POST', input.userData, options)

    if (userResult.success && input.userData.id) {
        // Then add them to the project
        await addUserToProject({ userId: input.userData.id, projectId: input.projectId })
    }

    return userResult
}

/**
 * Validation Actions
 */

export async function validateEmail(
    email: string
): Promise<{ valid: boolean; reason?: string }> {
    try {
        const response = await fetch('/api/validate/email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email }),
        })
        const result = await response.json()
        return result
    } catch (error) {
        return { valid: false, reason: (error as Error).message }
    }
}

/**
 * Main composable export
 */
export function useAdminActions() {
    return {
        // User actions
        createUser,
        alterUser,

        // Project actions
        createProject,
        alterProject,
        createProjectForUser,

        // Domain actions
        createDomain,
        checkDomainAvailability,

        // Relationship actions
        addUserToProject,
        removeUserFromProject,
        createUserForProject,

        // Validation
        validateEmail,
    }
}
