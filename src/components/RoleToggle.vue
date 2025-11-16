<template>
    <div v-if="canToggle" class="role-toggle">
        <button v-for="role in availableRoles" :key="role" :class="['role-btn', { active: activeRole === role }]"
            @click="switchRole(role)" :title="`Switch to ${getRoleLabel(role)} mode`">
            <svg v-if="role === 'user'" fill="currentColor" height="18" viewBox="0 0 256 256" width="18"
                xmlns="http://www.w3.org/2000/svg">
                <path
                    d="M230.92,212c-15.23-26.33-38.7-45.21-66.09-54.16a72,72,0,1,0-73.66,0C63.78,166.78,40.31,185.66,25.08,212a8,8,0,1,0,13.85,8c18.84-32.56,52.14-52,89.07-52s70.23,19.44,89.07,52a8,8,0,1,0,13.85-8ZM72,96a56,56,0,1,1,56,56A56.06,56.06,0,0,1,72,96Z" />
            </svg>
            <svg v-else-if="role === 'project'" fill="currentColor" height="18" viewBox="0 0 256 256" width="18"
                xmlns="http://www.w3.org/2000/svg">
                <path
                    d="M216,40H40A16,16,0,0,0,24,56V200a16,16,0,0,0,16,16H216a16,16,0,0,0,16-16V56A16,16,0,0,0,216,40Zm0,16V96H40V56ZM40,112H96v88H40Zm176,88H112V112H216v88Z" />
            </svg>
            <svg v-else-if="role === 'base'" fill="currentColor" height="18" viewBox="0 0 256 256" width="18"
                xmlns="http://www.w3.org/2000/svg">
                <path
                    d="M240,208H224V115.55a16,16,0,0,0-5.17-11.78l-80-75.48.11-.11a16,16,0,0,0-21.53,0l-.11.11L37.17,103.77A16,16,0,0,0,32,115.55V208H16a8,8,0,0,0,0,16H240a8,8,0,0,0,0-16ZM48,115.55l.11-.1L128,40l79.9,75.43.11.1V208H160V152a16,16,0,0,0-16-16H112a16,16,0,0,0-16,16v56H48ZM144,208H112V152h32Z" />
            </svg>
            <span>{{ getRoleLabel(role) }}</span>
        </button>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useAuth } from '@/composables/useAuth'
import { useRouter } from 'vue-router'

const { user, refreshUser } = useAuth()
const router = useRouter()

const availableRoles = computed(() => user.value?.availableRoles || [])
const activeRole = computed(() => user.value?.activeRole || '')

// Only show toggle if user has multiple roles and is not 'base'
const canToggle = computed(() => {
    return availableRoles.value.length > 1 && !availableRoles.value.includes('base')
})

const getRoleLabel = (role: string): string => {
    const labels: Record<string, string> = {
        user: 'User',
        project: 'Project',
        base: 'Base',
        admin: 'Admin'
    }
    return labels[role] || role
}

// Determine target route based on role
const getRouteForRole = (role: string): string => {
    switch (role) {
        case 'project':
            return '/projects'
        case 'user':
            return '/'
        case 'base':
            return '/base'
        case 'admin':
            return '/admin'
        default:
            return '/'
    }
}

const switchRole = async (role: string) => {
    if (role === activeRole.value) return

    try {
        const response = await fetch('/api/auth/switch-role', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ role })
        })

        if (!response.ok) {
            throw new Error('Failed to switch role')
        }

        // Refresh user data
        await refreshUser()

        // Navigate to appropriate route for the new role
        const targetRoute = getRouteForRole(role)
        await router.push(targetRoute)

        // Reload the page to ensure all components reflect the role change
        window.location.reload()
    } catch (error) {
        console.error('Error switching role:', error)
    }
}
</script>

<style scoped>
.role-toggle {
    display: flex;
    gap: 0.5rem;
    align-items: center;
    background: var(--color-muted-bg);
    padding: 0.25rem;
    border-radius: 0.5rem;
}

.role-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    background: transparent;
    border: none;
    border-radius: 0.375rem;
    cursor: pointer;
    font-family: var(--headings);
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--color-dimmed);
    transition: all 0.2s;
}

.role-btn:hover {
    color: var(--color-card-contrast);
    background: var(--color-card-bg);
}

.role-btn.active {
    background: var(--color-card-bg);
    color: var(--color-card-contrast);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.role-btn svg {
    flex-shrink: 0;
}
</style>
