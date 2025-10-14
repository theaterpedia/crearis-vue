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

                <div v-if="isAuthenticated && user?.role === 'admin'" class="navbar-item">
                    <button class="navbar-button navbar-admin" @click="$emit('toggle-admin-menu')">
                        <svg fill="currentColor" height="20" viewBox="0 0 256 256" width="20"
                            xmlns="http://www.w3.org/2000/svg">
                            <path
                                d="M225.86,102.82c-3.77-3.94-7.67-8-9.14-11.57-1.36-3.27-1.44-8.69-1.52-13.94-.15-9.76-.31-20.82-8-28.51s-18.75-7.85-28.51-8c-5.25-.08-10.67-.16-13.94-1.52-3.56-1.47-7.63-5.37-11.57-9.14C146.28,23.51,138.44,16,128,16s-18.27,7.51-25.18,14.14c-3.94,3.77-8,7.67-11.57,9.14C88,40.64,82.56,40.72,77.31,40.8c-9.76.15-20.82.31-28.51,8S41,67.55,40.8,77.31c-.08,5.25-.16,10.67-1.52,13.94-1.47,3.56-5.37,7.63-9.14,11.57C23.51,109.72,16,117.56,16,128s7.51,18.27,14.14,25.18c3.77,3.94,7.67,8,9.14,11.57,1.36,3.27,1.44,8.69,1.52,13.94.15,9.76.31,20.82,8,28.51s18.75,7.85,28.51,8c5.25.08,10.67.16,13.94,1.52,3.56,1.47,7.63,5.37,11.57,9.14C109.72,232.49,117.56,240,128,240s18.27-7.51,25.18-14.14c3.94-3.77,8-7.67,11.57-9.14,3.27-1.36,8.69-1.44,13.94-1.52,9.76-.15,20.82-.31,28.51-8s7.85-18.75,8-28.51c.08-5.25.16-10.67,1.52-13.94,1.47-3.56,5.37-7.63,9.14-11.57C232.49,146.28,240,138.44,240,128S232.49,109.73,225.86,102.82Zm-11.55,39.29c-4.79,5-9.75,10.17-12.38,16.52-2.52,6.1-2.63,13.07-2.73,19.82-.1,7-.21,14.33-3.32,17.43s-10.39,3.22-17.43,3.32c-6.75.1-13.72.21-19.82,2.73-6.35,2.63-11.52,7.59-16.52,12.38S132,224,128,224s-9.15-4.92-14.11-9.69-10.17-9.75-16.52-12.38c-6.1-2.52-13.07-2.63-19.82-2.73-7-.1-14.33-.21-17.43-3.32s-3.22-10.39-3.32-17.43c-.1-6.75-.21-13.72-2.73-19.82-2.63-6.35-7.59-11.52-12.38-16.52S32,132,32,128s4.92-9.15,9.69-14.11,9.75-10.17,12.38-16.52c2.52-6.1,2.63-13.07,2.73-19.82.1-7,.21-14.33,3.32-17.43S70.51,56.9,77.55,56.8c6.75-.1,13.72-.21,19.82-2.73,6.35-2.63,11.52-7.59,16.52-12.38S124,32,128,32s9.15,4.92,14.11,9.69,10.17,9.75,16.52,12.38c6.1,2.52,13.07,2.63,19.82,2.73,7,.1,14.33.21,17.43,3.32s3.22,10.39,3.32,17.43c.1,6.75.21,13.72,2.73,19.82,2.63,6.35,7.59,11.52,12.38,16.52S224,124,224,128,219.08,137.15,214.31,142.11Z">
                            </path>
                        </svg>
                        Admin
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
    'toggle-admin-menu': []
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

.navbar-admin {
    border-color: var(--color-accent);
    color: var(--color-accent);
}

.navbar-admin:hover {
    background: var(--color-accent);
    color: white;
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
