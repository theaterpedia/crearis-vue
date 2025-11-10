<template>
    <div class="base-view">
        <!-- Navbar -->
        <Navbar :user="user" :full-width="false" logo-text="📦 Basis-Daten" @logout="logout">
            <template #menus>
                <!-- View Mode Toggle -->
                <div class="navbar-item view-mode-toggle">
                    <button :class="['view-mode-btn', { active: viewMode === 'demo' }]" @click="viewMode = 'demo'"
                        title="Demo-Daten">
                        Demo
                    </button>
                    <button :class="['view-mode-btn', { active: viewMode === 'new' }]" @click="viewMode = 'new'"
                        title="Neue Events">
                        New
                    </button>
                    <button :class="['view-mode-btn', { active: viewMode === 'project' }]" @click="viewMode = 'project'"
                        title="Projekt-Events">
                        Project
                    </button>
                </div>

                <!-- Project Selector (only visible when viewMode === 'project') -->
                <div v-if="viewMode === 'project'" class="navbar-item">
                    <DropdownList entity="projects" title="Projekt wählen" size="small"
                        @select="(project: any) => selectedProjectId = project.id">
                        <template #trigger="{ open, isOpen }">
                            <button class="navbar-button project-selector-btn" @click="open">
                                <svg fill="currentColor" height="20" viewBox="0 0 256 256" width="20"
                                    xmlns="http://www.w3.org/2000/svg">
                                    <path
                                        d="M224,115.55V208a16,16,0,0,1-16,16H168a16,16,0,0,1-16-16V168a8,8,0,0,0-8-8H112a8,8,0,0,0-8,8v40a16,16,0,0,1-16,16H48a16,16,0,0,1-16-16V115.55a16,16,0,0,1,5.17-11.78l80-75.48.11-.11a16,16,0,0,1,21.53,0,1.14,1.14,0,0,0,.11.11l80,75.48A16,16,0,0,1,224,115.55Z">
                                    </path>
                                </svg>
                                <span v-if="currentProject">{{ currentProject.heading || currentProject.name }}</span>
                                <span v-else>Select Project</span>
                                <svg class="chevron" :class="{ 'rotate-180': isOpen }" width="16" height="16"
                                    viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M4 6L8 10L12 6" stroke="currentColor" stroke-width="2"
                                        stroke-linecap="round" stroke-linejoin="round" />
                                </svg>
                            </button>
                        </template>
                    </DropdownList>
                </div>

                <!-- Events Selector -->
                <div class="navbar-item">
                    <DropdownList entity="events" title="Event wählen" size="small"
                        @select="(event: any) => switchEvent(event.id)">
                        <template #trigger="{ open, isOpen }">
                            <button class="navbar-button events-toggle-btn" @click="open">
                                <svg fill="currentColor" height="20" viewBox="0 0 256 256" width="20"
                                    xmlns="http://www.w3.org/2000/svg">
                                    <path
                                        d="M216,40H40A16,16,0,0,0,24,56V200a16,16,0,0,0,16,16H216a16,16,0,0,0,16-16V56A16,16,0,0,0,216,40ZM40,56H216V96H40ZM40,112H96v88H40Zm176,88H112V112H216v88Z">
                                    </path>
                                </svg>
                                <span v-if="currentEvent">{{ currentEvent.name }}</span>
                                <span v-else>Select Event</span>
                                <svg class="chevron" :class="{ 'rotate-180': isOpen }" width="16" height="16"
                                    viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M4 6L8 10L12 6" stroke="currentColor" stroke-width="2"
                                        stroke-linecap="round" stroke-linejoin="round" />
                                </svg>
                            </button>
                        </template>
                    </DropdownList>
                </div>

                <!-- View/Edit Mode Toggle -->
                <div class="navbar-item mode-toggle">
                    <button :class="['mode-btn', { active: !hasActiveEdits }]" @click="setViewMode"
                        title="Ansichtsmodus">
                        Ansicht
                    </button>
                    <button :class="['mode-btn', { active: hasActiveEdits }]" @click="setEditMode"
                        title="Bearbeitungsmodus">
                        Bearbeiten
                    </button>
                </div>

                <!-- Save/Cancel Buttons (only visible when hasActiveEdits) -->
                <div v-if="hasActiveEdits" class="navbar-item action-buttons">
                    <button class="action-btn cancel-btn" @click="handleCancel" title="Änderungen verwerfen">
                        <svg fill="currentColor" height="18" viewBox="0 0 256 256" width="18"
                            xmlns="http://www.w3.org/2000/svg">
                            <path
                                d="M205.66,194.34a8,8,0,0,1-11.32,11.32L128,139.31,61.66,205.66a8,8,0,0,1-11.32-11.32L116.69,128,50.34,61.66A8,8,0,0,1,61.66,50.34L128,116.69l66.34-66.35a8,8,0,0,1,11.32,11.32L139.31,128Z">
                            </path>
                        </svg>
                        Abbrechen
                    </button>
                    <button class="action-btn save-btn" @click="handleSave" title="Änderungen speichern">
                        <svg fill="currentColor" height="18" viewBox="0 0 256 256" width="18"
                            xmlns="http://www.w3.org/2000/svg">
                            <path
                                d="M229.66,77.66l-128,128a8,8,0,0,1-11.32,0l-56-56a8,8,0,0,1,11.32-11.32L96,188.69,218.34,66.34a8,8,0,0,1,11.32,11.32Z">
                            </path>
                        </svg>
                        Speichern
                    </button>
                </div>
            </template>
        </Navbar>

        <!-- Main Content: 2-Column Layout -->
        <div class="main-content">
            <!-- Left Column: Demo Content (65%) -->
            <div class="left-column" :class="{ 'full-width': !hasActiveEdits }">
                <!-- Project Section -->
                <ProjectHeader v-if="viewMode === 'project' && selectedProjectId" :project-id="selectedProjectId" />

                <!-- Hero Section (same as /demo) -->
                <div v-if="currentEvent" class="demo-hero" style="position: relative;">
                    <!-- Corner Banner for Demo Mode -->
                    <CornerBanner v-if="viewMode === 'demo'" text="demo" />

                    <!-- Edit button (only visible in edit mode) -->
                    <button v-if="hasActiveEdits" class="hero-edit-btn"
                        @click.stop="activateEntity('event', currentEvent)" title="Event bearbeiten"
                        :class="{ 'is-active': activeEntityType === 'event' && activeEntityId === currentEvent.id }">
                        <svg viewBox="0 0 20 20" fill="currentColor">
                            <path
                                d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                        </svg>
                    </button>

                    <!-- Hero Image with Warning for Deprecated cimg -->
                    <div v-if="getHeroImage(currentEvent).url" class="hero-image-container">
                        <img :src="getHeroImage(currentEvent).url" :alt="currentEvent.name" />

                        <!-- Big Warning Icon for Deprecated cimg -->
                        <div v-if="getHeroImage(currentEvent).isDeprecated" class="hero-warning-icon"
                            title="Using deprecated cimg field">
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                                <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" />
                                <path d="M12 7v6m0 4h.01" stroke="currentColor" stroke-width="2"
                                    stroke-linecap="round" />
                            </svg>
                        </div>
                    </div>

                    <div class="hero-content">
                        <HeadingParser :content="currentEvent.name" as="h2" />
                        <p v-if="currentEvent.teaser" class="hero-teaser">{{ currentEvent.teaser }}</p>
                        <div class="hero-dates">
                            {{ formatEventDate(currentEvent.date_begin) }} – {{ formatEventDate(currentEvent.date_end)
                            }}
                        </div>
                    </div>
                </div>

                <!-- Posts Section -->
                <!-- Posts Section -->
                <div v-if="currentEventPosts.length > 0" class="content-section">
                    <h3 class="section-title">Aktuelle Beiträge</h3>
                    <div class="entity-grid">
                        <div v-for="post in currentEventPosts" :key="post.id" class="entity-card"
                            :class="{ 'is-active': activeEntityId === post.id && activeEntityType === 'post' }">
                            <!-- Edit button (only visible in edit mode) -->
                            <button v-if="hasActiveEdits" class="entity-edit-btn"
                                @click.stop="activateEntity('post', post)" title="Beitrag bearbeiten"
                                :class="{ 'is-active': activeEntityId === post.id && activeEntityType === 'post' }">
                                <svg viewBox="0 0 20 20" fill="currentColor">
                                    <path
                                        d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                </svg>
                            </button>

                            <img v-if="post.cimg" :src="post.cimg" :alt="post.name" class="entity-image" />

                            <div class="entity-content">
                                <HeadingParser :content="post.name" as="h4" />
                                <p v-if="post.teaser" class="entity-teaser">{{ post.teaser }}</p>
                            </div>
                        </div>
                    </div>

                    <!-- Tasks for Posts (only additional tasks, not main) -->
                    <div v-if="hasActiveEdits && !showOnlyMainTasks" class="entity-tasks">
                        <div class="tasks-header">
                            <h4>Zusätzliche Aufgaben</h4>
                            <button class="add-task-btn" @click="openTaskModal('post')" title="Aufgabe hinzufügen">
                                <svg fill="currentColor" height="16" viewBox="0 0 256 256" width="16"
                                    xmlns="http://www.w3.org/2000/svg">
                                    <path
                                        d="M224,128a8,8,0,0,1-8,8H136v80a8,8,0,0,1-16,0V136H40a8,8,0,0,1,0-16h80V40a8,8,0,0,1,16,0v80h80A8,8,0,0,1,224,128Z">
                                    </path>
                                </svg>
                            </button>
                        </div>
                        <div v-if="getAdditionalTasks('post').length > 0" class="task-list">
                            <div v-for="task in getAdditionalTasks('post')" :key="task.id" class="task-item">
                                <span class="task-status-badge" :class="`status-${task.status_name}`">{{
                                    task.status_name
                                    }}</span>
                                <span class="task-title">{{ task.name }}</span>
                                <button class="task-edit-btn" @click="openTaskModal('post', task)"
                                    title="Aufgabe bearbeiten">
                                    ✎
                                </button>
                            </div>
                        </div>
                        <p v-else class="no-tasks">Keine zusätzlichen Aufgaben</p>
                    </div>
                </div>

                <!-- Locations Section -->
                <div v-if="currentEventLocations.length > 0" class="content-section">
                    <h3 class="section-title">Veranstaltungsorte</h3>
                    <div class="entity-grid">
                        <div v-for="location in currentEventLocations" :key="location.id" class="entity-card"
                            :class="{ 'is-active': activeEntityId === location.id && activeEntityType === 'location' }">
                            <!-- Edit button (only visible in edit mode) -->
                            <button v-if="hasActiveEdits" class="entity-edit-btn"
                                @click.stop="activateEntity('location', location)" title="Ort bearbeiten"
                                :class="{ 'is-active': activeEntityId === location.id && activeEntityType === 'location' }">
                                <svg viewBox="0 0 20 20" fill="currentColor">
                                    <path
                                        d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                </svg>
                            </button>

                            <img v-if="location.cimg" :src="location.cimg" :alt="location.name" class="entity-image" />

                            <div class="entity-content">
                                <HeadingParser :content="location.name" as="h4" />
                                <p v-if="location.street" class="entity-info">{{ location.street }}</p>
                                <p v-if="location.zip || location.city" class="entity-info">{{ location.zip }} {{
                                    location.city }}</p>
                            </div>
                        </div>
                    </div>

                    <!-- Tasks for Locations -->
                    <div v-if="hasActiveEdits && !showOnlyMainTasks" class="entity-tasks">
                        <div class="tasks-header">
                            <h4>Zusätzliche Aufgaben</h4>
                            <button class="add-task-btn" @click="openTaskModal('location')" title="Aufgabe hinzufügen">
                                <svg fill="currentColor" height="16" viewBox="0 0 256 256" width="16"
                                    xmlns="http://www.w3.org/2000/svg">
                                    <path
                                        d="M224,128a8,8,0,0,1-8,8H136v80a8,8,0,0,1-16,0V136H40a8,8,0,0,1,0-16h80V40a8,8,0,0,1,16,0v80h80A8,8,0,0,1,224,128Z">
                                    </path>
                                </svg>
                            </button>
                        </div>
                        <div v-if="getAdditionalTasks('location').length > 0" class="task-list">
                            <div v-for="task in getAdditionalTasks('location')" :key="task.id" class="task-item">
                                <span class="task-status-badge" :class="`status-${task.status_name}`">{{
                                    task.status_name
                                    }}</span>
                                <span class="task-title">{{ task.name }}</span>
                                <button class="task-edit-btn" @click="openTaskModal('location', task)"
                                    title="Aufgabe bearbeiten">
                                    ✎
                                </button>
                            </div>
                        </div>
                        <p v-else class="no-tasks">Keine zusätzlichen Aufgaben</p>
                    </div>
                </div>

                <!-- Instructors Section -->
                <div v-if="currentEventInstructors.length > 0" class="content-section">
                    <h3 class="section-title">Kursleiter</h3>
                    <div class="entity-grid">
                        <div v-for="instructor in currentEventInstructors" :key="instructor.id" class="entity-card"
                            :class="{ 'is-active': activeEntityId === instructor.id && activeEntityType === 'instructor' }">
                            <!-- Edit button (only visible in edit mode) -->
                            <button v-if="hasActiveEdits" class="entity-edit-btn"
                                @click.stop="activateEntity('instructor', instructor)" title="Kursleiter bearbeiten"
                                :class="{ 'is-active': activeEntityId === instructor.id && activeEntityType === 'instructor' }">
                                <svg viewBox="0 0 20 20" fill="currentColor">
                                    <path
                                        d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                </svg>
                            </button>

                            <img v-if="instructor.cimg" :src="instructor.cimg" :alt="instructor.name"
                                class="entity-image" />

                            <div class="entity-content">
                                <HeadingParser :content="instructor.name" as="h4" />
                                <p v-if="instructor.description" class="entity-info">{{ instructor.description }}</p>
                            </div>
                        </div>
                    </div>

                    <!-- Tasks for Instructors -->
                    <div v-if="hasActiveEdits && !showOnlyMainTasks" class="entity-tasks">
                        <div class="tasks-header">
                            <h4>Zusätzliche Aufgaben</h4>
                            <button class="add-task-btn" @click="openTaskModal('instructor')"
                                title="Aufgabe hinzufügen">
                                <svg fill="currentColor" height="16" viewBox="0 0 256 256" width="16"
                                    xmlns="http://www.w3.org/2000/svg">
                                    <path
                                        d="M224,128a8,8,0,0,1-8,8H136v80a8,8,0,0,1-16,0V136H40a8,8,0,0,1,0-16h80V40a8,8,0,0,1,16,0v80h80A8,8,0,0,1,224,128Z">
                                    </path>
                                </svg>
                            </button>
                        </div>
                        <div v-if="getAdditionalTasks('instructor').length > 0" class="task-list">
                            <div v-for="task in getAdditionalTasks('instructor')" :key="task.id" class="task-item">
                                <span class="task-status-badge" :class="`status-${task.status_name}`">{{
                                    task.status_name
                                    }}</span>
                                <span class="task-title">{{ task.name }}</span>
                                <button class="task-edit-btn" @click="openTaskModal('instructor', task)"
                                    title="Aufgabe bearbeiten">
                                    ✎
                                </button>
                            </div>
                        </div>
                        <p v-else class="no-tasks">Keine zusätzlichen Aufgaben</p>
                    </div>
                </div>
            </div>

            <!-- Right Column: Editing Forms (35%, hidden in view mode) -->
            <div v-if="hasActiveEdits" class="right-column">
                <!-- Main Task Form -->
                <div class="form-section main-task-section">
                    <div class="form-header">
                        <div class="form-title">
                            <svg fill="currentColor" height="20" viewBox="0 0 256 256" width="20"
                                xmlns="http://www.w3.org/2000/svg">
                                <path
                                    d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Zm40-68a8,8,0,0,1,0,16H128a8,8,0,0,1-8-8V88a8,8,0,0,1,16,0v56Z">
                                </path>
                            </svg>
                            <span>Haupt-Aufgabe</span>
                        </div>
                        <button class="toggle-advanced-btn" @click="showAdvancedTaskFields = !showAdvancedTaskFields"
                            :title="showAdvancedTaskFields ? 'Erweiterte Felder ausblenden' : 'Erweiterte Felder anzeigen'">
                            <svg fill="currentColor" height="18" viewBox="0 0 256 256" width="18"
                                xmlns="http://www.w3.org/2000/svg">
                                <path
                                    d="M128,80a48,48,0,1,0,48,48A48.05,48.05,0,0,0,128,80Zm0,80a32,32,0,1,1,32-32A32,32,0,0,1,128,160Zm88-29.84q.06-2.16,0-4.32l14.92-18.64a8,8,0,0,0,1.48-7.06,107.6,107.6,0,0,0-10.88-26.25,8,8,0,0,0-6-3.93l-23.72-2.64q-1.48-1.56-3-3L186,40.54a8,8,0,0,0-3.94-6,107.29,107.29,0,0,0-26.25-10.86,8,8,0,0,0-7.06,1.48L130.16,40Q128,40,125.84,40L107.2,25.11a8,8,0,0,0-7.06-1.48A107.6,107.6,0,0,0,73.89,34.51a8,8,0,0,0-3.93,6L67.32,64.27q-1.56,1.49-3,3L40.54,70a8,8,0,0,0-6,3.94,107.71,107.71,0,0,0-10.87,26.25,8,8,0,0,0,1.49,7.06L40,125.84Q40,128,40,130.16L25.11,148.8a8,8,0,0,0-1.48,7.06,107.6,107.6,0,0,0,10.88,26.25,8,8,0,0,0,6,3.93l23.72,2.64q1.49,1.56,3,3L70,215.46a8,8,0,0,0,3.94,6,107.71,107.71,0,0,0,26.25,10.87,8,8,0,0,0,7.06-1.49L125.84,216q2.16.06,4.32,0l18.64,14.92a8,8,0,0,0,7.06,1.48,107.21,107.21,0,0,0,26.25-10.88,8,8,0,0,0,3.93-6l2.64-23.72q1.56-1.48,3-3L215.46,186a8,8,0,0,0,6-3.94,107.71,107.71,0,0,0,10.87-26.25,8,8,0,0,0-1.49-7.06Zm-16.1-6.5a73.93,73.93,0,0,1,0,8.68,8,8,0,0,0,1.74,5.48l14.19,17.73a91.57,91.57,0,0,1-6.23,15L187,173.11a8,8,0,0,0-5.1,2.64,74.11,74.11,0,0,1-6.14,6.14,8,8,0,0,0-2.64,5.1l-2.51,22.58a91.32,91.32,0,0,1-15,6.23l-17.74-14.19a8,8,0,0,0-5-1.75h-.48a73.93,73.93,0,0,1-8.68,0,8.06,8.06,0,0,0-5.48,1.74L100.45,215.8a91.57,91.57,0,0,1-15-6.23L82.89,187a8,8,0,0,0-2.64-5.1,74.11,74.11,0,0,1-6.14-6.14,8,8,0,0,0-5.1-2.64L46.43,170.6a91.32,91.32,0,0,1-6.23-15l14.19-17.74a8,8,0,0,0,1.74-5.48,73.93,73.93,0,0,1,0-8.68,8,8,0,0,0-1.74-5.48L40.2,100.45a91.57,91.57,0,0,1,6.23-15L69,82.89a8,8,0,0,0,5.1-2.64,74.11,74.11,0,0,1,6.14-6.14A8,8,0,0,0,82.89,69L85.4,46.43a91.32,91.32,0,0,1,15-6.23l17.74,14.19a8,8,0,0,0,5.48,1.74,73.93,73.93,0,0,1,8.68,0,8.06,8.06,0,0,0,5.48-1.74L155.55,40.2a91.57,91.57,0,0,1,15,6.23L173.11,69a8,8,0,0,0,2.64,5.1,74.11,74.11,0,0,1,6.14,6.14,8,8,0,0,0,5.1,2.64l22.58,2.51a91.32,91.32,0,0,1,6.23,15l-14.19,17.74A8,8,0,0,0,199.87,123.66Z">
                                </path>
                            </svg>
                        </button>
                    </div>

                    <div class="form-body">
                        <div class="form-group">
                            <label>Titel</label>
                            <input type="text" v-model="mainTaskForm.name" placeholder="Aufgaben-Titel"
                                @input="markAsEdited" />
                        </div>

                        <div class="form-group">
                            <label>Beschreibung</label>
                            <textarea v-model="mainTaskForm.description" placeholder="Beschreibung der Aufgabe" rows="3"
                                @input="markAsEdited"></textarea>
                        </div>

                        <!-- Advanced Fields (toggleable) -->
                        <div v-if="showAdvancedTaskFields" class="advanced-fields">
                            <div class="form-group">
                                <label>Status</label>
                                <select v-model="mainTaskForm.status" @change="markAsEdited">
                                    <option value="idea">Idee</option>
                                    <option value="new">Neu</option>
                                    <option value="draft">Entwurf</option>
                                    <option value="active">Aktiv</option>
                                    <option value="final">Fertig</option>
                                    <option value="reopen">Reopen</option>
                                </select>
                            </div>

                            <div class="form-group">
                                <label>Priorität</label>
                                <select v-model="mainTaskForm.priority" @change="markAsEdited">
                                    <option value="low">Niedrig</option>
                                    <option value="medium">Mittel</option>
                                    <option value="high">Hoch</option>
                                    <option value="urgent">Dringend</option>
                                </select>
                            </div>

                            <div class="form-group">
                                <label>Fälligkeitsdatum</label>
                                <input type="date" v-model="mainTaskForm.due_date" @input="markAsEdited" />
                            </div>

                            <div class="form-group">
                                <label>Bild URL</label>
                                <input type="text" v-model="mainTaskForm.cimg" placeholder="https://..."
                                    @input="markAsEdited" />
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Entity Content Form -->
                <div class="form-section entity-form-section">
                    <div class="form-header">
                        <div class="form-title">
                            <svg fill="currentColor" height="20" viewBox="0 0 256 256" width="20"
                                xmlns="http://www.w3.org/2000/svg">
                                <path
                                    d="M224,48H32a8,8,0,0,0-8,8V192a16,16,0,0,0,16,16H216a16,16,0,0,0,16-16V56A8,8,0,0,0,224,48Zm-96,85.15L52.57,64H203.43ZM98.71,128,40,181.81V74.19Zm11.84,10.85,12,11.05a8,8,0,0,0,10.82,0l12-11.05,58,53.15H52.57ZM157.29,128,216,74.18V181.82Z">
                                </path>
                            </svg>
                            <span>{{ activeEntityLabel }}</span>
                        </div>
                    </div>

                    <div class="form-body">
                        <!-- Event Form -->
                        <div v-if="activeEntityType === 'event'" class="entity-fields">
                            <div class="form-group">
                                <label>Name</label>
                                <input type="text" v-model="entityForm.name" @input="markAsEdited" />
                            </div>

                            <!-- Project and Image Selection Row -->
                            <div class="form-row">
                                <div class="form-group">
                                    <label>Projekt</label>
                                    <DropdownList entity="projects" title="Projekt wählen" size="small"
                                        @select="(project: any) => { entityForm.project_id = project.id; markAsEdited() }">
                                        <template #trigger="{ open, isOpen }">
                                            <button type="button" class="form-dropdown-trigger" @click="open">
                                                <span>{{ getProjectName(entityForm.project_id) || 'Projekt wählen'
                                                    }}</span>
                                                <svg class="chevron" :class="{ 'rotate-180': isOpen }" width="16"
                                                    height="16" viewBox="0 0 16 16" fill="none"
                                                    xmlns="http://www.w3.org/2000/svg">
                                                    <path d="M4 6L8 10L12 6" stroke="currentColor" stroke-width="2"
                                                        stroke-linecap="round" stroke-linejoin="round" />
                                                </svg>
                                            </button>
                                        </template>
                                    </DropdownList>
                                </div>
                                <div class="form-group">
                                    <label>Bild</label>
                                    <DropdownList entity="images" title="Bild wählen" size="small"
                                        @select="(image: any) => { entityForm.img_id = image.id; markAsEdited() }">
                                        <template #trigger="{ open, isOpen }">
                                            <button type="button" class="form-dropdown-trigger" @click="open">
                                                <span>{{ getImageName(entityForm.img_id) || 'Bild wählen' }}</span>
                                                <svg class="chevron" :class="{ 'rotate-180': isOpen }" width="16"
                                                    height="16" viewBox="0 0 16 16" fill="none"
                                                    xmlns="http://www.w3.org/2000/svg">
                                                    <path d="M4 6L8 10L12 6" stroke="currentColor" stroke-width="2"
                                                        stroke-linecap="round" stroke-linejoin="round" />
                                                </svg>
                                            </button>
                                        </template>
                                    </DropdownList>
                                </div>
                            </div>

                            <div class="form-group">
                                <label>Teaser</label>
                                <textarea v-model="entityForm.teaser" rows="3" @input="markAsEdited"></textarea>
                            </div>
                            <div class="form-row">
                                <div class="form-group">
                                    <label>Beginn</label>
                                    <input type="date" v-model="entityForm.date_begin" @input="markAsEdited" />
                                </div>
                                <div class="form-group">
                                    <label>Ende</label>
                                    <input type="date" v-model="entityForm.date_end" @input="markAsEdited" />
                                </div>
                            </div>
                            <div class="form-group">
                                <label>Bild URL (deprecated)</label>
                                <input type="text" v-model="entityForm.cimg" @input="markAsEdited" />
                            </div>
                        </div>

                        <!-- Post Form -->
                        <div v-if="activeEntityType === 'post'" class="entity-fields">
                            <div class="form-group">
                                <label>Titel</label>
                                <input type="text" v-model="entityForm.name" @input="markAsEdited" />
                            </div>
                            <div class="form-group">
                                <label>Teaser</label>
                                <textarea v-model="entityForm.teaser" rows="3" @input="markAsEdited"></textarea>
                            </div>
                            <div class="form-group">
                                <label>Bild URL</label>
                                <input type="text" v-model="entityForm.cimg" @input="markAsEdited" />
                            </div>
                        </div>

                        <!-- Location Form -->
                        <div v-if="activeEntityType === 'location'" class="entity-fields">
                            <div class="form-group">
                                <label>Name</label>
                                <input type="text" v-model="entityForm.name" @input="markAsEdited" />
                            </div>
                            <div class="form-group">
                                <label>Straße</label>
                                <input type="text" v-model="entityForm.street" @input="markAsEdited" />
                            </div>
                            <div class="form-row">
                                <div class="form-group">
                                    <label>PLZ</label>
                                    <input type="text" v-model="entityForm.zip" @input="markAsEdited" />
                                </div>
                                <div class="form-group">
                                    <label>Stadt</label>
                                    <input type="text" v-model="entityForm.city" @input="markAsEdited" />
                                </div>
                            </div>
                            <div class="form-row">
                                <div class="form-group">
                                    <label>Telefon</label>
                                    <input type="text" v-model="entityForm.phone" @input="markAsEdited" />
                                </div>
                                <div class="form-group">
                                    <label>E-Mail</label>
                                    <input type="email" v-model="entityForm.email" @input="markAsEdited" />
                                </div>
                            </div>
                            <div class="form-group">
                                <label>Bild URL</label>
                                <input type="text" v-model="entityForm.cimg" @input="markAsEdited" />
                            </div>
                        </div>

                        <!-- Instructor Form -->
                        <div v-if="activeEntityType === 'instructor'" class="entity-fields">
                            <div class="form-group">
                                <label>Name</label>
                                <input type="text" v-model="entityForm.name" @input="markAsEdited" />
                            </div>
                            <div class="form-group">
                                <label>Beschreibung</label>
                                <textarea v-model="entityForm.description" rows="3" @input="markAsEdited"></textarea>
                            </div>
                            <div class="form-row">
                                <div class="form-group">
                                    <label>Telefon</label>
                                    <input type="text" v-model="entityForm.phone" @input="markAsEdited" />
                                </div>
                                <div class="form-group">
                                    <label>E-Mail</label>
                                    <input type="email" v-model="entityForm.email" @input="markAsEdited" />
                                </div>
                            </div>
                            <div class="form-group">
                                <label>Stadt</label>
                                <input type="text" v-model="entityForm.city" @input="markAsEdited" />
                            </div>
                            <div class="form-group">
                                <label>Bild URL</label>
                                <input type="text" v-model="entityForm.cimg" @input="markAsEdited" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useAuth } from '@/composables/useAuth'
