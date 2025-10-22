<template>
    <div v-if="canShowToggle" class="project-toggle-wrapper" ref="dropdownRef">
        <button class="project-toggle-btn" :class="{ 'has-project': currentProjectId }" @click="toggleDropdown"
            :title="currentProjectName || 'Select Project'">
            <svg fill="currentColor" height="18" viewBox="0 0 256 256" width="18" xmlns="http://www.w3.org/2000/svg">
                <path
                    d="M216,40H40A16,16,0,0,0,24,56V200a16,16,0,0,0,16,16H216a16,16,0,0,0,16-16V56A16,16,0,0,0,216,40Zm0,16V96H40V56ZM40,112H96v88H40Zm176,88H112V112H216v88Z" />
            </svg>
            <span class="project-toggle-label">{{ currentProjectName || 'Project' }}</span>
            <svg class="dropdown-arrow" fill="currentColor" height="16" viewBox="0 0 256 256" width="16"
                xmlns="http://www.w3.org/2000/svg">
                <path
                    d="M213.66,101.66l-80,80a8,8,0,0,1-11.32,0l-80-80A8,8,0,0,1,53.66,90.34L128,164.69l74.34-74.35a8,8,0,0,1,11.32,11.32Z" />
            </svg>
        </button>

        <div v-if="isDropdownOpen" class="project-dropdown">
            <div class="project-dropdown-header">
                <h3>Select Project</h3>
                <button class="close-btn" @click="closeDropdown">&times;</button>
            </div>

            <div class="project-dropdown-body">
                <!-- Owner Projects -->
                <div v-if="ownerProjects.length > 0" class="project-section">
                    <div class="section-header">
                        <svg fill="currentColor" height="16" viewBox="0 0 256 256" width="16"
                            xmlns="http://www.w3.org/2000/svg">
                            <path
                                d="M230.92,212c-15.23-26.33-38.7-45.21-66.09-54.16a72,72,0,1,0-73.66,0C63.78,166.78,40.31,185.66,25.08,212a8,8,0,1,0,13.85,8c18.84-32.56,52.14-52,89.07-52s70.23,19.44,89.07,52a8,8,0,1,0,13.85-8ZM72,96a56,56,0,1,1,56,56A56.06,56.06,0,0,1,72,96Z" />
                        </svg>
                        <span class="section-title">Owner</span>
                    </div>
                    <div class="project-tiles">
                        <button v-for="project in ownerProjects" :key="project.id" class="project-tile"
                            :class="{ active: currentProjectId === project.id }" @click="selectProject(project.id)">
                            <div class="project-tile-header">
                                <div class="project-tile-heading">
                                    <HeadingParser v-if="project.heading" :content="project.heading" as="span"
                                        :compact="true" />
                                    <span v-else class="project-tile-name">{{ project.name }}</span>
                                </div>
                                <div class="project-tile-badges">
                                    <svg v-if="project.isInstructor" fill="currentColor" height="14"
                                        viewBox="0 0 256 256" width="14" xmlns="http://www.w3.org/2000/svg"
                                        title="Instructor">
                                        <path
                                            d="M226.53,56.41l-96-32a8,8,0,0,0-5.06,0l-96,32A8,8,0,0,0,24,64v80a8,8,0,0,0,16,0V75.1L73.59,86.29a64,64,0,0,0,20.65,88.05c-18,7.06-33.56,19.83-44.94,37.29a8,8,0,1,0,13.4,8.74C77.77,197.25,101.57,184,128,184s50.23,13.25,65.3,36.37a8,8,0,0,0,13.4-8.74c-11.38-17.46-27-30.23-44.94-37.29a64,64,0,0,0,20.65-88l44.12-14.7a8,8,0,0,0,0-15.18ZM176,120A48,48,0,1,1,89.35,91.55l36.12,12a8,8,0,0,0,5.06,0l36.12-12A47.89,47.89,0,0,1,176,120Z" />
                                    </svg>
                                    <svg v-if="project.isAuthor" fill="currentColor" height="14" viewBox="0 0 256 256"
                                        width="14" xmlns="http://www.w3.org/2000/svg" title="Author">
                                        <path
                                            d="M227.31,73.37,182.63,28.69a16,16,0,0,0-22.63,0L36.69,152A15.86,15.86,0,0,0,32,163.31V208a16,16,0,0,0,16,16H92.69A15.86,15.86,0,0,0,104,219.31L227.31,96a16,16,0,0,0,0-22.63ZM92.69,208H48V163.31l88-88L180.69,120ZM192,108.69,147.31,64l24-24L216,84.69Z" />
                                    </svg>
                                </div>
                            </div>
                            <div class="project-tile-id">@{{ project.username }}</div>
                        </button>
                    </div>
                </div>

                <!-- Member Projects -->
                <div v-if="memberProjects.length > 0" class="project-section">
                    <div class="section-header">
                        <svg fill="currentColor" height="16" viewBox="0 0 256 256" width="16"
                            xmlns="http://www.w3.org/2000/svg">
                            <path
                                d="M244.8,150.4a8,8,0,0,1-11.2-1.6A51.6,51.6,0,0,0,192,128a8,8,0,0,1,0-16,24,24,0,1,0-23.24-30,8,8,0,1,1-15.5-4A40,40,0,1,1,219,117.51a67.94,67.94,0,0,1,27.43,21.68A8,8,0,0,1,244.8,150.4ZM190.92,212a8,8,0,1,1-13.84,8,57,57,0,0,0-98.16,0,8,8,0,1,1-13.84-8,72.06,72.06,0,0,1,33.74-29.92,48,48,0,1,1,58.36,0A72.06,72.06,0,0,1,190.92,212ZM128,176a32,32,0,1,0-32-32A32,32,0,0,0,128,176ZM72,120a8,8,0,0,0-8-8A24,24,0,1,1,87.24,82a8,8,0,1,0,15.5-4A40,40,0,1,0,37,117.51,67.94,67.94,0,0,0,9.6,139.19a8,8,0,1,0,12.8,9.61A51.6,51.6,0,0,1,64,128,8,8,0,0,0,72,120Z" />
                        </svg>
                        <span class="section-title">Team</span>
                    </div>
                    <div class="project-tiles">
                        <button v-for="project in memberProjects" :key="project.id" class="project-tile"
                            :class="{ active: currentProjectId === project.id }" @click="selectProject(project.id)">
                            <div class="project-tile-header">
                                <div class="project-tile-heading">
                                    <HeadingParser v-if="project.heading" :content="project.heading" as="span"
                                        :compact="true" />
                                    <span v-else class="project-tile-name">{{ project.name }}</span>
                                </div>
                                <div class="project-tile-badges">
                                    <svg v-if="project.isInstructor" fill="currentColor" height="14"
                                        viewBox="0 0 256 256" width="14" xmlns="http://www.w3.org/2000/svg"
                                        title="Instructor">
                                        <path
                                            d="M226.53,56.41l-96-32a8,8,0,0,0-5.06,0l-96,32A8,8,0,0,0,24,64v80a8,8,0,0,0,16,0V75.1L73.59,86.29a64,64,0,0,0,20.65,88.05c-18,7.06-33.56,19.83-44.94,37.29a8,8,0,1,0,13.4,8.74C77.77,197.25,101.57,184,128,184s50.23,13.25,65.3,36.37a8,8,0,0,0,13.4-8.74c-11.38-17.46-27-30.23-44.94-37.29a64,64,0,0,0,20.65-88l44.12-14.7a8,8,0,0,0,0-15.18ZM176,120A48,48,0,1,1,89.35,91.55l36.12,12a8,8,0,0,0,5.06,0l36.12-12A47.89,47.89,0,0,1,176,120Z" />
                                    </svg>
                                    <svg v-if="project.isAuthor" fill="currentColor" height="14" viewBox="0 0 256 256"
                                        width="14" xmlns="http://www.w3.org/2000/svg" title="Author">
                                        <path
                                            d="M227.31,73.37,182.63,28.69a16,16,0,0,0-22.63,0L36.69,152A15.86,15.86,0,0,0,32,163.31V208a16,16,0,0,0,16,16H92.69A15.86,15.86,0,0,0,104,219.31L227.31,96a16,16,0,0,0,0-22.63ZM92.69,208H48V163.31l88-88L180.69,120ZM192,108.69,147.31,64l24-24L216,84.69Z" />
                                    </svg>
                                </div>
                            </div>
                            <div class="project-tile-id">@{{ project.username }}</div>
                        </button>
                    </div>
                </div>

                <!-- Partner Projects -->
                <div v-if="partnerProjects.length > 0" class="project-section">
                    <div class="section-header">
                        <svg fill="currentColor" height="16" viewBox="0 0 256 256" width="16"
                            xmlns="http://www.w3.org/2000/svg">
                            <path
                                d="M240,104a40,40,0,1,0-64,32v24H144V136a40,40,0,1,0-16,0v24H80V136a40,40,0,1,0-16,0v24a16,16,0,0,0,16,16h48v24a40,40,0,1,0,16,0V176h48a16,16,0,0,0,16-16V136A40,40,0,0,0,240,104ZM216,80a24,24,0,1,1-24,24A24,24,0,0,1,216,80ZM96,80a24,24,0,1,1,24,24A24,24,0,0,1,96,80ZM152,216a24,24,0,1,1-24-24A24,24,0,0,1,152,216Z" />
                        </svg>
                        <span class="section-title">Partner</span>
                    </div>
                    <div class="project-tiles">
                        <button v-for="project in partnerProjects" :key="project.id" class="project-tile"
                            :class="{ active: currentProjectId === project.id }" @click="selectProject(project.id)">
                            <div class="project-tile-header">
                                <div class="project-tile-heading">
                                    <HeadingParser v-if="project.heading" :content="project.heading" as="span"
                                        :compact="true" />
                                    <span v-else class="project-tile-name">{{ project.name }}</span>
                                </div>
                                <div class="project-tile-badges">
                                    <svg v-if="project.isInstructor" fill="currentColor" height="14"
                                        viewBox="0 0 256 256" width="14" xmlns="http://www.w3.org/2000/svg"
                                        title="Instructor">
                                        <path
                                            d="M226.53,56.41l-96-32a8,8,0,0,0-5.06,0l-96,32A8,8,0,0,0,24,64v80a8,8,0,0,0,16,0V75.1L73.59,86.29a64,64,0,0,0,20.65,88.05c-18,7.06-33.56,19.83-44.94,37.29a8,8,0,1,0,13.4,8.74C77.77,197.25,101.57,184,128,184s50.23,13.25,65.3,36.37a8,8,0,0,0,13.4-8.74c-11.38-17.46-27-30.23-44.94-37.29a64,64,0,0,0,20.65-88l44.12-14.7a8,8,0,0,0,0-15.18ZM176,120A48,48,0,1,1,89.35,91.55l36.12,12a8,8,0,0,0,5.06,0l36.12-12A47.89,47.89,0,0,1,176,120Z" />
                                    </svg>
                                    <svg v-if="project.isAuthor" fill="currentColor" height="14" viewBox="0 0 256 256"
                                        width="14" xmlns="http://www.w3.org/2000/svg" title="Author">
                                        <path
                                            d="M227.31,73.37,182.63,28.69a16,16,0,0,0-22.63,0L36.69,152A15.86,15.86,0,0,0,32,163.31V208a16,16,0,0,0,16,16H92.69A15.86,15.86,0,0,0,104,219.31L227.31,96a16,16,0,0,0,0-22.63ZM92.69,208H48V163.31l88-88L180.69,120ZM192,108.69,147.31,64l24-24L216,84.69Z" />
                                    </svg>
                                </div>
                            </div>
                            <div class="project-tile-id">@{{ project.username }}</div>
                        </button>
                    </div>
                </div>

                <!-- No Projects Message -->
                <div v-if="allProjects.length === 0" class="no-projects">
                    <svg fill="currentColor" height="48" viewBox="0 0 256 256" width="48"
                        xmlns="http://www.w3.org/2000/svg">
                        <path
                            d="M216,40H40A16,16,0,0,0,24,56V200a16,16,0,0,0,16,16H216a16,16,0,0,0,16-16V56A16,16,0,0,0,216,40Zm0,16V96H40V56ZM40,112H96v88H40Zm176,88H112V112H216v88Z" />
                    </svg>
                    <p>No projects available</p>
                </div>

                <!-- Clear Selection Button -->
                <div v-if="currentProjectId" class="dropdown-actions">
                    <button class="btn-clear" @click="clearSelection">
                        <svg fill="currentColor" height="16" viewBox="0 0 256 256" width="16"
                            xmlns="http://www.w3.org/2000/svg">
                            <path
                                d="M205.66,194.34a8,8,0,0,1-11.32,11.32L128,139.31,61.66,205.66a8,8,0,0,1-11.32-11.32L116.69,128,50.34,61.66A8,8,0,0,1,61.66,50.34L128,116.69l66.34-66.35a8,8,0,0,1,11.32,11.32L139.31,128Z" />
                        </svg>
                        Clear Selection
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useAuth } from '@/composables/useAuth'
import HeadingParser from './HeadingParser.vue'

