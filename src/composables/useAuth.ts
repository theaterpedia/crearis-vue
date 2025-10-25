import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'

// After Migration 019 Chapter 5:
// - id: auto-increment INTEGER (internal DB use)
// - domaincode: unique TEXT identifier (user-facing, URLs)
// - name: project title/display name (TEXT)
// - heading: legacy field for backward compatibility
interface ProjectRecord {
    id: number  // Changed from string to number (auto-increment)
    domaincode: string  // User-facing unique identifier
    name?: string  // Project title/display name
    heading?: string  // Heading from database (backward compat)
    username: string
    isOwner: boolean
    isMember: boolean
    isInstructor: boolean
    isAuthor: boolean
}

interface User {
    id: string
    username: string
    role?: 'admin' | 'base' | 'project' | 'user'  // Kept for backward compatibility
    availableRoles: string[]
    activeRole: string
    projectId: string | null
    projectName?: string
    projects?: ProjectRecord[]
    capabilities?: Record<string, Set<string>>
}

const user = ref<User | null>(null)
const isAuthenticated = ref(false)
const isLoading = ref(false)

export function useAuth() {
    const router = useRouter()

    // Computed properties for role checks
    const isAdmin = computed(() => user.value?.activeRole === 'admin')
    const isBase = computed(() => user.value?.activeRole === 'base')
    const isProject = computed(() => user.value?.activeRole === 'project')
    const hasProjectAccess = computed(() => user.value?.projectId !== null)

    // Get current project record
    const currentProject = computed(() => {
        if (!user.value?.projectId || !user.value?.projects) return null
        return user.value.projects.find((p: ProjectRecord) => p.id === user.value!.projectId) || null
    })

    // Check if user has specific capability
    const hasCapability = (category: string, permission: string): boolean => {
        if (!user.value?.capabilities) return false
        const categoryPerms = user.value.capabilities[category]
        return categoryPerms ? categoryPerms.has(permission) : false
    }

    // Get current state
    const authState = computed(() => {
        if (!isAuthenticated.value) return 'unauthenticated'
        return user.value?.activeRole || 'unauthenticated'
    })

    // Check session
    const checkSession = async () => {
        isLoading.value = true
        try {
            const response = await fetch('/api/auth/session')
            const data = await response.json()

            if (data.authenticated && data.user) {
                user.value = data.user
                isAuthenticated.value = true
            } else {
                user.value = null
                isAuthenticated.value = false
            }
        } catch (error) {
            console.error('Session check failed:', error)
            user.value = null
            isAuthenticated.value = false
        } finally {
            isLoading.value = false
        }
    }

    // Login
    const login = async (userId: string, password: string) => {
        isLoading.value = true
        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ userId, password })
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.message || 'Login failed')
            }

            const data = await response.json()

            if (data.success && data.user) {
                user.value = data.user
                isAuthenticated.value = true
                return { success: true }
            }

            throw new Error('Login failed')
        } catch (error) {
            console.error('Login error:', error)
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Login failed'
            }
        } finally {
            isLoading.value = false
        }
    }

    // Logout
    const logout = async () => {
        isLoading.value = true
        try {
            await fetch('/api/auth/logout', {
                method: 'POST'
            })

            user.value = null
            isAuthenticated.value = false
            router.push('/login')
        } catch (error) {
            console.error('Logout error:', error)
        } finally {
            isLoading.value = false
        }
    }

    // Require authentication
    const requireAuth = async () => {
        if (!isAuthenticated.value) {
            await checkSession()
            if (!isAuthenticated.value) {
                router.push('/login')
                return false
            }
        }
        return true
    }

    // Require specific role
    const requireRole = (role: 'admin' | 'base' | 'project') => {
        if (!isAuthenticated.value || user.value?.activeRole !== role) {
            router.push('/login')
            return false
        }
        return true
    }

    // Refresh user data
    const refreshUser = async () => {
        await checkSession()
    }

    // Set active project
    const setProjectId = async (projectId: string | null) => {
        try {
            const response = await fetch('/api/auth/set-project', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ projectId })
            })

            if (!response.ok) {
                throw new Error('Failed to set project')
            }

            await refreshUser()

            // Navigate based on projectId
            if (projectId) {
                router.push('/projects')
            } else {
                router.push('/')
            }
        } catch (error) {
            console.error('Error setting project:', error)
        }
    }

    return {
        // State
        user,
        isAuthenticated,
        isLoading,
        authState,

        // Role checks
        isAdmin,
        isBase,
        isProject,
        hasProjectAccess,
        currentProject,

        // Methods
        checkSession,
        login,
        logout,
        requireAuth,
        requireRole,
        refreshUser,
        setProjectId,
        hasCapability
    }
}