import Navbar from '@/components/Navbar.vue'
import HeadingParser from '@/components/HeadingParser.vue'
import ProjectHeader from '@/components/ProjectHeader.vue'
import CornerBanner from '@/components/CornerBanner.vue'
import { ItemList, DropdownList } from '@/components/clist'

const { user, requireAuth, logout: authLogout } = useAuth()

// Logout handler
const logout = () => {
    authLogout()
}

// View mode: 'demo' | 'new' | 'project'
const viewMode = ref<'demo' | 'new' | 'project'>('demo')
const selectedProjectId = ref<string | null>(null)

// Base data state
const events = ref<any[]>([])
const posts = ref<any[]>([])
const locations = ref<any[]>([])
const instructors = ref<any[]>([])
const projects = ref<any[]>([])
const images = ref<any[]>([])

// Current event
const currentEventId = ref<string | null>(null)
const currentEvent = computed(() => events.value.find((e: any) => e.id === currentEventId.value) || null)

// Current project (for navbar display)
const currentProject = computed(() => {
    if (!selectedProjectId.value) return null
    return projects.value.find((p: any) => p.id === selectedProjectId.value) || null
})

// Current event data
const currentEventPosts = computed(() => posts.value.filter((p: any) => p.event_id === currentEventId.value))
const currentEventLocations = computed(() => locations.value.filter((l: any) => l.event_id === currentEventId.value))
const currentEventInstructors = computed(() => instructors.value.filter((i: any) => i.event_id === currentEventId.value))