const { user, setProjectId } = useAuth()

const isDropdownOpen = ref(false)
const dropdownRef = ref<HTMLElement | null>(null)

// Only show if user is in project role
const canShowToggle = computed(() => {
    return user.value?.activeRole === 'project' && user.value?.projects && user.value.projects.length > 0
})

const allProjects = computed(() => user.value?.projects || [])
const currentProjectId = computed(() => user.value?.projectId || null)
const currentProjectName = computed(() => {
    if (!currentProjectId.value) return null
    const project = allProjects.value.find((p: any) => p.id === currentProjectId.value)
    return project ? project.name : null  // Returns domaincode (id)
})

// Organize projects by category
const ownerProjects = computed(() => allProjects.value.filter((p: any) => p.isOwner))
const memberProjects = computed(() => allProjects.value.filter((p: any) => p.isMember && !p.isOwner))
const partnerProjects = computed(() => allProjects.value.filter((p: any) => !p.isOwner && !p.isMember && (p.isInstructor || p.isAuthor)))

function toggleDropdown() {
    isDropdownOpen.value = !isDropdownOpen.value
}

function closeDropdown() {
    isDropdownOpen.value = false
}

async function selectProject(projectId: string) {
    await setProjectId(projectId)
    closeDropdown()
}

async function clearSelection() {
    await setProjectId(null)
    closeDropdown()
}

