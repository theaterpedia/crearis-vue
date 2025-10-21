<template>
    <nav class="navbar">
        <div class="navbar-container" :class="{ 'navbar-container-full': fullWidth }">
            <div class="navbar-brand">
                <router-link to="/" class="navbar-logo" :class="{ 'navbar-logo-long': isLogoTextLong }">
                    {{ logoText || '📋 Task Manager' }}
                </router-link>
            </div>

            <div class="navbar-center">
                <!-- Navigation Routes -->
                <!-- Debug: {{ visibleRoutes.length }} routes -->
                <div v-if="visibleRoutes.length > 0" class="navbar-routes">
                    <router-link v-for="route in visibleRoutes" :key="route.path" :to="route.path" class="navbar-route"
                        :class="{ 'navbar-route-active': isActiveRoute(route.path) }">
                        {{ route.name }}
                    </router-link>
                </div>
            </div>

            <div class="navbar-menu">
                <!-- Role Toggle (for users with multiple roles) -->
                <div class="navbar-item">
                    <RoleToggle />
                </div>

                <!-- Inverted Mode Toggle -->
                <div class="navbar-item">
                    <InvertedToggle />
                </div>

                <!-- Theme Dropdown -->
                <div class="navbar-item">
                    <ThemeDropdown />
                </div>

                <!-- Slot for menus (ToggleMenu, AdminMenu) -->
                <slot name="menus"></slot>

                <div v-if="user" class="navbar-item navbar-user">
                    <span class="navbar-username">{{ user.username }}</span>
                    <button class="navbar-button navbar-logout" @click="$emit('logout')">
                        <span class="logout-icon">🚪</span>
                        <span class="logout-text">Abmelden</span>
                    </button>
                </div>
            </div>
        </div>
    </nav>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { defaultNavRoutes, type NavRoute } from '@/settings'
import RoleToggle from './RoleToggle.vue'
import InvertedToggle from './InvertedToggle.vue'
import ThemeDropdown from './ThemeDropdown.vue'

interface User {
    username: string
    role: string
}

const props = withDefaults(defineProps<{
    user?: User | null
    fullWidth?: boolean
    logoText?: string
    useDefaultRoutes?: boolean
    customRoutes?: NavRoute[]
}>(), {
    fullWidth: false,
    useDefaultRoutes: true,
    customRoutes: () => []
})

defineEmits<{
    logout: []
}>()

const route = useRoute()

// Check if logo text is longer than 18 characters
const isLogoTextLong = computed(() => {
    const text = props.logoText || '📋 Task Manager'
    return text.length > 18
})

// Combine default and custom routes
const allRoutes = computed(() => {
    const routes = props.useDefaultRoutes ? [...defaultNavRoutes] : []
    if (props.customRoutes && props.customRoutes.length > 0) {
        routes.push(...props.customRoutes)
    }
    return routes
})

// Filter routes based on authentication and role
const visibleRoutes = computed(() => {
    return allRoutes.value.filter((navRoute: NavRoute) => {
        // If route is not protected, always show it
        if (!navRoute.protected) {
            return true
        }

        // If route requires auth, check if user is authenticated
        if (navRoute.requiresAuth && !props.user) {
            return false
        }

        // If route requires specific role(s)
        if (navRoute.requiresRole && props.user) {
            const requiredRoles = Array.isArray(navRoute.requiresRole)
                ? navRoute.requiresRole
                : [navRoute.requiresRole]

            return requiredRoles.includes(props.user.role)
        }

        // If protected but no specific requirements, show if authenticated
        return !!props.user
    })
})

// Check if route is currently active
function isActiveRoute(path: string): boolean {
    return route.path === path
}

// Debug logging (can be removed later)
if (import.meta.env.DEV) {
    console.log('Navbar Debug:', {
        useDefaultRoutes: props.useDefaultRoutes,
        allRoutesCount: allRoutes.value.length,
        visibleRoutesCount: visibleRoutes.value.length,
        allRoutes: allRoutes.value,
        visibleRoutes: visibleRoutes.value,
        user: props.user,
    })
}