// Filtered events based on view mode
const filteredEvents = computed(() => {
    if (viewMode.value === 'demo') {
        // Filter events with xmlid starting with '_demo'
        return events.value.filter((e: any) => e.xmlid && e.xmlid.startsWith('_demo'))
    } else if (viewMode.value === 'new') {
        // Filter events with status_id = 25 (new)
        return events.value.filter((e: any) => e.status_id === 25)
    } else if (viewMode.value === 'project') {
        // Filter by selected project
        if (selectedProjectId.value) {
            return events.value.filter((e: any) => e.project_id === selectedProjectId.value)
        }
        return []
    }
    return events.value
})

// Watch viewMode and clear projectId when leaving project mode
watch(viewMode, (newMode: string) => {
    if (newMode !== 'project') {
        selectedProjectId.value = null
    }
})

// Hero Image Helper Functions
const getHeroImage = (event: any): { url: string; isDeprecated: boolean } => {
    // Priority 1: Check for deprecated cimg field
    if (event.cimg) {
        return { url: event.cimg, isDeprecated: true }
    }

    // Priority 2: Use img_wide JSONB field
    if (event.img_wide) {
        try {
            const imgData = typeof event.img_wide === 'string'
                ? JSON.parse(event.img_wide)
                : event.img_wide
            const url = generateImageUrl(imgData, 900, 450)
            return { url, isDeprecated: false }
        } catch (e) {
            console.error('Failed to parse img_wide:', e)
            return { url: '', isDeprecated: false }
        }
    }

    // No image available
    return { url: '', isDeprecated: false }
}

