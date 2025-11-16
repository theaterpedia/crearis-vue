<template>
    <div class="start-page">
        <!-- Edit Panel -->
        <EditPanel v-if="project" :is-open="isEditPanelOpen" :title="`Edit ${project.heading || 'Start'}`"
            subtitle="Update start page information and content" :data="editPanelData" @close="closeEditPanel"
            @save="handleSaveProject" />

        <!-- Navigation Config Panel -->
        <NavigationConfigPanel v-if="project" :is-open="isConfigPanelOpen" :project-id="project.domaincode"
            @close="closeConfigPanel" />

        <!-- PageLayout wrapper -->
        <PageLayout v-if="project" :asideOptions="asideOptions" :footerOptions="footerOptions"
            :projectDomaincode="project.domaincode" :navItems="navItems" navbarMode="page">
            <!-- TopNav Actions Slot - Edit and Config buttons -->
            <template #topnav-actions>
                <!-- Edit Panel Button -->
                <EditPanelButton :is-authenticated="!!user" :is-admin="user?.activeRole === 'admin'"
                    :is-owner="isProjectOwner" @open="openEditPanel" />

                <!-- Page Config Button -->
                <button v-if="canEdit" class="config-btn" @click="openPageConfig" aria-label="Page Configuration"
                    title="Page Configuration">
                    <svg fill="currentColor" height="20" viewBox="0 0 256 256" width="20"
                        xmlns="http://www.w3.org/2000/svg">
                        <path
                            d="M128,80a48,48,0,1,0,48,48A48.05,48.05,0,0,0,128,80Zm0,80a32,32,0,1,1,32-32A32,32,0,0,1,128,160Zm88-29.84q.06-2.16,0-4.32l14.92-18.64a8,8,0,0,0,1.48-7.06,107.6,107.6,0,0,0-10.88-26.25,8,8,0,0,0-6-3.93l-23.72-2.64q-1.48-1.56-3-3L186,40.54a8,8,0,0,0-3.94-6,107.29,107.29,0,0,0-26.25-10.86,8,8,0,0,0-7.06,1.48L130.16,40Q128,40,125.84,40L107.2,25.11a8,8,0,0,0-7.06-1.48A107.6,107.6,0,0,0,73.89,34.51a8,8,0,0,0-3.93,6L67.32,64.27q-1.56,1.49-3,3L40.54,70a8,8,0,0,0-6,3.94,107.71,107.71,0,0,0-10.87,26.25,8,8,0,0,0,1.49,7.06L40,125.84Q40,128,40,130.16L25.11,148.8a8,8,0,0,0-1.48,7.06,107.6,107.6,0,0,0,10.88,26.25,8,8,0,0,0,6,3.93l23.72,2.64q1.49,1.56,3,3L70,215.46a8,8,0,0,0,3.94,6,107.71,107.71,0,0,0,26.25,10.87,8,8,0,0,0,7.06-1.49L125.84,216q2.16.06,4.32,0l18.64,14.92a8,8,0,0,0,7.06,1.48,107.21,107.21,0,0,0,26.25-10.88,8,8,0,0,0,3.93-6l2.64-23.72q1.56-1.48,3-3L215.46,186a8,8,0,0,0,6-3.94,107.71,107.71,0,0,0,10.87-26.25,8,8,0,0,0-1.49-7.06Zm-16.1-6.5a73.93,73.93,0,0,1,0,8.68,8,8,0,0,0,1.74,5.48l14.19,17.73a91.57,91.57,0,0,1-6.23,15L187,173.11a8,8,0,0,0-5.1,2.64,74.11,74.11,0,0,1-6.14,6.14,8,8,0,0,0-2.64,5.1l-2.51,22.58a91.32,91.32,0,0,1-15,6.23l-17.74-14.19a8,8,0,0,0-5-1.75h-.48a73.93,73.93,0,0,1-8.68,0,8.06,8.06,0,0,0-5.48,1.74L100.45,215.8a91.57,91.57,0,0,1-15-6.23L82.89,187a8,8,0,0,0-2.64-5.1,74.11,74.11,0,0,1-6.14-6.14,8,8,0,0,0-5.1-2.64L46.43,170.6a91.32,91.32,0,0,1-6.23-15l14.19-17.74a8,8,0,0,0,1.74-5.48,73.93,73.93,0,0,1,0-8.68,8,8,0,0,0-1.74-5.48L40.2,100.45a91.57,91.57,0,0,1,6.23-15L69,82.89a8,8,0,0,0,5.1-2.64,74.11,74.11,0,0,1,6.14-6.14A8,8,0,0,0,82.89,69L85.4,46.43a91.32,91.32,0,0,1,15-6.23l17.74,14.19a8,8,0,0,0,5.48,1.74,73.93,73.93,0,0,1,8.68,0,8.06,8.06,0,0,0,5.48-1.74L155.55,40.2a91.57,91.57,0,0,1,15,6.23L173.11,69a8,8,0,0,0,2.64,5.1,74.11,74.11,0,0,1,6.14,6.14,8,8,0,0,0,5.1,2.64l22.58,2.51a91.32,91.32,0,0,1,6.23,15l-14.19,17.74A8,8,0,0,0,199.87,123.66Z">
                        </path>
                    </svg>
                </button>
            </template>

            <!-- Hero Section -->
            <template #header>
                <StartPageHero :user="user">
                    <div class="registration-header">
                        <h2>Konferenz-Anmeldung 2025</h2>
                        <p>Bitte gib deine E-Mail-Adresse ein, um fortzufahren</p>
                    </div>

                    <!-- Double Entry Banner -->
                    <div v-if="hasExistingInteraction" class="double-entry-banner">
                        <div class="banner-content">
                            <p class="banner-message">
                                Deine Anmeldung ist gespeichert, du erhältst in 1-2 Tagen eine Bestätigungs-Email.
                                Logge dich hier auch einfach erneut ein, um den Status deiner Anmeldung zu verfolgen.
                            </p>
                            <div v-if="interactionStatusValue !== null && interactionStatusValue > 1"
                                class="banner-confirmed">
                                <p class="confirmed-text">✓ Anmeldung bestätigt!</p>
                                <router-link to="/login" class="btn-login">Jetzt einloggen</router-link>
                            </div>
                        </div>
                    </div>

                    <!-- Email Input Row -->
                    <div class="email-input-row">
                        <div class="form-group">
                            <label for="email" class="form-label">E-Mail-Adresse</label>
                            <div class="email-input-wrapper">
                                <input id="email" v-model="emailInput" type="email" class="form-input"
                                    placeholder="deine.email@example.com" @input="handleEmailInput"
                                    @focus="handleEmailInput" />

                                <!-- Email suggestions dropdown -->
                                <div v-if="showSuggestions" class="email-suggestions">
                                    <button v-for="email in emailSuggestions" :key="email" type="button"
                                        class="suggestion-item" @click="selectEmail(email)">
                                        {{ email }}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div class="form-group">
                            <label class="form-label">Status</label>
                            <div class="status-display">
                                <span v-if="!usermode || usermode === 'no'" class="status-badge status-none">
                                    Keine E-Mail eingegeben
                                </span>
                                <span v-else-if="usermode === 'guest'" class="status-badge status-guest">
                                    Neue Anmeldung
                                </span>
                                <span v-else-if="usermode === 'user'" class="status-badge status-user">
                                    Bestehender Nutzer
                                </span>
                                <span v-else-if="usermode === 'verified'" class="status-badge status-verified">
                                    Verifiziert
                                </span>
                                <span v-else-if="usermode === 'loggedin'" class="status-badge status-loggedin">
                                    Eingeloggt
                                </span>
                            </div>
                        </div>
                    </div>

                    <!-- Password Input for existing users -->
                    <div v-if="usermode === 'user'" class="password-row">
                        <div class="form-group">
                            <label for="password" class="form-label">Passwort</label>
                            <input id="password" v-model="passwordInput" type="password" class="form-input"
                                placeholder="Dein Passwort eingeben" @keyup.enter="validatePassword" />
                        </div>
                        <div class="form-group">
                            <button class="btn-primary" @click="validatePassword" :disabled="isValidatingPassword">
                                {{ isValidatingPassword ? 'Wird überprüft...' : 'OK' }}
                            </button>
                        </div>
                    </div>
                </StartPageHero>
            </template>

            <!-- Registration Section -->
            <section class="registration-section bg-accent">
                <div class="container">
                    <!-- Interaction Form -->
                    <div v-if="showForm && interactionFields" class="form-container">
                        <CreateInteraction :form-name="interactionFields" :show="showForm"
                            :project-domaincode="project?.domaincode" :user-id="currentUser?.id"
                            :user-email="emailInput" @saved="handleFormSaved" @error="handleFormError" />
                    </div>
                </div>
            </section>

            <!-- Main Content -->
            <Section background="default">
                <Container>
                    <!-- Test Image Dropdowns with Width/Columns Variations -->
                    <div style="margin-bottom: 2rem;">
                        <h3>Compact (width=small, styleCompact=true)</h3>
                        <DropdownList entity="images" size="medium" width="small" columns="off"
                            title="Small Width - Compact Style" :show-preview="true" :show-toolbar="false" />
                    </div>

                    <div style="margin-bottom: 2rem;">
                        <h3>Non-Compact (width=large, styleCompact=false)</h3>
                        <DropdownList entity="images" size="medium" width="large" columns="off"
                            title="Large Width - Non-Compact Style" :show-preview="true" :show-toolbar="false" />
                    </div>

                    <div style="margin-bottom: 2rem;">
                        <h3>Multi-Column (width=inherit, columns=on)</h3>
                        <DropdownList entity="images" size="medium" width="inherit" columns="on"
                            title="Multi-Column Layout" :show-preview="true" :show-toolbar="false" />
                    </div>

                    <div style="margin-bottom: 2rem;">
                        <h3>Small Size (ItemRow - should ignore width/columns)</h3>
                        <DropdownList entity="images" size="small" title="Small Images (img_thumb)" :show-preview="true"
                            :show-toolbar="false" />
                    </div>

                    <Columns gap="medium" align="top">

                        <Column width="2/3">
                            <Prose>
                                <Heading overline="Join Us" headline="Theaterpedia Conference 2025" is="h1" />

                                <h2>Munich, Germany</h2>
                                <p><strong>November 20-23, 2025</strong></p>

                                <h3>About the Conference</h3>
                                <p>
                                    Join theater professionals, educators, and enthusiasts from around the world
                                    for four days of workshops, performances, and networking at the annual
                                    Theaterpedia Conference.
                                </p>

                                <h3>What to Expect</h3>
                                <ul>
                                    <li><strong>Workshops & Masterclasses:</strong> Learn from industry leaders and
                                        experienced practitioners</li>
                                    <li><strong>Performances:</strong> Evening showcase of innovative theater
                                        productions
                                    </li>
                                    <li><strong>Networking:</strong> Connect with theater professionals from across
                                        Europe
                                    </li>
                                    <li><strong>Panel Discussions:</strong> Explore current trends and challenges in
                                        theater
                                        education</li>
                                </ul>

                                <h3>Schedule Overview</h3>
                                <ul>
                                    <li><strong>November 20:</strong> Opening Ceremony & Keynote Speech</li>
                                    <li><strong>November 21:</strong> Workshop Day 1 & Evening Performance</li>
                                    <li><strong>November 22:</strong> Workshop Day 2 & Panel Discussions</li>
                                    <li><strong>November 23:</strong> Final Presentations & Closing Event</li>
                                </ul>

                                <h3>Venue</h3>
                                <p>
                                    The conference will be held at the historic <strong>Münchner
                                        Volkstheater</strong>,
                                    located in the heart of Munich's cultural district.
                                </p>

                                <h3>Registration</h3>
                                <p>
                                    Early bird registration is now open! Complete the registration form to secure
                                    your spot. Space is limited to 150 participants.
                                </p>

                                <p><strong>Registration Fees:</strong></p>
                                <ul>
                                    <li>Early Bird (until Oct 31): €250</li>
                                    <li>Standard (Nov 1-10): €350</li>
                                    <li>Late Registration (after Nov 10): €450</li>
                                    <li>Student Rate: €150 (with valid ID)</li>
                                </ul>
                            </Prose>
                        </Column>
                    </Columns>
                </Container>
            </Section>

            <!-- Upcoming Events Section -->
            <Section background="muted">
                <Container>
                    <pList type="events" :project-domaincode="project.domaincode" item-type="card" size="medium"
                        header="Upcoming Events" is-footer />
                </Container>
            </Section>

            <!-- ModalSelector Demo Section -->
            <Section background="accent">
                <Container>
                    <Heading headline="ModalSelector Demo" is="h2" />
                    <Prose>
                        <p>The ModalSelector component provides a full-screen modal for selecting entities (posts,
                            events, instructors). It supports both list and gallery views with interactive selection.
                        </p>
                        <div style="display: flex; gap: 1rem; margin-top: 1.5rem;">
                            <button class="btn-primary" @click="openModal('posts')">
                                Select Post
                            </button>
                            <button class="btn-primary" @click="openModal('events')">
                                Select Event
                            </button>
                            <button class="btn-primary" @click="openModal('instructors')">
                                Select Instructor
                            </button>
                        </div>
                        <div v-if="selectedItem"
                            style="margin-top: 1.5rem; padding: 1rem; background: white; border-radius: 0.5rem;">
                            <strong>Selected:</strong> {{ selectedItem.heading || selectedItem.title || 'Unknown' }}
                        </div>
                    </Prose>
                </Container>
            </Section>

            <!-- DropdownList Multi-Select Demo Section -->
            <Section background="muted">
                <Container>
                    <Heading headline="DropdownList Multi-Select Demo" is="h2" />
                    <Prose>
                        <p>This demonstrates the DropdownList component with dataMode and multiSelect enabled for
                            instructors.
                            Toggle between small (ItemRow) and medium (ItemTile) display sizes.</p>

                        <div
                            style="display: flex; gap: 1rem; align-items: center; margin-top: 1.5rem; margin-bottom: 1rem;">
                            <label style="font-weight: 500;">Display Size:</label>
                            <button :class="['btn-toggle', { 'active': instructorSize === 'small' }]"
                                @click="instructorSize = 'small'">
                                Small (Row)
                            </button>
                            <button :class="['btn-toggle', { 'active': instructorSize === 'medium' }]"
                                @click="instructorSize = 'medium'">
                                Medium (Tile)
                            </button>
                        </div>

                        <DropdownList entity="instructors" :project="FIXED_PROJECT_ID" title="Select Instructors"
                            :size="instructorSize" :dataMode="true" :multiSelect="true"
                            v-model:selectedIds="selectedInstructorIds" @selectedXml="handleInstructorXml"
                            @selected="handleInstructorSelected">
                            <template #trigger="{ open, isOpen }">
                                <button class="form-dropdown-trigger" @click="open" style="min-width: 300px;">
                                    <span v-if="selectedInstructorIds && selectedInstructorIds.length > 0">
                                        {{ selectedInstructorIds.length }} instructor(s) selected
                                    </span>
                                    <span v-else>Select instructors</span>
                                    <svg class="chevron" :class="{ 'rotate-180': isOpen }" width="16" height="16"
                                        viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M4 6L8 10L12 6" stroke="currentColor" stroke-width="2"
                                            stroke-linecap="round" stroke-linejoin="round" />
                                    </svg>
                                </button>
                            </template>
                        </DropdownList>

                        <div v-if="selectedInstructors && selectedInstructors.length > 0"
                            style="margin-top: 1.5rem; padding: 1rem; background: white; border-radius: 0.5rem;">
                            <strong>Selected Instructors:</strong>
                            <ul style="margin-top: 0.5rem; padding-left: 1.5rem;">
                                <li v-for="instructor in selectedInstructors" :key="instructor.id">
                                    {{ instructor.entityname || instructor.name }} (ID: {{ instructor.id }})
                                </li>
                            </ul>
                            <div v-if="selectedInstructorXml"
                                style="margin-top: 1rem; padding: 0.75rem; background: #f3f4f6; border-radius: 0.375rem; font-family: monospace; font-size: 0.875rem;">
                                <strong>XML IDs:</strong> {{ Array.isArray(selectedInstructorXml) ?
                                    selectedInstructorXml.join(', ')
                                    : selectedInstructorXml }}
                            </div>
                        </div>
                    </Prose>
                </Container>
            </Section>

            <!-- DropdownGallery Demo Section -->
            <Section background="default">
                <Container>
                    <Heading headline="DropdownGallery Demo" is="h2" />
                    <Prose>
                        <p>This demonstrates the DropdownGallery component displaying events in card format.
                            Gallery view optimized for visual browsing with image-heavy content.</p>

                        <div
                            style="display: flex; gap: 1rem; align-items: center; margin-top: 1.5rem; margin-bottom: 1rem;">
                            <label style="font-weight: 500;">Card Size:</label>
                            <button :class="['btn-toggle', { 'active': gallerySize === 'small' }]"
                                @click="gallerySize = 'small'">
                                Small
                            </button>
                            <button :class="['btn-toggle', { 'active': gallerySize === 'medium' }]"
                                @click="gallerySize = 'medium'">
                                Medium
                            </button>
                        </div>

                        <DropdownGallery entity="events" :project="FIXED_PROJECT_ID" title="Select Event (Gallery)"
                            :size="gallerySize" variant="square">
                            <template #trigger="{ open, isOpen }">
                                <button class="form-dropdown-trigger" @click="open" style="min-width: 300px;">
                                    <span>Select from gallery</span>
                                    <svg class="chevron" :class="{ 'rotate-180': isOpen }" width="16" height="16"
                                        viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M4 6L8 10L12 6" stroke="currentColor" stroke-width="2"
                                            stroke-linecap="round" stroke-linejoin="round" />
                                    </svg>
                                </button>
                            </template>
                        </DropdownGallery>
                    </Prose>
                </Container>
            </Section>

            <!-- pList Demos Section -->
            <Section background="accent">
                <Container>
                    <Heading headline="pList Demos" is="h2" />
                    <Prose>
                        <p>The pList component demonstrates different use cases:</p>
                        <ul>
                            <li><strong>Basic Display:</strong> Static list without selection (default dataMode=false)
                            </li>
                            <li><strong>Preview Modal:</strong> Click items to view details in modal with teaser</li>
                            <li><strong>Multi-Select:</strong> Data mode enabled for batch selection</li>
                        </ul>

                        <div
                            style="display: flex; gap: 1rem; align-items: center; margin-top: 1.5rem; margin-bottom: 1rem;">
                            <label style="font-weight: 500;">Display Size:</label>
                            <button :class="['btn-toggle', { 'active': instructorSize === 'small' }]"
                                @click="instructorSize = 'small'">
                                Small (Row)
                            </button>
                            <button :class="['btn-toggle', { 'active': instructorSize === 'medium' }]"
                                @click="instructorSize = 'medium'">
                                Medium (Tile)
                            </button>
                        </div>
                    </Prose>

                    <!-- Demo A: Basic Display (Static) -->
                    <div style="margin-top: 2rem;">
                        <h3 style="margin-bottom: 1rem;">0. Basic Display (Static Interaction)</h3>
                        <pList type="instructors" :project="FIXED_PROJECT_ID" :size="instructorSize"
                            interaction="static" :dataMode="false" />
                    </div>

                    <!-- Demo Start: List SimplePreview Modal -->
                    <div style="margin-top: 2rem;">
                        <h3 style="margin-bottom: 1rem;">Start: Events Medium (Click to View Details)</h3>
                        <pList entity="events" :project="FIXED_PROJECT_ID" size="medium" interaction="previewmodal"
                            :dataMode="false" />
                    </div>

                    <!-- Demo Team: List SimplePreview Modal -->
                    <div style="margin-top: 2rem;">
                        <h3 style="margin-bottom: 1rem;">Team: Instructors small Preview Modal (Click to View
                            Details)</h3>
                        <pList entity="instructors" :project="FIXED_PROJECT_ID" size="small" interaction="previewmodal"
                            :dataMode="false" />
                    </div>

                    <!-- Demo BLog: Start SimplePreview Modal -->
                    <div style="margin-top: 2rem;">
                        <h3 style="margin-bottom: 1rem;">Start: Events Medium</h3>
                        <pList entity="posts" :project="FIXED_PROJECT_ID" size="medium" interaction="previewmodal"
                            :dataMode="false" />
                    </div>

                    <!-- Demo BLog: Dev SimplePreview Modal -->
                    <div style="margin-top: 2rem;">
                        <h3 style="margin-bottom: 1rem;">Dev: Posts Medium</h3>
                        <pList entity="posts" project="dev" size="medium" interaction="previewmodal"
                            :dataMode="false" />
                    </div>

                    <!-- Demo 2: Preview Modal -->
                    <div style="margin-top: 2rem;">
                        <h3 style="margin-bottom: 1rem;">2. Preview Modal (Click to View Details)</h3>
                        <pList type="instructors" :project="FIXED_PROJECT_ID" :size="instructorSize"
                            interaction="previewmodal" :dataMode="false" />
                    </div>

                    <!-- Demo 3: Multi-Select with Data Mode -->
                    <div style="margin-top: 2rem;">
                        <h3 style="margin-bottom: 1rem;">3. Multi-Select Mode (Data Mode Enabled)</h3>
                        <pList type="instructors" :project="FIXED_PROJECT_ID" :size="instructorSize"
                            interaction="static" :dataMode="true" :multiSelect="true"
                            v-model:selectedIds="selectedPlistInstructorIds" @selectedXml="handlePlistInstructorXml"
                            @selected="handlePlistInstructorSelected" />

                        <div v-if="selectedPlistInstructors && selectedPlistInstructors.length > 0"
                            style="margin-top: 1.5rem; padding: 1rem; background: white; border-radius: 0.5rem;">
                            <strong>Selected Instructors (pList):</strong>
                            <ul style="margin-top: 0.5rem; padding-left: 1.5rem;">
                                <li v-for="instructor in selectedPlistInstructors" :key="instructor.id">
                                    {{ instructor.entityname || instructor.name }} (ID: {{ instructor.id }})
                                </li>
                            </ul>
                            <div v-if="selectedPlistInstructorXml"
                                style="margin-top: 1rem; padding: 0.75rem; background: #f3f4f6; border-radius: 0.375rem; font-family: monospace; font-size: 0.875rem;">
                                <strong>XML IDs:</strong> {{ Array.isArray(selectedPlistInstructorXml) ?
                                    selectedPlistInstructorXml.join(', ')
                                    : selectedPlistInstructorXml }}
                            </div>
                        </div>
                    </div>
                </Container>
            </Section>

            <!-- XML Filtering Demo Section -->
            <Section background="muted">
                <Container>
                    <Heading headline="XML ID Filtering Demo ✨ NEW" is="h2" />
                    <Prose>
                        <p>Demonstrates XML ID filtering capabilities for advanced entity filtering without requiring
                            database IDs.</p>

                        <!-- Demo 1: Filter by Prefix -->
                        <div style="margin-top: 2rem;">
                            <h3>Filter by XML Prefix</h3>
                            <p>Shows only entities with XML IDs starting with "tp.instructor"</p>
                            <pList type="instructors" :project-domaincode="FIXED_PROJECT_ID" size="small"
                                filterXmlPrefix="tp.instructor" header="TP Instructors Only" />
                        </div>

                        <!-- Demo 2: Filter by Multiple Prefixes -->
                        <div style="margin-top: 2rem;">
                            <h3>Filter by Multiple Prefixes (OR Logic)</h3>
                            <p>Shows events OR instructors from Theaterpedia project</p>
                            <p><em>Note: Requires entity="all" support (coming soon)</em></p>
                            <code
                                style="display: block; padding: 0.5rem; background: #f3f4f6; border-radius: 0.25rem; margin-top: 0.5rem;">
                    :filterXmlPrefixes="['tp.event', 'tp.instructor']"
                </code>
                        </div>

                        <!-- Demo 3: Combined Filtering -->
                        <div style="margin-top: 2rem;">
                            <h3>Combined Filtering</h3>
                            <p>Combines multiple filter types with AND logic:</p>
                            <ul>
                                <li>filterIds: [1, 2, 3] (numeric ID filter)</li>
                                <li>filterXmlPrefix: "tp" (project filter)</li>
                                <li>Pattern: exclude archived items</li>
                            </ul>
                        </div>
                    </Prose>
                </Container>
            </Section>

            <!-- pGallery Demos Section -->
            <Section background="default">
                <Container>
                    <Heading headline="pGallery Demos" is="h2" />
                    <Prose>
                        <p>The pGallery component is aligned with pList but optimized for gallery-style grid layouts.
                            Uses ItemList with multi-column display for responsive image galleries.</p>
                        <ul>
                            <li><strong>Full-Width Gallery:</strong> Responsive grid layout with tiles</li>
                            <li><strong>Multi-Column:</strong> Automatic wrapping based on container width</li>
                            <li><strong>XML Filtering:</strong> Same filtering capabilities as pList</li>
                            <li><strong>Selection Support:</strong> Optional dataMode for batch operations</li>
                        </ul>
                    </Prose>

                    <!-- Demo 0: Basic Gallery -->
                    <div style="margin-top: 2rem;">
                        <h3 style="margin-bottom: 1rem;">0. Basic Gallery (Static, Multi-Column)</h3>
                        <pGallery type="events" :project="FIXED_PROJECT_ID" size="medium" header="Event Gallery"
                            interaction="static" />
                    </div>

                    <!-- Demo 1: Gallery Simple with Preview Modal -->
                    <div style="margin-top: 2rem;">
                        <h3 style="margin-bottom: 1rem;">1. Simple Gallery with Preview Modal</h3>
                        <pGallery entity="events" :project="FIXED_PROJECT_ID" size="medium" onActivate="modal" />
                    </div>

                    <!-- Demo 2: Gallery with Preview Modal -->
                    <div style="margin-top: 2rem;">
                        <h3 style="margin-bottom: 1rem;">2. Gallery with Preview Modal</h3>
                        <pGallery type="instructors" :project-domaincode="FIXED_PROJECT_ID" size="medium"
                            header="Instructor Gallery" interaction="previewmodal" />
                    </div>

                    <!-- Demo 4: Gallery with Selection -->
                    <div style="margin-top: 2rem;">
                        <h3 style="margin-bottom: 1rem;">3. Gallery with Multi-Select (Data Mode)</h3>
                        <pGallery type="events" :project-domaincode="FIXED_PROJECT_ID" size="medium"
                            header="Select Events from Gallery" :dataMode="true" :multiSelect="true"
                            v-model:selectedIds="selectedGalleryEventIds" @selected="handleGalleryEventsSelected" />

                        <div v-if="selectedGalleryEvents && selectedGalleryEvents.length > 0"
                            style="margin-top: 1.5rem; padding: 1rem; background: white; border-radius: 0.5rem;">
                            <strong>Selected Events (Gallery):</strong>
                            <ul style="margin-top: 0.5rem; padding-left: 1.5rem;">
                                <li v-for="event in selectedGalleryEvents" :key="event.id">
                                    {{ event.heading || event.title }} (ID: {{ event.id }})
                                </li>
                            </ul>
                        </div>
                    </div>
                </Container>
            </Section>

            <!-- Modal Component -->
            <ModalSelector :is-open="isModalOpen" :entity="modalEntity" :project="FIXED_PROJECT_ID"
                :title="`Select ${modalEntity}`" size="medium" variant="square" default-display="gallery"
                @close="isModalOpen = false" @select="handleModalSelect" />

            <!-- Footer -->
            <template #footer>
                <HomeSiteFooter />
            </template>
        </PageLayout>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import PageLayout from '@/components/PageLayout.vue'
