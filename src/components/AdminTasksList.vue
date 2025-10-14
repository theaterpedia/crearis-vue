<template>
    <div class="admin-tasks-wrapper">
        <h3 class="tasks-title">Admin-Aufgaben</h3>

        <div v-if="loading" class="tasks-loading">Lädt...</div>
        <div v-else-if="tasks.length === 0" class="tasks-empty">
            Keine Admin-Aufgaben vorhanden
        </div>
        <ul v-else class="admin-tasks-list">
            <li v-for="task in tasks" :key="task.id" class="admin-task-item">
                <div class="task-content">
                    <h4 class="task-title">{{ task.display_title || task.title }}</h4>
                    <p v-if="task.description" class="task-description">
                        {{ task.description }}
                    </p>
                </div>
                <button class="task-execute-btn" @click="$emit('execute', task)" title="Ausführen">
                    <svg fill="currentColor" height="20" viewBox="0 0 256 256" width="20"
                        xmlns="http://www.w3.org/2000/svg">
                        <path
                            d="M240,128a15.74,15.74,0,0,1-7.6,13.51L88.32,229.65a16,16,0,0,1-16.2.3A15.86,15.86,0,0,1,64,216.13V39.87a15.86,15.86,0,0,1,8.12-13.82,16,16,0,0,1,16.2.3L232.4,114.49A15.74,15.74,0,0,1,240,128Z">
                        </path>
                    </svg>
                    Ausführen
                </button>
            </li>
        </ul>
    </div>
</template>

<script setup lang="ts">
interface AdminTask {
    id: string
    title: string
    display_title?: string
    description?: string
}

defineProps<{
    tasks: AdminTask[]
    loading?: boolean
}>()

defineEmits<{
    execute: [task: AdminTask]
}>()
</script>

<style scoped>
.admin-tasks-wrapper {
    margin-top: 3rem;
    padding: 1.5rem;
    background: var(--color-card-bg);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-button);
}

.tasks-title {
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--color-contrast);
    margin: 0 0 1.5rem 0;
}

.tasks-loading,
.tasks-empty {
    padding: 2rem;
    text-align: center;
    color: var(--color-dimmed);
}

.admin-tasks-list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}

.admin-task-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
    padding: 1rem;
    background: var(--color-bg);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-button);
    transition: all 0.2s ease;
}

.admin-task-item:hover {
    border-color: var(--color-primary-bg);
    box-shadow: 0 2px 8px oklch(0% 0 0 / 0.05);
}

.task-content {
    flex: 1;
}

.task-title {
    font-size: 1rem;
    font-weight: 600;
    color: var(--color-contrast);
    margin: 0 0 0.25rem 0;
}

.task-description {
    font-size: 0.875rem;
    color: var(--color-dimmed);
    margin: 0;
    line-height: 1.5;
}

.task-execute-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    background: var(--color-accent-bg);
    color: var(--color-accent-contrast);
    border: none;
    border-radius: var(--radius-button);
    font-family: var(--font);
    font-size: 0.875rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    white-space: nowrap;
}

.task-execute-btn:hover {
    background: oklch(from var(--color-accent-bg) calc(l * 0.9) c h);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px oklch(from var(--color-accent-bg) l c h / 0.3);
}

.task-execute-btn:active {
    transform: translateY(0);
}
</style>