const generateImageUrl = (imgData: any, width: number, height: number): string => {
    const { type, url, id, x, y } = imgData

    // Unsplash URL generation
    if (type === 'unsplash' && id) {
        return `https://images.unsplash.com/photo-${id}?w=${width}&h=${height}`
    }

    // Cloudinary URL generation
    if (type === 'cloudinary' && id) {
        const cloud = imgData.cloud || 'default-cloud'
        return `https://res.cloudinary.com/${cloud}/image/upload/w_${width},h_${height}/${id}`
    }

    // Fallback to direct URL
    return url || ''
}

// Fetch data from API
const fetchEvents = async () => {
    try {
        const response = await fetch('/api/events?isbase=1')
        if (!response.ok) throw new Error('Failed to fetch events')
        events.value = await response.json()

        // Set first event as current if none selected
        if (events.value.length > 0 && !currentEventId.value) {
            currentEventId.value = events.value[0].id
        }
    } catch (error) {
        console.error('Error fetching events:', error)
    }
}

const fetchPosts = async () => {
    try {
        const response = await fetch('/api/posts?isbase=1')
        if (!response.ok) throw new Error('Failed to fetch posts')
        posts.value = await response.json()
    } catch (error) {
        console.error('Error fetching posts:', error)
    }
}

const fetchLocations = async () => {
    try {
        const response = await fetch('/api/locations?isbase=1')
        if (!response.ok) throw new Error('Failed to fetch locations')
        locations.value = await response.json()
    } catch (error) {
        console.error('Error fetching locations:', error)
    }
}