import EditPanel from '@/components/EditPanel.vue'
import EditPanelButton from '@/components/EditPanelButton.vue'
import NavigationConfigPanel from '@/components/NavigationConfigPanel.vue'
import HomeSiteFooter from '@/views/Home/HomeComponents/homeSiteFooter.vue'
import StartPageHero from '../Home/HomeComponents/StartPageHero.vue'
import pList from '@/components/page/pList.vue'
import pGallery from '@/components/page/pGallery.vue'
import CreateInteraction from '@/components/forms/CreateInteraction.vue'
import Section from '@/components/Section.vue'
import Container from '@/components/Container.vue'
import Columns from '@/components/Columns.vue'
import Column from '@/components/Column.vue'
import Prose from '@/components/Prose.vue'
import Heading from '@/components/Heading.vue'
import type { EditPanelData } from '@/components/EditPanel.vue'
import { parseAsideOptions, parseFooterOptions, type AsideOptions, type FooterOptions } from '@/composables/usePageOptions'
import { getPublicNavItems } from '@/config/navigation'
import type { TopnavParentItem } from '@/components/TopNav.vue'
import { isValidEmail } from '@/utils/fieldListUtility'
import { pageSettings } from '@/settings'
import DropdownList from '@/components/clist/DropdownList.vue'
import DropdownGallery from '@/components/clist/DropdownGallery.vue'
import ModalSelector from '@/components/clist/ModalSelector.vue'
import { useTheme } from '@/composables/useTheme'