// Click outside to close
function handleClickOutside(event: MouseEvent) {
    if (dropdownRef.value && !dropdownRef.value.contains(event.target as Node)) {
        closeDropdown()
    }
}

onMounted(() => {
    document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
    document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
/* ===== PROJECT TOGGLE WRAPPER ===== */
.project-toggle-wrapper {
    position: relative;
}

.project-toggle-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    height: 2.5rem;
    padding: 0 0.75rem;
    color: var(--color-contrast);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-button);
    background: transparent;
    font-family: var(--font);
    font-size: 0.9375rem;
    font-weight: 500;
    transition: var(--transition);
    transition-property: background-color, color, border-color;
    cursor: pointer;
}

.project-toggle-btn:hover {
    background-color: var(--color-muted-bg);
    border-color: var(--color-primary-bg);
}

/* Active state - when a project is selected */
.project-toggle-btn.has-project {
    background-color: var(--color-muted-bg);
    border-color: var(--color-primary-bg);
}

.project-toggle-label {
    max-width: 150px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.dropdown-arrow {
    flex-shrink: 0;
    opacity: 0.6;
}

/* ===== DROPDOWN ===== */
.project-dropdown {
    position: absolute;
    top: calc(100% + 0.5rem);
    right: 0;
    min-width: 400px;
    max-width: 500px;
    max-height: 80vh;
    background: var(--color-popover-bg);
    border: var(--border) solid var(--color-border);
    border-radius: var(--radius-button);
    box-shadow: 0 10px 25px -3px oklch(0% 0 0 / 0.1);
    overflow-y: auto;
    z-index: 200;
}

.project-dropdown-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 1.25rem;
    border-bottom: var(--border) solid var(--color-border);
    background: var(--color-bg-soft);
}