const fetchInstructors = async () => {
    try {
        const response = await fetch('/api/public-users')
        if (!response.ok) throw new Error('Failed to fetch instructors')
        instructors.value = await response.json()
    } catch (error) {
        console.error('Error fetching instructors:', error)
    }
}

const fetchProjects = async () => {
    try {
        const response = await fetch('/api/projects')
        if (!response.ok) throw new Error('Failed to fetch projects')
        projects.value = await response.json()
    } catch (error) {
        console.error('Error fetching projects:', error)
    }
}

const fetchImages = async () => {
    try {
        const response = await fetch('/api/images')
        if (!response.ok) throw new Error('Failed to fetch images')
        images.value = await response.json()
    } catch (error) {
        console.error('Error fetching images:', error)
    }
}

const refreshSqlData = async () => {
    await Promise.all([
        fetchEvents(),
        fetchPosts(),
        fetchLocations(),
        fetchInstructors(),
        fetchProjects(),
        fetchImages()
    ])
}

const switchEvent = (eventId: string) => {
    currentEventId.value = eventId
}

// Events dropdown
const isEventsOpen = ref(false)
const eventsSelectorRef = ref<HTMLElement>()

// Active entity (currently being edited)
const activeEntityType = ref<'event' | 'post' | 'location' | 'instructor' | null>(null)
const activeEntityId = ref<string | null>(null)

// Edit state
const hasActiveEdits = ref(false)

// Forms
const mainTaskForm = ref({
    id: null as string | null,
    name: '',  // Renamed from title
    description: '',
    status: 'idea',  // Default to idea (not new)
    priority: 'medium',
    due_date: '',
    cimg: '',  // Renamed from image
    category: 'main'
})

const entityForm = ref<any>({})
const showAdvancedTaskFields = ref(false)

// Tasks state
const allTasks = ref<any[]>([])
const showOnlyMainTasks = ref(false) // TODO: Get from dashboard settings

// Computed
const activeEntityLabel = computed(() => {
    if (!activeEntityType.value) return 'Entität'
    const labels: Record<string, string> = {
        event: 'Event-Daten',
        post: 'Beitrag-Daten',
        location: 'Ort-Daten',
        instructor: 'Kursleiter-Daten'
    }
    return labels[activeEntityType.value] || 'Entität'
})

// Transform events for ItemList component
const eventsListItems = computed(() => {
    return events.value.map((event: any) => ({
        content: event.name,
        cimg: event.cimg,
        props: {
            onClick: () => {
                handleEventSelect(event)
                isEventsOpen.value = false
            }
        }
    }))
})

// Methods
const toggleEventsDropdown = () => {
    isEventsOpen.value = !isEventsOpen.value
}