// Watch for changes to help debug
watch(visibleRoutes, (newVal) => {
    console.log('visibleRoutes changed:', newVal)
}, { immediate: true })

watch(() => props.user, (newVal) => {
    console.log('user prop changed:', newVal)
})
</script>

<style scoped>
.navbar {
    background: var(--color-card-bg);
    border-bottom: 1px solid var(--color-border);
    position: sticky;
    top: 0;
    z-index: 100;
    box-shadow: 0 2px 8px oklch(0% 0 0 / 0.05);
}

.navbar-container {
    max-width: 1400px;
    margin: 0 auto;
    padding: 0 2rem;
    display: flex;
    align-items: center;
    gap: 2rem;
    height: 4rem;
}

.navbar-container-full {
    max-width: 100%;
}

.navbar-brand {
    flex-shrink: 0;
}

.navbar-center {
    flex: 1;
    display: flex;
    justify-content: center;
}

.navbar-routes {
    display: flex;
    gap: 0.5rem;
    align-items: center;
}

.navbar-route {
    padding: 0.5rem 1rem;
    border-radius: var(--radius-button);
    color: var(--color-dimmed);
    text-decoration: none;
    font-size: 0.9375rem;
    font-weight: 500;
    transition: all 0.2s ease;
    white-space: nowrap;
}

.navbar-route:hover {
    background: var(--color-muted-bg);
    color: var(--color-contrast);
}

.navbar-route-active {
    background: var(--color-primary-bg);
    color: var(--color-primary-contrast);
}

.navbar-route-active:hover {
    background: var(--color-primary-bg);
    color: var(--color-primary-contrast);
}

.navbar-menu {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    gap: 1.5rem;
}

.navbar-logo {
    font-size: 1.25rem;
    font-weight: 700;
    color: var(--color-contrast);
    text-decoration: none;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    transition: color 0.2s ease;
}

.navbar-logo:hover {
    color: var(--color-primary-bg);
}

.navbar-menu {
    display: flex;
    align-items: center;
    gap: 1.5rem;
}

.navbar-item {
    display: flex;
    align-items: center;
}

.navbar-button {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    background: transparent;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-button);
    color: var(--color-card-contrast);
    font-family: var(--headings);
    font-size: 0.9375rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
}

.navbar-button:hover {
    background: var(--color-muted-bg);
    border-color: var(--color-primary-bg);
}

.navbar-user {
    display: flex;
    align-items: center;
    gap: 1rem;
}

.navbar-username {
    font-size: 0.875rem;
    color: var(--color-dimmed);
    font-weight: 500;
}

.logout-icon {
    font-size: 1.125rem;
}

.logout-text {
    display: inline;
}

/* Responsive Design */
@media (max-width: 1024px) {
    .navbar-container {
        gap: 1rem;
    }

    .navbar-routes {
        gap: 0.25rem;
    }

    .navbar-route {
        padding: 0.5rem 0.75rem;
        font-size: 0.875rem;
    }
}

@media (max-width: 768px) {
    .navbar-container {
        flex-wrap: wrap;
        height: auto;
        padding: 1rem;
        gap: 0.5rem;
    }

    .navbar-brand {
        order: 1;
        flex: 0 0 auto;
    }

    .navbar-logo-long {
        font-size: 0.9375rem;
    }

    .navbar-menu {
        order: 2;
        flex: 0 0 auto;
        gap: 0.5rem;
        margin-left: auto;
    }

    .navbar-center {
        order: 3;
        flex: 0 0 100%;
        width: 100%;
        margin-top: 0.75rem;
        justify-content: flex-start;
    }

    .navbar-routes {
        width: 100%;
        flex-wrap: wrap;
    }

    .navbar-route {
        flex: 0 0 auto;
    }

    .navbar-username {
        display: none;
    }

    /* Hide text in menu buttons, show only icons */
    .logout-text {
        display: none;
    }

    .navbar-button {
        padding: 0.5rem;
        min-width: 2.5rem;
        justify-content: center;
    }

    .logout-icon {
        font-size: 1.25rem;
    }
}
</style>