.project-dropdown-header h3 {
    font-size: 1rem;
    font-weight: 600;
    color: var(--color-text);
    margin: 0;
}

.close-btn {
    background: none;
    border: none;
    font-size: 1.75rem;
    line-height: 1;
    color: var(--color-dimmed);
    cursor: pointer;
    padding: 0;
    width: 2rem;
    height: 2rem;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--radius-button);
    transition: all 0.2s ease;
}

.close-btn:hover {
    background: var(--color-muted-bg);
    color: var(--color-text);
}

.project-dropdown-body {
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
}

/* ===== PROJECT SECTIONS ===== */
.project-section {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}

.section-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0 0.5rem;
}

.section-header svg {
    color: var(--color-project);
    flex-shrink: 0;
}

.section-title {
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--color-text);
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.project-tiles {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: 0.75rem;
}

/* ===== PROJECT TILES ===== */
.project-tile {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    padding: 1rem;
    background: var(--color-card-bg);
    border: var(--border) solid var(--color-border);
    border-radius: var(--radius-button);
    cursor: pointer;
    transition: all 0.2s ease;
    text-align: left;
}

.project-tile:hover {
    border-color: var(--color-project);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.project-tile.active {
    background: var(--color-project);
    border-color: var(--color-project);
    color: white;
}

.project-tile.active .project-tile-name,
.project-tile.active .project-tile-id {
    color: white;
}

.project-tile-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 0.5rem;
}