const handleEventSelect = (event: any) => {
    switchEvent(event.id)
    isEventsOpen.value = false
    // Reset active entity when switching events
    if (currentEvent.value) {
        activateEntity('event', currentEvent.value)
    }
}

const selectEvent = (eventId: string) => {
    switchEvent(eventId)
    isEventsOpen.value = false
    // Reset active entity when switching events
    if (currentEvent.value) {
        activateEntity('event', currentEvent.value)
    }
}

const setViewMode = () => {
    // View mode - just clear active entity
    activeEntityType.value = null
    activeEntityId.value = null
    hasActiveEdits.value = false
}

const setEditMode = async () => {
    // Edit mode - refresh data and activate event
    await refreshSqlData()
    await loadAllTasks()
    if (currentEvent.value) {
        await activateEntity('event', currentEvent.value)
    }
    // Set edit mode AFTER activateEntity (which resets it to false)
    hasActiveEdits.value = true
}

const activateEntity = async (type: 'event' | 'post' | 'location' | 'instructor', entity: any) => {
    activeEntityType.value = type
    activeEntityId.value = entity.id

    // Load entity data into form
    entityForm.value = { ...entity }

    // Load main task for this entity
    await loadMainTask(type, entity.id)

    // Reset edit state when changing entity
    hasActiveEdits.value = false
}

const loadMainTask = async (recordType: string, recordId: string) => {
    try {
        // Fetch main task for this entity
        const url = `/api/tasks?category=main&record_type=${recordType}&record_id=${recordId}`
        console.log('🔍 Loading main task:', { recordType, recordId, url })

        const response = await fetch(url)
        if (response.ok) {
            const data = await response.json()
            console.log('📋 API response:', data)

            // API returns { success, tasks: [...], counts }
            const tasks = data.tasks || []
            console.log('📋 Tasks array:', tasks)

            if (tasks && tasks.length > 0) {
                const task = tasks[0]
                mainTaskForm.value = {
                    id: task.id,
                    name: task.name || '',  // Renamed from title
                    description: task.description || '',
                    status: task.status_name || task.status || 'idea',  // Use status_name from API
                    priority: task.priority || 'medium',
                    due_date: task.due_date || '',
                    cimg: task.cimg || '',  // Renamed from image
                    category: 'main'
                }
                console.log('✅ Main task loaded:', mainTaskForm.value)
            } else {
                // No main task exists, create empty form
                console.log('⚠️ No main task found, resetting form')
                resetMainTaskForm()
            }
        } else {
            console.error('❌ API response not ok:', response.status)
            resetMainTaskForm()
        }
    } catch (error) {
        console.error('❌ Error loading main task:', error)
        resetMainTaskForm()
    }
}

const resetMainTaskForm = () => {
    mainTaskForm.value = {
        id: null,
        name: '',  // Renamed from title
        description: '',
        status: 'idea',  // Default to idea (not new)
        priority: 'medium',
        due_date: '',
        cimg: '',  // Renamed from image
        category: 'main'
    }
}

const markAsEdited = () => {
    hasActiveEdits.value = true
}

const handleSave = async () => {
    try {
        console.log('💾 Starting save...', {
            activeEntityType: activeEntityType.value,
            activeEntityId: activeEntityId.value,
            entityForm: entityForm.value,
            mainTaskForm: mainTaskForm.value
        })

        // Save entity data
        if (activeEntityType.value && activeEntityId.value) {
            console.log('💾 Saving entity...')
            await saveEntity()
            console.log('✅ Entity saved')
        }

        // Save main task
        console.log('💾 Saving main task...')
        await saveMainTask()
        console.log('✅ Main task saved')

        // Refresh data from database (this updates the left column display)
        console.log('🔄 Refreshing data from database...')
        await refreshSqlData()
        console.log('✅ Data refreshed')

        // Reset edit state - the forms keep their current values which are the saved values
        hasActiveEdits.value = false

        console.log('✅ Save complete!')
    } catch (error) {
        console.error('❌ Error saving:', error)
        alert('Fehler beim Speichern!')
    }
}

const handleCancel = async () => {
    if (hasActiveEdits.value) {
        const confirmed = window.confirm('Änderungen verwerfen?')
        if (!confirmed) return
    }

    // Reload original data
    if (activeEntityType.value && activeEntityId.value) {
        const originalEntity = getOriginalEntity()
        if (originalEntity) {
            entityForm.value = { ...originalEntity }
            await loadMainTask(activeEntityType.value, activeEntityId.value)
        }
    }

    hasActiveEdits.value = false

    // If in subEntity mode, return to event
    if (activeEntityType.value !== 'event' && currentEvent.value) {
        await activateEntity('event', currentEvent.value)
    }
}

const getOriginalEntity = () => {
    if (!activeEntityType.value || !activeEntityId.value) return null

    switch (activeEntityType.value) {
        case 'event':
            return currentEvent.value
        case 'post':
            return currentEventPosts.value.find((p: any) => p.id === activeEntityId.value)
        case 'location':
            return currentEventLocations.value.find((l: any) => l.id === activeEntityId.value)
        case 'instructor':
            return currentEventInstructors.value.find((i: any) => i.id === activeEntityId.value)
        default:
            return null
    }
}

const saveEntity = async () => {
    const tableName = getTableName(activeEntityType.value!)
    const url = `/api/demo/${tableName}/${activeEntityId.value}`

    console.log('📤 Saving entity to:', url)
    console.log('📤 Entity data:', entityForm.value)

    const response = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entityForm.value)
    })

    console.log('📥 Save response status:', response.status)

    if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ Save failed:', errorText)
        throw new Error(`Failed to save ${activeEntityType.value}: ${response.status}`)
    }

    const result = await response.json()
    console.log('✅ Save result:', result)
    return result
}

const saveMainTask = async () => {
    if (!activeEntityType.value || !activeEntityId.value) {
        console.log('⚠️ No active entity, skipping main task save')
        return
    }

    const taskData = {
        ...mainTaskForm.value,
        record_type: activeEntityType.value,
        record_id: activeEntityId.value,
        category: 'main'
    }

    // Remove id from data if it's null (creating new task)
    if (!taskData.id) {
        delete taskData.id
    }

    const method = taskData.id ? 'PUT' : 'POST'
    const url = taskData.id ? `/api/tasks/${taskData.id}` : '/api/tasks'

    console.log('📤 Saving main task:', { method, url, taskData })

    const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskData)
    })

    console.log('📥 Main task response status:', response.status)

    if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ Main task save failed:', errorText)
        throw new Error(`Failed to save main task: ${response.status}`)
    }

    const result = await response.json()
    console.log('✅ Main task save result:', result)
    return result
}

const getTableName = (entityType: string): string => {
    const mapping: Record<string, string> = {
        event: 'events',
        post: 'posts',
        location: 'locations',
        instructor: 'instructors'
    }
    return mapping[entityType] || entityType
}

const formatEventDate = (dateString: string) => {
    try {
        const date = new Date(dateString)
        return date.toLocaleDateString('de-DE', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        })
    } catch {
        return dateString
    }
}

// Tasks functions
const loadAllTasks = async () => {
    try {
        const response = await fetch('/api/tasks')
        if (response.ok) {
            const data = await response.json()
            // API returns { success, tasks: [...], counts }
            const tasks = data.tasks || []
            // Ensure we always set an array
            allTasks.value = Array.isArray(tasks) ? tasks : []
            console.log('📋 Loaded tasks:', allTasks.value.length)
        } else {
            console.error('❌ Failed to load tasks:', response.status)
            allTasks.value = []
        }
    } catch (error) {
        console.error('❌ Error loading tasks:', error)
        allTasks.value = []
    }
}