const router = useRouter()
const route = useRoute()

// SEO: Set meta tags from settings (Start/Conference page)
function setStartPageSeoMeta() {
    // Set title
    document.title = `Konferenz - ${pageSettings.seo_title}`;

    // Helper to set or update meta tag
    const setMeta = (selector: string, attributes: Record<string, string>) => {
        let element = document.head.querySelector(selector);
        if (!element) {
            const tagMatch = selector.match(/^(\w+)\[/);
            const tag = tagMatch && tagMatch[1] ? tagMatch[1] : 'meta';
            element = document.createElement(tag);
            document.head.appendChild(element);
        }
        Object.entries(attributes).forEach(([key, value]) => {
            if (value) {
                element!.setAttribute(key, value);
            }
        });
    };

    // Basic meta tags
    const startDescription = `Anmeldung zur Theaterpedia-Konferenz. ${pageSettings.seo_description}`;
    const startKeywords = `${pageSettings.seo_keywords}, Konferenz, Anmeldung, Event`;

    setMeta('meta[name="description"]', { name: 'description', content: startDescription });
    setMeta('meta[name="keywords"]', { name: 'keywords', content: startKeywords });

    // Open Graph tags
    setMeta('meta[property="og:title"]', { property: 'og:title', content: `Konferenz - ${pageSettings.og_title}` });
    setMeta('meta[property="og:description"]', { property: 'og:description', content: startDescription });
    setMeta('meta[property="og:type"]', { property: 'og:type', content: 'website' });
    setMeta('meta[property="og:image"]', { property: 'og:image', content: pageSettings.seo_image });

    // Twitter Card tags
    setMeta('meta[name="twitter:card"]', { name: 'twitter:card', content: pageSettings.twitter_card });
    setMeta('meta[name="twitter:title"]', { name: 'twitter:title', content: `Konferenz - ${pageSettings.og_title}` });
    setMeta('meta[name="twitter:description"]', { name: 'twitter:description', content: startDescription });
    setMeta('meta[name="twitter:image"]', { name: 'twitter:image', content: pageSettings.seo_image });
}

// Get public navigation items
const navItems = computed<TopnavParentItem[]>(() => {
    return getPublicNavItems().map(item => ({
        label: item.label,
        link: item.link
    }))
})

// State - Fixed to project 'start'
const FIXED_PROJECT_ID = 'start'
const user = ref<any>(null)
const project = ref<any>(null)
const isEditPanelOpen = ref(false)
const isConfigPanelOpen = ref(false)

// Props for usermode
interface Props {
    usermode?: 'no' | 'guest' | 'user' | 'verified' | 'loggedin'
    validatedEmail?: string
}

const props = withDefaults(defineProps<Props>(), {
    usermode: 'no',
    validatedEmail: ''
})

// Registration form state
const usermode = ref<'no' | 'guest' | 'user' | 'verified' | 'loggedin' | undefined>(props.usermode)
const validatedEmail = ref(props.validatedEmail)
const emailInput = ref('')
const passwordInput = ref('')
const emailSuggestions = ref<string[]>([])
const allUserEmails = ref<string[]>([])
const allUsers = ref<any[]>([])
const showSuggestions = ref(false)
const isValidatingPassword = ref(false)
const currentUser = ref<any>(null)
const hasExistingInteraction = ref(false)
const interactionStatusValue = ref<number | null>(null)

// Modal selector state
const isModalOpen = ref(false)
const modalEntity = ref<'posts' | 'events' | 'instructors'>('events')
const selectedItem = ref<any>(null)

// DropdownList multi-select demo state
const instructorSize = ref<'small' | 'medium'>('small')
const selectedInstructorIds = ref<number[]>([])
const selectedInstructorXml = ref<string | string[]>([])
const selectedInstructors = ref<any[]>([])

// DropdownGallery demo state
const gallerySize = ref<'small' | 'medium'>('small')

// pList multi-select demo state
const selectedPlistInstructorIds = ref<number[]>([])
const selectedPlistInstructorXml = ref<string | string[]>([])
const selectedPlistInstructors = ref<any[]>([])

// pGallery multi-select demo state
const selectedGalleryEventIds = ref<number[]>([])
const selectedGalleryEvents = ref<any[]>([])

// Parse options for PageLayout
const asideOptions = computed<AsideOptions>(() => {
    if (!project.value) return {}
    return parseAsideOptions(project.value)
})

const footerOptions = computed<FooterOptions>(() => {
    if (!project.value) return {}
    return parseFooterOptions(project.value)
})

// Edit panel data computed from project
const editPanelData = computed<EditPanelData>(() => {
    if (!project.value) {
        return {
            heading: '',
            teaser: '',
            cimg: '',
            header_type: '',
            header_size: '',
            md: ''
        }
    }
    return {
        heading: project.value.heading || '',
        teaser: project.value.teaser || '',
        cimg: project.value.cimg || '',
        header_type: project.value.header_type || '',
        header_size: project.value.header_size || '',
        md: project.value.md || ''
    }
})

// Check if current user is the project owner
const isProjectOwner = computed(() => {
    if (!user.value || !project.value) return false
    return user.value.activeRole === 'project' && user.value.projectId === FIXED_PROJECT_ID
})

// Check if user can edit (admin or project owner)
const canEdit = computed(() => {
    if (!user.value) return false
    return user.value.activeRole === 'admin' || isProjectOwner.value
})

// Check if user already has an interaction entry
async function checkExistingInteraction() {
    if (!usermode.value || usermode.value === 'no' || !validatedEmail.value) {
        hasExistingInteraction.value = false
        interactionStatusValue.value = null
        return
    }

    try {
        const response = await fetch(`/api/interactions?user_email=${encodeURIComponent(validatedEmail.value)}`)
        if (response.ok) {
            const data = await response.json()
            if (data.items && data.items.length > 0) {
                hasExistingInteraction.value = true
                // Get the status value from the most recent interaction
                const interaction = data.items[0]
                // Fetch the status to get its value
                if (interaction.status_id) {
                    const statusResponse = await fetch(`/api/status?id=${interaction.status_id}`)
                    if (statusResponse.ok) {
                        const statusData = await statusResponse.json()
                        if (statusData.items && statusData.items.length > 0) {
                            interactionStatusValue.value = statusData.items[0].value
                        }
                    }
                }
            } else {
                hasExistingInteraction.value = false
                interactionStatusValue.value = null
            }
        } else {
            hasExistingInteraction.value = false
            interactionStatusValue.value = null
        }
    } catch (error) {
        console.error('Error checking for existing interactions:', error)
        hasExistingInteraction.value = false
        interactionStatusValue.value = null
    }
}

// Computed: showForm - true if usermode allows form display
const showForm = computed(() => {
    if (!usermode.value || usermode.value === 'no') return false
    if (usermode.value === 'guest') return true
    if (usermode.value === 'verified' || usermode.value === 'loggedin') return true
    return false
})

// Computed: interactionFields - return form name based on usermode
const interactionFields = computed(() => {
    if (!usermode.value || usermode.value === 'no') {
        return false
    }
    if (usermode.value === 'guest') return 'registration'
    if (usermode.value === 'verified' || usermode.value === 'loggedin') return 'verification'
    return false
})

// Open/close edit panel
function openEditPanel() {
    isEditPanelOpen.value = true
}

function closeEditPanel() {
    isEditPanelOpen.value = false
}

// Open/close config panel
function openPageConfig() {
    isConfigPanelOpen.value = true
}

function closeConfigPanel() {
    isConfigPanelOpen.value = false
}

// Handle save project
async function handleSaveProject(data: EditPanelData) {
    if (!project.value) return

    try {
        const response = await fetch(`/api/projects/${project.value.domaincode}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        })

        if (!response.ok) {
            const error = await response.json()
            throw new Error(error.message || 'Failed to save project')
        }

        // Refresh project data
        await fetchProject(project.value.domaincode)

        // Close the panel
        closeEditPanel()
    } catch (error: any) {
        console.error('Failed to save project:', error)
        alert(error.message || 'Failed to save changes. Please try again.')
    }
}

// Check authentication
async function checkAuth() {
    try {
        const response = await fetch('/api/auth/session')
        const data = await response.json()
        if (data.authenticated) {
            user.value = data.user
        }
    } catch (error) {
        console.error('Auth check failed:', error)
    }
}

// Fetch project (fixed to 'tp')
async function fetchProject(domaincode: string) {
    try {
        const response = await fetch(`/api/projects/${domaincode}`)
        if (response.ok) {
            const data = await response.json()
            project.value = data
        } else if (response.status === 404) {
            console.error('Project not found')
            router.push('/')
        }
    } catch (error) {
        console.error('Failed to fetch project:', error)
    }
}

// Fetch all user emails (both extmail and sysmail entries)
async function fetchUserEmails() {
    try {
        const response = await fetch('/api/users')
        if (response.ok) {
            const users = await response.json()
            allUsers.value = users

            // Collect all emails (both extmail and sysmail)
            const emails: string[] = []
            users.forEach((u: any) => {
                if (u.extmail) emails.push(u.extmail)
                if (u.sysmail) emails.push(u.sysmail)
            })
            allUserEmails.value = emails.filter((email: string) => email)

            console.log('Loaded user emails:', allUserEmails.value.length)
        }
    } catch (error) {
        console.error('Error fetching user emails:', error)
    }
}

// Handle email input changes with lookahead support
function handleEmailInput() {
    const input = emailInput.value.trim()

    // Reset usermode and validatedEmail if email is not valid yet
    if (!isValidEmail(input)) {
        usermode.value = 'no'
        validatedEmail.value = ''
    }

    // Start lookahead after 10 characters (and only if contains @)
    if (input.length >= 10 && input.includes('@')) {
        emailSuggestions.value = allUserEmails.value.filter((email: string) =>
            email.toLowerCase().startsWith(input.toLowerCase())
        )
        showSuggestions.value = emailSuggestions.value.length > 0
    } else {
        emailSuggestions.value = []
        showSuggestions.value = false
    }

    // Only check if email exists when it's fully valid
    if (isValidEmail(input)) {
        validatedEmail.value = input
        checkEmailExists(input)
    }
}

// Select email from suggestions
function selectEmail(email: string) {
    emailInput.value = email
    validatedEmail.value = email
    showSuggestions.value = false
    checkEmailExists(email)
}

// Check if email exists in users table
async function checkEmailExists(email: string) {
    const emailLower = email.toLowerCase()

    // Find user in either extmail or sysmail
    const foundUser = allUsers.value.find((user: any) => {
        const extmailMatch = user.extmail && user.extmail.toLowerCase() === emailLower
        const sysmailMatch = user.sysmail && user.sysmail.toLowerCase() === emailLower
        return extmailMatch || sysmailMatch
    })

    console.log('Email check:', email, 'exists:', !!foundUser)

    if (foundUser) {
        currentUser.value = foundUser
        usermode.value = 'user'
    } else {
        currentUser.value = null
        usermode.value = 'guest'
    }

    // Check for existing interaction
    await checkExistingInteraction()
}

// Validate password and update user status
async function validatePassword() {
    if (!passwordInput.value || !currentUser.value) {
        return
    }

    isValidatingPassword.value = true

    try {
        console.log('=== Password Validation Debug ===')
        console.log('Current User:', currentUser.value)
        console.log('Validated Email:', validatedEmail.value)
        console.log('Password entered (length):', passwordInput.value.length)
        console.log('User status_id:', currentUser.value?.status_id)

        // For now, we skip actual password authentication
        // Just validate the password is not empty and proceed with status_id checks
        if (!passwordInput.value || passwordInput.value.length < 5) {
            alert('Bitte gib ein gültiges Passwort ein')
            return
        }

        console.log('Password check bypassed (not using auth yet)')

        // Check user status_id
        const statusId = currentUser.value.status_id

        console.log('Checking status_id:', statusId)

        if (statusId === 46 || statusId === 47) {
            // Case a) - status 46 or 47
            console.log('Case a) - status 46 or 47')
            usermode.value = 'verified'
        } else if (statusId === 48 || statusId === 49) {
            // Case b) - status 48 or 49
            console.log('Case b) - status 48 or 49')
            usermode.value = 'verified'
            showToast('Login ab 9. NOV verfügbar')
        } else if (!statusId || statusId === null || statusId === undefined) {
            // Case c) - no status_id, update to 46
            console.log('Case c) - no status_id, updating to 46')
            await updateUserStatus(currentUser.value.id, 46)
            usermode.value = 'verified'
        } else {
            // Case d) - other status
            console.log('Case d) - other status:', statusId)
            alert('Ungültiger User-Status')
            return
        }

        console.log('New usermode:', usermode.value)

        // Check for existing interaction after verification
        await checkExistingInteraction()
    } catch (error) {
        console.error('Password validation error:', error)
        alert('Fehler bei der Anmeldung')
    } finally {
        isValidatingPassword.value = false
    }
}

// Update user status_id
async function updateUserStatus(userId: number, statusId: number) {
    try {
        const response = await fetch(`/api/users/${userId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status_id: statusId })
        })

        if (!response.ok) {
            throw new Error('Failed to update user status')
        }

        // Update local user object
        if (currentUser.value) {
            currentUser.value.status_id = statusId
        }
    } catch (error) {
        console.error('Error updating user status:', error)
        throw error
    }
}

