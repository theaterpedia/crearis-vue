<template>
    <nav class="navbar">
        <div class="navbar-container">
            <div class="navbar-brand">
                <router-link to="/" class="navbar-logo">
                    📋 Task Manager
                </router-link>
            </div>

            <div class="navbar-menu">
                <div class="navbar-item">
                    <button class="navbar-button" @click="$emit('toggle-view-menu')">
                        <svg fill="currentColor" height="20" viewBox="0 0 256 256" width="20"
                            xmlns="http://www.w3.org/2000/svg">
                            <path
                                d="M216,40H40A16,16,0,0,0,24,56V200a16,16,0,0,0,16,16H216a16,16,0,0,0,16-16V56A16,16,0,0,0,216,40ZM40,56H216V96H40ZM40,112H96v88H40Zm176,88H112V112H216v88Z">
                            </path>
                        </svg>
                        Ansicht
                    </button>
                </div>

                <div v-if="isAuthenticated && user" class="navbar-item navbar-user">
                    <span class="navbar-username">{{ user.username }}</span>
                    <button class="navbar-button navbar-logout" @click="$emit('logout')">
                        Abmelden
                    </button>
                </div>
            </div>
        </div>
    </nav>
</template>

<script setup lang="ts">
interface User {
    username: string
    role: string
}

defineProps<{
    isAuthenticated: boolean
    user?: User | null
}>()

defineEmits<{
    'toggle-view-menu': []
    logout: []
}>()
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
    justify-content: space-between;
    align-items: center;
    height: 4rem;
}

.navbar-brand {
    display: flex;
    align-items: center;
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
    color: var(--color-contrast);
    font-family: var(--font);
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

.navbar-logout {
    border-color: var(--color-negative-bg);
    color: var(--color-negative-bg);
}

.navbar-logout:hover {
    background: var(--color-negative-bg);
    color: var(--color-negative-contrast);
}
</style>