const getAdditionalTasks = (recordType: string) => {
    // Ensure allTasks.value is always an array before filtering
    if (!Array.isArray(allTasks.value)) {
        console.warn('⚠️ allTasks.value is not an array:', allTasks.value)
        return []
    }

    // Filter tasks that are:
    // 1. Not main tasks (category !== 'main')
    // 2. Match the record type
    // 3. Match the current event's entities
    return allTasks.value.filter((task: any) => {
        return task.category !== 'main' && task.record_type === recordType
    })
}

const openTaskModal = (recordType: string, task?: any) => {
    // TODO: Implement task modal for creating/editing additional tasks
    console.log('Open task modal for', recordType, task)
    alert(`Task modal für ${recordType} wird noch implementiert`)
}

// Helper functions for dropdowns
const getProjectName = (projectId: number | null | undefined) => {
    if (!projectId) return null
    const project = projects.value.find((p: any) => p.id === projectId)
    return project ? (project.heading || project.name || `Project ${projectId}`) : `Project ${projectId}`
}

const getImageName = (imageId: number | null | undefined) => {
    if (!imageId) return null
    const image = images.value.find((img: any) => img.id === imageId)
    return image ? (image.about || `Image ${imageId}`) : `Image ${imageId}`
}

// Click outside to close dropdown
const handleClickOutside = (event: Event) => {
    if (eventsSelectorRef.value && !eventsSelectorRef.value.contains(event.target as Node)) {
        isEventsOpen.value = false
    }
}

// Initialize
onMounted(async () => {
    await requireAuth()
    document.addEventListener('click', handleClickOutside)

    // Fetch base data from API
    await refreshSqlData()
})

onUnmounted(() => {
    document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.base-view {
    min-height: 100vh;
    background: var(--color-bg);
    display: flex;
    flex-direction: column;
}

/* ===== NAVBAR SLOT COMPONENTS ===== */

/* Events Selector */
.events-selector {
    position: relative;
}

/* Mode Toggle */
.mode-toggle {
    display: flex;
    background: var(--color-card-bg);
    border: var(--border) solid var(--color-border);
    border-radius: var(--radius-button);
    overflow: hidden;
}

.mode-btn {
    padding: 0.5rem 1rem;
    border: none;
    background: transparent;
    color: var(--color-dimmed);
    font-size: 0.75rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
}

.mode-btn:hover {
    background: var(--color-muted-bg);
    color: var(--color-contrast);
}

.mode-btn.active {
    background: var(--color-primary-bg);
    color: var(--color-primary-contrast);
}

/* Action Buttons */
.action-buttons {
    display: flex;
    gap: 0.5rem;
}

.action-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    border: var(--border) solid var(--color-border);
    border-radius: var(--radius-button);
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
}

.cancel-btn {
    background: var(--color-card-bg);
    color: var(--color-contrast);
}

.cancel-btn:hover {
    background: var(--color-muted-bg);
}

.save-btn {
    background: var(--color-primary-bg);
    color: var(--color-primary-contrast);
}

.save-btn:hover {
    opacity: 0.9;
}

/* ===== MAIN CONTENT ===== */
.main-content {
    display: flex;
    flex: 1;
    gap: 1rem;
    padding: 2rem;
    max-width: 100%;
}

/* Left Column */
.left-column {
    flex: 0 0 65%;
    overflow-y: auto;
}

.left-column.full-width {
    flex: 1;
}

/* Right Column */
.right-column {
    flex: 0 0 35%;
    overflow-y: auto;
    border-left: var(--border) solid var(--color-border);
    padding-left: 1rem;
}

.right-column-content {
    background: var(--color-card-bg);
    border: var(--border) solid var(--color-border);
    border-radius: var(--radius-button);
    padding: 2rem;
    text-align: center;
}

.placeholder-text {
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--color-contrast);
    margin: 0 0 1rem 0;
}

.placeholder-subtext {
    font-size: 0.875rem;
    color: var(--color-dimmed);
    line-height: 1.6;
}

/* ===== DEMO CONTENT (LEFT COLUMN) ===== */
.demo-hero {
    position: relative;
    background: var(--color-card-bg);
    border: var(--border) solid var(--color-border);
    border-radius: var(--radius-button);
    overflow: hidden;
    margin-bottom: 2rem;
    transition: all 0.2s ease;
}

.hero-edit-btn {
    position: absolute;
    top: 1rem;
    left: 1rem;
    width: 2.5rem;
    height: 2.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--color-card-bg);
    border: var(--border) solid var(--color-border);
    border-radius: var(--radius-button);
    color: var(--color-contrast);
    cursor: pointer;
    transition: all 0.2s ease;
    z-index: 10;
}

.hero-edit-btn:hover,
.hero-edit-btn.is-active {
    background: var(--color-primary-bg);
    color: var(--color-primary-contrast);
    transform: translateY(-1px);
    box-shadow: 0 4px 8px oklch(0% 0 0 / 0.15);
}

.hero-edit-btn svg {
    width: 1.25rem;
    height: 1.25rem;
}

.hero-image {
    width: 100%;
    height: 16rem;
    overflow: hidden;
}

.hero-image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.hero-image-container {
    position: relative;
    width: 100%;
    height: 16rem;
    overflow: hidden;
}

.hero-image-container img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.hero-warning-icon {
    position: absolute;
    top: 1rem;
    right: 1rem;
    width: 64px;
    height: 64px;
    background: var(--color-warning-bg);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    z-index: 10;
    cursor: help;
}

.hero-warning-icon svg {
    width: 40px;
    height: 40px;
}

.hero-content {
    padding: 1.5rem;
}

.hero-content h2 {
    font-size: 1.5rem;
    font-weight: 700;
    margin: 0 0 0.5rem 0;
    color: var(--color-contrast);
}

.hero-subtitle {
    font-size: 1rem;
    font-weight: 600;
    color: var(--color-primary-bg);
    margin: 0 0 0.5rem 0;
}

.hero-teaser {
    font-size: 0.875rem;
    color: var(--color-dimmed);
    margin: 0 0 1rem 0;
    line-height: 1.5;
}

.hero-dates {
    font-size: 0.875rem;
    color: var(--color-dimmed);
    font-weight: 500;
}

/* Content Sections */
.content-section {
    margin-bottom: 2rem;
}

.section-title {
    font-size: 1.25rem;
    font-weight: 600;
    margin: 0 0 1rem 0;
    color: var(--color-contrast);
}

.entity-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 1rem;
}

.entity-card {
    position: relative;
    background: var(--color-card-bg);
    border: var(--border) solid var(--color-border);
    border-radius: var(--radius-button);
    overflow: hidden;
    transition: all 0.2s ease;
}

.entity-card:hover {
    box-shadow: 0 4px 12px oklch(0% 0 0 / 0.1);
}

.entity-card.is-active {
    border-color: var(--color-primary-bg);
    box-shadow: 0 0 0 2px var(--color-primary-bg);
}