.project-tile-heading {
    flex: 1;
    overflow: hidden;
}

.project-tile-name {
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--color-text);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    flex: 1;
}

.project-tile-badges {
    display: flex;
    gap: 0.25rem;
    flex-shrink: 0;
}

.project-tile-badges svg {
    opacity: 0.7;
}

.project-tile.active .project-tile-badges svg {
    opacity: 1;
    color: white;
}

.project-tile-id {
    font-size: 0.75rem;
    color: var(--color-dimmed);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

/* ===== NO PROJECTS ===== */
.no-projects {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 3rem 1rem;
    text-align: center;
}

.no-projects svg {
    color: var(--color-dimmed-contrast);
    opacity: 0.5;
    margin-bottom: 1rem;
}

.no-projects p {
    font-size: 0.875rem;
    color: var(--color-dimmed-contrast);
    margin: 0;
}

/* ===== DROPDOWN ACTIONS ===== */
.dropdown-actions {
    display: flex;
    justify-content: center;
    padding-top: 0.5rem;
    border-top: var(--border) solid var(--color-border);
}

.btn-clear {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    background: transparent;
    border: var(--border) solid var(--color-border);
    border-radius: var(--radius-button);
    color: var(--color-text);
    font-size: 0.75rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
}

.btn-clear:hover {
    background: var(--color-warning-bg);
    border-color: var(--color-warning-contrast);
    color: white;
}

/* ===== RESPONSIVE ===== */
@media (max-width: 768px) {
    .project-dropdown {
        min-width: 320px;
        max-width: calc(100vw - 2rem);
    }

    .project-tiles {
        grid-template-columns: 1fr;
    }

    .project-toggle-label {
        max-width: 100px;
    }
}
</style>