// Show toast message
function showToast(message: string) {
    // Simple toast implementation
    const toast = document.createElement('div')
    toast.textContent = message
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: var(--color-primary, #3b82f6);
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 0.5rem;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        z-index: 1000;
        animation: slideIn 0.3s ease;
    `
    document.body.appendChild(toast)
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease'
        setTimeout(() => toast.remove(), 300)
    }, 3000)
}

// Handle form submission success
async function handleFormSaved(interactionId: number) {
    console.log('Interaction saved with ID:', interactionId)
    // Refresh the interaction status
    await checkExistingInteraction()
}

// Handle form submission error
function handleFormError(error: string) {
    console.error('Form error:', error)
    alert('Fehler beim Speichern: ' + error)
}

// Modal selector functions
function openModal(entity: 'posts' | 'events' | 'instructors') {
    modalEntity.value = entity
    isModalOpen.value = true
}

function handleModalSelect(item: any) {
    selectedItem.value = item
    console.log('Selected item:', item)
}

// DropdownList multi-select handlers
function handleInstructorXml(xmlIds: string | string[]) {
    selectedInstructorXml.value = xmlIds
    console.log('Selected XML IDs:', xmlIds)
}

function handleInstructorSelected(instructors: any | any[]) {
    selectedInstructors.value = Array.isArray(instructors) ? instructors : [instructors]
    console.log('Selected instructors:', selectedInstructors.value)
}

// pList multi-select handlers
function handlePlistInstructorXml(xmlIds: string | string[]) {
    selectedPlistInstructorXml.value = xmlIds
    console.log('pList Selected XML IDs:', xmlIds)
}

function handlePlistInstructorSelected(instructors: any | any[]) {
    selectedPlistInstructors.value = Array.isArray(instructors) ? instructors : [instructors]
    console.log('pList Selected instructors:', selectedPlistInstructors.value)
}

// pGallery multi-select handler
function handleGalleryEventsSelected(events: any | any[]) {
    selectedGalleryEvents.value = Array.isArray(events) ? events : [events]
    console.log('pGallery Selected events:', selectedGalleryEvents.value)
}

// Initialize
onMounted(async () => {
    // Initialize theme dimensions
    const theme = useTheme()
    theme.init()

    // Set SEO meta tags
    setStartPageSeoMeta()

    await checkAuth()
    await fetchProject(FIXED_PROJECT_ID)
    await fetchUserEmails()
})
</script>

<style scoped>
.start-page {
    min-height: 100vh;
    background-color: var(--color-bg);
    color: var(--color-contrast);
}

.config-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2.5rem;
    height: 2.5rem;
    color: var(--color-contrast);
    background: transparent;
    border: none;
    border-radius: 0.5rem;
    cursor: pointer;
    transition: var(--transition);
    transition-property: background-color, color;
}

.config-btn:hover {
    background-color: var(--color-muted-bg);
}

.config-btn:focus {
    outline: 2px solid var(--color-primary-bg);
    outline-offset: 2px;
}

/* Registration Section */
.registration-section {
    padding: 4rem 0;
}

.registration-section.bg-accent {
    background-color: var(--color-accent-bg, #fef3c7);
}

.container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 1.5rem;
}

.registration-header {
    margin-bottom: 2rem;
    text-align: center;
}

.registration-header h2 {
    font-size: 2rem;
    font-weight: 600;
    margin-bottom: 0.5rem;
    color: var(--color-text, #1f2937);
}

.registration-header p {
    color: var(--color-text-muted, #6b7280);
    font-size: 1.125rem;
}

.email-input-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 2rem;
    margin-bottom: 2rem;
    max-width: 900px;
    margin-left: auto;
    margin-right: auto;
}

@media (max-width: 768px) {
    .email-input-row {
        grid-template-columns: 1fr;
    }
}

.form-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.form-label {
    font-weight: 500;
    font-size: 0.95rem;
    color: var(--color-text, #1f2937);
}

.email-input-wrapper {
    position: relative;
}

.form-input {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid var(--color-border, #e5e7eb);
    border-radius: 0.5rem;
    font-size: 1rem;
    font-family: inherit;
    transition: border-color 0.2s;
    background: white;
}

.form-input:focus {
    outline: none;
    border-color: var(--color-primary, #3b82f6);
}

.email-suggestions {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: white;
    border: 1px solid var(--color-border, #e5e7eb);
    border-radius: 0.5rem;
    margin-top: 0.25rem;
    max-height: 200px;
    overflow-y: auto;
    box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
    z-index: 10;
}

.suggestion-item {
    width: 100%;
    padding: 0.75rem;
    border: none;
    background: white;
    text-align: left;
    cursor: pointer;
    font-family: inherit;
    font-size: 0.95rem;
    transition: background-color 0.15s;
    color: var(--color-text, #1f2937);
}

.suggestion-item:hover {
    background: var(--color-primary-lighter, #eff6ff);
}

.status-display {
    display: flex;
    align-items: center;
    height: 100%;
    padding-top: 0.75rem;
}

.status-badge {
    display: inline-block;
    padding: 0.5rem 1rem;
    border-radius: 0.5rem;
    font-size: 0.875rem;
    font-weight: 500;
}

.status-none {
    background: var(--color-gray-light, #f3f4f6);
    color: var(--color-gray-dark, #6b7280);
}

.status-guest {
    background: var(--color-info-bg, #dbeafe);
    color: var(--color-info, #2563eb);
}

.status-user {
    background: var(--color-success-bg, #dcfce7);
    color: var(--color-success, #16a34a);
}

.status-verified {
    background: var(--color-success-bg, #dcfce7);
    color: var(--color-success, #16a34a);
}

.status-loggedin {
    background: var(--color-primary-bg, #dbeafe);
    color: var(--color-primary, #3b82f6);
}

.double-entry-banner {
    background: var(--color-primary, #3b82f6);
    color: white;
    padding: 1.5rem;
    border-radius: 0.5rem;
    margin-bottom: 2rem;
    max-width: 900px;
    margin-left: auto;
    margin-right: auto;
}

.banner-content {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.banner-message {
    margin: 0;
    font-weight: 500;
    font-size: 1rem;
    line-height: 1.5;
}

.banner-confirmed {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    align-items: center;
    padding-top: 1rem;
    border-top: 1px solid rgba(255, 255, 255, 0.3);
}

.confirmed-text {
    margin: 0;
    font-size: 1.125rem;
    font-weight: 600;
}

.btn-login {
    display: inline-block;
    padding: 0.5rem 1.5rem;
    background: white;
    color: var(--color-primary, #3b82f6);
    text-decoration: none;
    border-radius: 0.375rem;
    font-weight: 500;
    transition: background-color 0.2s, transform 0.1s;
}

.btn-login:hover {
    background: rgba(255, 255, 255, 0.9);
    transform: translateY(-1px);
}

.password-row {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 1rem;
    margin-bottom: 2rem;
    max-width: 900px;
    margin-left: auto;
    margin-right: auto;
    align-items: end;
}

@media (max-width: 768px) {
    .password-row {
        grid-template-columns: 1fr;
    }
}

.btn-primary {
    padding: 0.75rem 2rem;
    background: var(--color-primary, #3b82f6);
    color: white;
    border: none;
    border-radius: 0.5rem;
    font-size: 1rem;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.2s;
    font-family: inherit;
    white-space: nowrap;
}

.btn-primary:hover:not(:disabled) {
    background: var(--color-primary-dark, #2563eb);
}

.btn-primary:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.btn-toggle {
    padding: 0.5rem 1rem;
    background: white;
    color: var(--color-text, #1f2937);
    border: 1px solid var(--color-border, #e5e7eb);
    border-radius: 0.375rem;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    font-family: inherit;
}

.btn-toggle:hover {
    background: var(--color-muted-bg, #f3f4f6);
    border-color: var(--color-primary, #3b82f6);
}

.btn-toggle.active {
    background: var(--color-primary, #3b82f6);
    color: white;
    border-color: var(--color-primary, #3b82f6);
}

.form-dropdown-trigger {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid var(--color-border, #e5e7eb);
    border-radius: 0.5rem;
    font-size: 1rem;
    font-family: inherit;
    background: white;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: space-between;
    transition: border-color 0.2s;
}

.form-dropdown-trigger:hover {
    border-color: var(--color-primary, #3b82f6);
}

.form-dropdown-trigger .chevron {
    transition: transform 0.2s;
}

.form-dropdown-trigger .chevron.rotate-180 {
    transform: rotate(180deg);
}

.form-container {
    margin-top: 2rem;
    padding: 2rem;
    background: white;
    border-radius: 0.75rem;
    box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1);
    max-width: 900px;
    margin-left: auto;
    margin-right: auto;
}

@keyframes slideIn {
    from {
        transform: translateX(100%);
        opacity: 0;
    }

    to {
        transform: translateX(0);
        opacity: 1;
    }
}

@keyframes slideOut {
    from {
        transform: translateX(0);
        opacity: 1;
    }

    to {
        transform: translateX(100%);
        opacity: 0;
    }
}
</style>