.entity-edit-btn {
    position: absolute;
    top: 0.75rem;
    left: 0.75rem;
    width: 2rem;
    height: 2rem;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--color-card-bg);
    border: var(--border) solid var(--color-border);
    border-radius: var(--radius-button);
    color: var(--color-contrast);
    cursor: pointer;
    transition: all 0.2s ease;
    z-index: 10;
}

.entity-edit-btn:hover,
.entity-edit-btn.is-active {
    background: var(--color-primary-bg);
    color: var(--color-primary-contrast);
    transform: translateY(-1px);
}

.entity-edit-btn svg {
    width: 1rem;
    height: 1rem;
}

.entity-image {
    width: 100%;
    height: 10rem;
    object-fit: cover;
}

.entity-content {
    padding: 1rem;
}

.entity-content h4 {
    font-size: 1rem;
    font-weight: 600;
    margin: 0 0 0.5rem 0;
    color: var(--color-contrast);
}

.entity-subtitle,
.entity-teaser,
.entity-info {
    font-size: 0.875rem;
    color: var(--color-dimmed);
    margin: 0 0 0.25rem 0;
    line-height: 1.4;
}

/* ===== TASKS ===== */
.entity-tasks {
    margin-top: 1rem;
    padding: 1rem;
    background: var(--color-muted-bg);
    border-radius: var(--radius-button);
}

.tasks-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 0.75rem;
}

.tasks-header h4 {
    font-size: 0.875rem;
    font-weight: 600;
    margin: 0;
    color: var(--color-contrast);
}

.add-task-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 1.75rem;
    height: 1.75rem;
    background: var(--color-primary-bg);
    color: var(--color-primary-contrast);
    border: none;
    border-radius: 50%;
    cursor: pointer;
    transition: all 0.2s ease;
}

.add-task-btn:hover {
    transform: scale(1.1);
}

.task-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.task-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem;
    background: var(--color-card-bg);
    border-radius: 0.25rem;
}

.task-status-badge {
    font-size: 0.625rem;
    padding: 0.125rem 0.375rem;
    border-radius: 0.25rem;
    font-weight: 600;
    text-transform: uppercase;
    flex-shrink: 0;
}

.task-status-badge.status-idea {
    background: #fef3c7;
    color: #92400e;
}

.task-status-badge.status-new {
    background: #dbeafe;
    color: #1e40af;
}

.task-status-badge.status-draft {
    background: #fce7f3;
    color: #9f1239;
}

.task-status-badge.status-final {
    background: #d1fae5;
    color: #065f46;
}

.task-status-badge.status-reopen {
    background: #fed7aa;
    color: #9a3412;
}

.task-title {
    font-size: 0.875rem;
    color: var(--color-contrast);
    flex: 1;
}

.task-edit-btn {
    background: none;
    border: none;
    color: var(--color-dimmed);
    cursor: pointer;
    font-size: 1rem;
    padding: 0.25rem;
}

.task-edit-btn:hover {
    color: var(--color-primary-bg);
}

.no-tasks {
    font-size: 0.875rem;
    color: var(--color-dimmed);
    font-style: italic;
    margin: 0;
}

/* ===== FORMS (RIGHT COLUMN) ===== */
.form-section {
    background: var(--color-card-bg);
    border: var(--border) solid var(--color-border);
    border-radius: var(--radius-button);
    margin-bottom: 1rem;
}

.form-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem;
    border-bottom: var(--border) solid var(--color-border);
}

.form-title {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-weight: 600;
    font-size: 0.875rem;
    color: var(--color-contrast);
}

.toggle-advanced-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2rem;
    height: 2rem;
    background: var(--color-muted-bg);
    border: none;
    border-radius: 50%;
    color: var(--color-contrast);
    cursor: pointer;
    transition: all 0.2s ease;
}

.toggle-advanced-btn:hover {
    background: var(--color-primary-bg);
    color: var(--color-primary-contrast);
}

.form-body {
    padding: 1rem;
}

.form-group {
    margin-bottom: 1rem;
}

.form-group:last-child {
    margin-bottom: 0;
}

.form-group label {
    display: block;
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--color-contrast);
    margin-bottom: 0.25rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
}

.form-group input,
.form-group textarea,
.form-group select {
    width: 100%;
    padding: 0.5rem;
    background: var(--color-bg);
    border: var(--border) solid var(--color-border);
    border-radius: 0.25rem;
    color: var(--color-contrast);
    font-size: 0.875rem;
    transition: all 0.2s ease;
}

.form-group input:focus,
.form-group textarea:focus,
.form-group select:focus {
    outline: none;
    border-color: var(--color-primary-bg);
    box-shadow: 0 0 0 2px oklch(from var(--color-primary-bg) l c h / 0.2);
}

.form-row {
    display: flex;
    gap: 1rem;
}

.form-row .form-group {
    flex: 1;
}

.form-dropdown-trigger {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.5rem;
    background: var(--color-bg);
    border: var(--border) solid var(--color-border);
    border-radius: 0.25rem;
    color: var(--color-contrast);
    font-size: 0.875rem;
    cursor: pointer;
    transition: all 0.2s ease;
    text-align: left;
}

.form-dropdown-trigger:hover {
    border-color: var(--color-primary-bg);
}

.form-dropdown-trigger .chevron {
    transition: transform 0.2s;
    flex-shrink: 0;
    margin-left: 0.5rem;
}

.form-dropdown-trigger .chevron.rotate-180 {
    transform: rotate(180deg);
}

.advanced-fields {
    margin-top: 1rem;
    padding-top: 1rem;
    border-top: var(--border) solid var(--color-border);
}

/* ===== RESPONSIVE ===== */
@media (max-width: 1200px) {
    .main-content {
        flex-direction: column;
    }

    .left-column,
    .right-column {
        flex: 1;
        border-left: none;
        padding-left: 0;
    }
}

/* View Mode Toggle Styles */
.view-mode-toggle {
    display: flex;
    background: var(--color-card-bg);
    border: var(--border) solid var(--color-border);
    border-radius: var(--radius-button);
    overflow: hidden;
    margin-right: 0.5rem;
}

.view-mode-toggle .view-mode-btn {
    padding: 0.5rem 0.875rem;
    border: none;
    background: transparent;
    color: var(--color-dimmed);
    font-size: 0.75rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    border-right: 1px solid var(--color-border);
    text-transform: uppercase;
    letter-spacing: 0.025em;
}

.view-mode-toggle .view-mode-btn:last-child {
    border-right: none;
}

.view-mode-toggle .view-mode-btn:hover {
    background: var(--color-muted-bg);
    color: var(--color-contrast);
}

.view-mode-toggle .view-mode-btn.active {
    background: var(--color-primary-bg);
    color: var(--color-primary-contrast);
}

.project-selector-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.project-selector-btn .chevron {
    transition: transform 0.2s ease;
}

.project-selector-btn .chevron.rotate-180 {
    transform: rotate(180deg);
}

@media (max-width: 768px) {
    .topbar {
        flex-direction: column;
        align-items: stretch;
        gap: 1rem;
    }

    .topbar-center {
        justify-content: flex-start;
    }

    .topbar-right {
        flex-wrap: wrap;
    }

    .entity-grid {
        grid-template-columns: 1fr;
    }

    .main-content {
        padding: 1rem;
    }

    .form-row {
        flex-direction: column;
    }
}
</style>
