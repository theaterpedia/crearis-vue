<template>
    <div class="project-settings">
        <!-- Settings Header -->
        <div class="settings-header">
            <div class="header-title">
                <svg fill="currentColor" height="24" viewBox="0 0 256 256" width="24"
                    xmlns="http://www.w3.org/2000/svg">
                    <path
                        d="M128,80a48,48,0,1,0,48,48A48.05,48.05,0,0,0,128,80Zm0,80a32,32,0,1,1,32-32A32,32,0,0,1,128,160Zm88-29.84q.06-2.16,0-4.32l14.92-18.64a8,8,0,0,0,1.48-7.06,107.6,107.6,0,0,0-10.88-26.25,8,8,0,0,0-6-3.93l-23.72-2.64q-1.48-1.56-3-3L186,40.54a8,8,0,0,0-3.94-6,107.29,107.29,0,0,0-26.25-10.86,8,8,0,0,0-7.06,1.48L130.16,40Q128,40,125.84,40L107.2,25.11a8,8,0,0,0-7.06-1.48A107.6,107.6,0,0,0,73.89,34.51a8,8,0,0,0-3.93,6L67.32,64.27q-1.56,1.49-3,3L40.54,70a8,8,0,0,0-6,3.94,107.71,107.71,0,0,0-10.87,26.25,8,8,0,0,0,1.49,7.06L40,125.84Q40,128,40,130.16L25.11,148.8a8,8,0,0,0-1.48,7.06,107.6,107.6,0,0,0,10.88,26.25,8,8,0,0,0,6,3.93l23.72,2.64q1.49,1.56,3,3L70,215.46a8,8,0,0,0,3.94,6,107.71,107.71,0,0,0,26.25,10.87,8,8,0,0,0,7.06-1.49L125.84,216q2.16.06,4.32,0l18.64,14.92a8,8,0,0,0,7.06,1.48,107.21,107.21,0,0,0,26.25-10.88,8,8,0,0,0,3.93-6l2.64-23.72q1.56-1.48,3-3L215.46,186a8,8,0,0,0,6-3.94,107.71,107.71,0,0,0,10.87-26.25,8,8,0,0,0-1.49-7.06Zm-16.1-6.5a73.93,73.93,0,0,1,0,8.68,8,8,0,0,0,1.74,5.48l14.19,17.73a91.57,91.57,0,0,1-6.23,15L187,173.11a8,8,0,0,0-5.1,2.64,74.11,74.11,0,0,1-6.14,6.14,8,8,0,0,0-2.64,5.1l-2.51,22.58a91.32,91.32,0,0,1-15,6.23l-17.74-14.19a8,8,0,0,0-5-1.75h-.48a73.93,73.93,0,0,1-8.68,0,8.06,8.06,0,0,0-5.48,1.74L100.45,215.8a91.57,91.57,0,0,1-15-6.23L82.89,187a8,8,0,0,0-2.64-5.1,74.11,74.11,0,0,1-6.14-6.14,8,8,0,0,0-5.1-2.64L46.43,170.6a91.32,91.32,0,0,1-6.23-15l14.19-17.74a8,8,0,0,0,1.74-5.48,73.93,73.93,0,0,1,0-8.68,8,8,0,0,0-1.74-5.48L40.2,100.45a91.57,91.57,0,0,1,6.23-15L69,82.89a8,8,0,0,0,5.1-2.64,74.11,74.11,0,0,1,6.14-6.14A8,8,0,0,0,82.89,69L85.4,46.43a91.32,91.32,0,0,1,15-6.23l17.74,14.19a8,8,0,0,0,5.48,1.74,73.93,73.93,0,0,1,8.68,0,8.06,8.06,0,0,0,5.48-1.74L155.55,40.2a91.57,91.57,0,0,1,15,6.23L173.11,69a8,8,0,0,0,2.64,5.1,74.11,74.11,0,0,1,6.14,6.14,8,8,0,0,0,5.1,2.64l22.58,2.51a91.32,91.32,0,0,1,6.23,15l-14.19,17.74A8,8,0,0,0,199.87,123.66Z">
                    </path>
                </svg>
                <h1>Projekt-Einstellungen</h1>
            </div>
            <button class="btn-save" @click="saveSettings">
                <svg fill="currentColor" height="18" viewBox="0 0 256 256" width="18"
                    xmlns="http://www.w3.org/2000/svg">
                    <path
                        d="M229.66,77.66l-128,128a8,8,0,0,1-11.32,0l-56-56a8,8,0,0,1,11.32-11.32L96,188.69,218.34,66.34a8,8,0,0,1,11.32,11.32Z">
                    </path>
                </svg>
                Speichern
            </button>
        </div>

        <!-- Tab Navigation -->
        <div class="settings-tabs">
            <button v-for="tab in tabs" :key="tab.id" class="tab-button" :class="{ active: activeTab === tab.id }"
                @click="activeTab = tab.id">
                <component :is="tab.icon" />
                <span>{{ tab.label }}</span>
            </button>
        </div>

        <!-- Tab Content -->
        <div class="settings-content">
            <!-- Core Tab -->
            <div v-if="activeTab === 'core'" class="tab-panel">
                <div class="form-section">
                    <label class="form-label">Website-Domain</label>
                    <input v-model="coreSettings.domain" type="text" class="form-input"
                        placeholder="exampleiel.theaterpedia.org" />
                </div>

                <div class="form-section">
                    <label class="form-label">Projekt-Name</label>
                    <input v-model="coreSettings.name" type="text" class="form-input"
                        placeholder="-theatre mein Projekt" />
                </div>

                <div class="form-section">
                    <label class="form-label">Beschreibung</label>
                    <textarea v-model="coreSettings.description" class="form-textarea"
                        placeholder="Beschiben Sie Ihr Projekt..." rows="4"></textarea>
                </div>

                <div class="form-section">
                    <label class="form-label">Logo</label>
                    <div class="logo-options">
                        <div class="radio-group">
                            <label class="radio-label">
                                <input type="radio" v-model="coreSettings.logoType" value="file" />
                                <span>Datei-Upload</span>
                            </label>
                            <label class="radio-label">
                                <input type="radio" v-model="coreSettings.logoType" value="text" />
                                <span>Text-Logo</span>
                            </label>
                        </div>

                        <div v-if="coreSettings.logoType === 'file'" class="file-upload-section">
                            <div v-if="logoPreview" class="logo-preview">
                                <img :src="logoPreview" alt="Logo Preview" />
                                <button class="btn-remove" @click="removeLogo">
                                    <svg fill="currentColor" height="16" viewBox="0 0 256 256" width="16"
                                        xmlns="http://www.w3.org/2000/svg">
                                        <path
                                            d="M205.66,194.34a8,8,0,0,1-11.32,11.32L128,139.31,61.66,205.66a8,8,0,0,1-11.32-11.32L116.69,128,50.34,61.66A8,8,0,0,1,61.66,50.34L128,116.69l66.34-66.35a8,8,0,0,1,11.32,11.32L139.31,128Z">
                                        </path>
                                    </svg>
                                </button>
                            </div>
                            <input type="file" accept="image/*" @change="handleLogoFileChange" class="file-input" />
                            <p class="file-hint">PNG, JPG, SVG (max. 2MB)</p>
                        </div>

                        <div v-if="coreSettings.logoType === 'text'" class="text-logo-section">
                            <input type="text" v-model="coreSettings.logoText" class="form-input"
                                placeholder="Logo-Text eingeben" />
                        </div>
                    </div>
                </div>
            </div>

            <!-- Team Tab -->
            <div v-if="activeTab === 'team'" class="tab-panel">
                <div class="team-list">
                    <!-- Owner Section -->
                    <div v-if="owner" class="team-section">
                        <h3 class="section-title">Owner</h3>
                        <div class="team-member">
                            <div class="member-image">
                                <img v-if="owner.cimg" :src="owner.cimg" :alt="owner.username" />
                                <div v-else class="image-placeholder">
                                    <svg fill="currentColor" height="40" viewBox="0 0 256 256" width="40"
                                        xmlns="http://www.w3.org/2000//svg">
                                        <path
                                            d="M230.92,212c-15.23-26.33-38.7-45.21-66.09-54.16a72,72,0,1,0-73.66,0C63.78,166.78,40.31,185.66,25.08,212a8,8,0,1,0,13.85,8c18.84-32.56,52.14-52,89.07-52s70.23,19.44,89.07,52a8,8,0,1,0,13.85-8ZM72,96a56,56,0,1,1,56,56A56.06,56.06,0,0,1,72,96Z">
                                        </path>
                                    </svg>
                                </div>
                            </div>
                            <div class="member-info">
                                <div class="member-username">{{ owner.username }}</div>
                                <div class="member-description">
                                    <HeadingParser :content="'**OWNER**'" as="div" class="role-badge" />
                                    <HeadingParser v-if="owner.description" :content="owner.description" as="div"
                                        class="description-text" />
                                </div>
                            </div>
                            <div class="member-actions">
                                <button class="action-btn" @click="viewProfile(owner.id)">
                                    <svg fill="currentColor" height="16" viewBox="0 0 256 256" width="16"
                                        xmlns="http://www.W w3.org/2000/svg">
                                        <path
                                            d="M247.31,124.76c-.35-.79-8.82-19.58-27.65-38.41C194.57,61.26,162.88,48,128,48S61.43,61.26,36.34,86.35C17.51,105.18,9,124,8.69,124.76a8,8,0,0,0,0,6.5c.35.79,8.82,19.57,27.65,38.4C61.43,194.74,93.12,208,128,208s66.57-13.26,91.66-38.34c18.83-18.83,27.3-37.61,27.65-38.4A8,8,0,0,0,247.31,124.76ZM128,192c-30.78,0-57.67-11.19-79.93-33.25A133.47,133.47,0,0,1,25,128,133.33,133.33,0,0,1,48.07,97.25C70.33,75.19,97.22,64,128,64s57.67,11.19,79.93,33.25A133.46,133.46,0,0,1,231.05,128C223.84,141.46,192.43,192,128,192Zm0-112a48,48,0,1,0,48,48A48.05,48.05,0,0,0,128,80Zm0,80a32,32,0,1,1,32-32A32,32,0,0,1,128,160Z">
                                        </path>
                                    </svg>
                                    <span>Profil</span>
                                </button>
                                <button class="action-btn" @click="editUser(owner.id)">
                                    <svg fill="currentColor" height="16" viewBox="0 0 256 256" width="16"
                                        xmlns="http://.org/2000/svg">
                                        <path
                                            d="M227.31,73.37,182.63,28.68a16,16,0,0,0-22.63,0L36.69,152A15.86,15.86,0,0,0,32,163.31V208a16,16,0,0,0,16,16H92.69A15.86,15.86,0,0,0,104,219.31L227.31,96a16,16,0,0,0,0-22.63ZM92.69,208H48V163.31l88-88L180.69,120ZM192,108.68,147.31,64l24-24L216,84.68Z">
                                        </path>
                                    </svg>
                                    <span>Bearbeiten</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- Members Section -->
                    <div v-if="members.length > 0" class="team-section">
                        <h3 class="section-title">Members</h3>
                        <div v-for="member in members" :key="member.id" class="team-member">
                            <div class="member-image">
                                <img v-if="member.cimg" :src="member.cimg" :alt="member.username" />
                                <div v-else class="image-placeholder">
                                    <svg fill="currentColor" height="40" viewBox="0 0 256 256" width="40"
                                        xmlns="http://www.w3.org/2000/svg">
                                        <path
                                            d="M230.92,212c-15.23-26.33-38.7-45.21-66.09-54.16a72,72,0,1,0-73.66,0C63.78,166.78,40.31,185.66,25.08,212a8,8,0,1,0,13.85,8c18.84-32.56,52.14-52,89.07-52s70.23,19.44,89.07,52a8,8,0,1,0,13.85-8ZM72,96a56,56,0,1,1,56,56A56.06,56.06,0,0,1,72,96Z">
                                        </path>
                                    </svg>
                                </div>
                            </div>
                            <div class="member-info">
                                <div class="member-username">{{ member.username }}</div>
                                <div class="member-description">
                                    <HeadingParser :content="'**MEMBER**'" as="div" class="role-badge" />
                                    <HeadingParser v-if="member.description" :content="member.description" as="div"
                                        class="description-text" />
                                </div>
                            </div>
                            <div class="member-actions">
                                <button class="action-btn" @click="viewProfile(member.id)">
                                    <svg fill="currentColor" height="16" viewBox="0 0 256 256" width="16"
                                        xmlns="http://www.w3.org/2000/svg">
                                        <path
                                            d="M247.31,124.76c-.35-.79-8.82-19.58-27.65-38.41C194.57,61.26,162.88,48,128,48S61.43,61.26,36.34,86.35C17.51,105.18,9,124,8.69,124.76a8,8,0,0,0,0,6.5c.35.79,8.82,19.57,27.65,38.4C61.43,194.74,93.12,208,128,208s66.57-13.26,91.66-38.34c18.83-18.83,27.3-37.61,27.65-38.4A8,8,0,0,0,247.31,124.76ZM128,192c-30.78,0-57.67-11.19-79.93-33.25A133.47,133.47,0,0,1,25,128,133.33,133.33,0,0,1,48.07,97.25C70.33,75.19,97.22,64,128,64s57.67,11.19,79.93,33.25A133.46,133.46,0,0,1,231.05,128C223.84,141.46,192.43,192,128,192Zm0-112a48,48,0,1,0,48,48A48.05,48.05,0,0,0,128,80Zm0,80a32,32,0,1,1,32-32A32,32,0,0,1,128,160Z">
                                        </path>
                                    </svg>
                                    <span>Profil</span>
                                </button>
                                <button class="action-btn" @click="editUser(member.id)">
                                    <svg fill="currentColor" height="16" viewBox="0 0 256 256" width="16"
                                        xmlns="http://www.w3.org/2000/svg">
                                        <path
                                            d="M227.31,73.37,182.63,28.68a16,16,0,0,0-22.63,0L36.69,152A15.86,15.86,0,0,0,32,163.31V208a16,16,0,0,0,16,16H92.69A15.86,15.86,0,0,0,104,219.31L227.31,96a16,16,0,0,0,0-22.63ZM92.69,208H48V163.31l88-88L180.69,120ZM192,108.68,147.31,64l24-24L216,84.68Z">
                                        </path>
                                    </svg>
                                    <span>Bearbeiten</span>
                                </button>
                                <button class="action-btn action-btn-danger" @click="removeMember(member.id)">
                                    <svg fill="currentColor" height="16" viewBox="0 0 256 256" width="16"
                                        xmlns="http://www.w3.org/2000/svg">
                                        <path
                                            d="M216,48H176V40a24,24,0,0,0-24-24H104A24,24,0,0,0,80,40v8H40a8,8,0,0,0,0,16h8V208a16,16,0,0,0,16,16H192a16,16,0,0,0,16-16V64h8a8,8,0,0,0,0-16ZM96,40a8,8,0,0,1,8-8h48a8,8,0,0,1,8,8v8H96Zm96,168H64V64H192ZM112,104v64a8,8,0,0,1-16,0V104a8,8,0,0,1,16,0Zm48,0v64a8,8,0,0,1-16,0V104a8,8,0,0,1,16,0Z">
                                        </path>
                                    </svg>
                                    <span>Entfernen</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- Other Instructors Section -->
                    <div v-if="otherInstructors.length > 0" class="team-section">
                        <h3 class="section-title">Other Instructors</h3>
                        <div v-for="instructor in otherInstructors" :key="instructor.id" class="team-member">
                            <div class="member-image">
                                <img v-if="instructor.cimg" :src="instructor.cimg" :alt="instructor.username" />
                                <div v-else class="image-placeholder">
                                    <svg fill="currentColor" height="40" viewBox="0 0 256 256" width="40"
                                        xmlns="http://www.w3.org/2000/svg">
                                        <path
                                            d="M230.92,212c-15.23-26.33-38.7-45.21-66.09-54.16a72,72,0,1,0-73.66,0C63.78,166.78,40.31,185.66,25.08,212a8,8,0,1,0,13.85,8c18.84-32.56,52.14-52,89.07-52s70.23,19.44,89.07,52a8,8,0,1,0,13.85-8ZM72,96a56,56,0,1,1,56,56A56.06,56.06,0,0,1,72,96Z">
                                        </path>
                                    </svg>
                                </div>
                            </div>
                            <div class="member-info">
                                <div class="member-username">{{ instructor.username }}</div>
                                <div class="member-description">
                                    <HeadingParser :content="'**INSTRUCTOR**'" as="div" class="role-badge" />
                                    <HeadingParser v-if="instructor.description" :content="instructor.description"
                                        as="div" class="description-text" />
                                </div>
                            </div>
                            <div class="member-actions">
                                <button class="action-btn" @click="viewProfile(instructor.id)">
                                    <svg fill="currentColor" height="16" viewBox="0 0 256 256" width="16"
                                        xmlns="http://www.w3.org/2000/svg">
                                        <path
                                            d="M247.31,124.76c-.35-.79-8.82-19.58-27.65-38.41C194.57,61.26,162.88,48,128,48S61.43,61.26,36.34,86.35C17.51,105.18,9,124,8.69,124.76a8,8,0,0,0,0,6.5c.35.79,8.82,19.57,27.65,38.4C61.43,194.74,93.12,208,128,208s66.57-13.26,91.66-38.34c18.83-18.83,27.3-37.61,27.65-38.4A8,8,0,0,0,247.31,124.76ZM128,192c-30.78,0-57.67-11.19-79.93-33.25A133.47,133.47,0,0,1,25,128,133.33,133.33,0,0,1,48.07,97.25C70.33,75.19,97.22,64,128,64s57.67,11.19,79.93,33.25A133.46,133.46,0,0,1,231.05,128C223.84,141.46,192.43,192,128,192Zm0-112a48,48,0,1,0,48,48A48.05,48.05,0,0,0,128,80Zm0,80a32,32,0,1,1,32-32A32,32,0,0,1,128,160Z">
                                        </path>
                                    </svg>
                                    <span>Profil</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- Add Member Button -->
                    <div class="add-member-section">
                        <button class="btn-add-member" @click="addMember">
                            <svg fill="currentColor" height="20" viewBox="0 0 256 256" width="20"
                                xmlns="http://www.w3./svg">
                                <path
                                    d="M256,136a8,8,0,0,1-8,8H232v16a8,8,0,0,1-16,0V144H200a8,8,0,0,1,0-16h16V112a8,8,0,0,1,16,0v16h16A8,8,0,0,1,256,136Zm-57.87,58.85a8,8,0,0,1-12.26,10.3C165.75,181.19,138.09,168,108,168s-57.75,13.19-77.87,37.15a8,8,0,0,1-12.25-10.3c14.94-17.78,33.52-30.41,54.17-37.17a68,68,0,1,1,71.9,0C164.6,164.44,183.18,177.07,198.13,194.85ZM108,152a52,52,0,1,0-52-52A52.06,52.06,0,0,0,108,152Z">
                                </path>
                            </svg>
                            Mitarbeiter hinzufügen
                        </button>
                    </div>
                </div>
            </div>

            <!-- Network Tab -->
            <div v-if="activeTab === 'network'" class="tab-panel">
                <div class="form-section">
                    <label class="form-label">Regio-Zugehörigkeit</label>
                    <select v-model="networkSettings.regioId" class="form-select">
                        <option :value="null">Kein Regio</option>
                        <option v-for="regio in regioProjects" :key="regio.id" :value="regio.id">
                            {{ regio.name }}
                        </option>
                    </select>
                    <p class="form-hint">Wählen Sie ein übergeordnetes Regio-Projekt aus</p>
                </div>

                <div class="form-section">
                    <label class="form-label">Partner-Projekte</label>
                    <div class="partner-list">
                        <div v-for="partner in hardcodedPartners" :key="partner" class="partner-item">
                            <svg fill="currentColor" height="16" viewBox="0 0 256 256" width="16"
                                xmlns="http://.w3.org/2000/svg">
                                <path
                                    d="M216,40H40A16,16,0,0,0,24,56V200a16,16,0,0,0,16,16H216a16,16,0,0,0,16-16V56A16,16,0,0,0,216,40Zm0,160H40V56H216V200ZM184,96a8,8,0,0,1-8,8H80a8,8,0,0,1,0-16h96A8,8,0,0,1,184,96Zm0,32a8,8,0,0,1-8,8H80a8,8,0,0,1,0-16h96A8,8,0,0,1,184,128Zm0,32a8,8,0,0,1-8,8H80a8,8,0,0,1,0-16h96A8,8,0,0,1,184,160Z">
                                </path>
                            </svg>
                            <span>{{ partner }}</span>
                        </div>
                    </div>
                    <p class="form-hint">Partner-Projekte (nicht funktional - Demonstration)</p>
                </div>

                <div class="form-section">
                    <label class="form-label">Erweiterte Optionen (JSON)</label>
                    <textarea v-model="networkSettings.options" class="form-textarea json-editor"
                        placeholder='{"key":": "value"}' rows="10" @blur="validateJson"></textarea>
                    <p v-if="jsonError" class="error-hint">{{ jsonError }}</p>
                    <p v-else class="form-hint">Geben Sie erweiterte Optionen im JSON-Format ein</p>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, h } from 'vue'
import HeadingParser from '@/components/HeadingParser.vue'

// Define tab icon components
const CoreIcon = () => h('svg', {
    fill: 'currentColor',
    height: '20',
    viewBox: '0 0 256 256',
    width: '20',
    xmlns: 'http://www.w3.org/2000/svg'
}, h('path', {
    d: 'M224,48H32A16,16,0,0,0,16,64V192a16,16,0,0,0,16,16H224a16,16,0,0,0,16-16V64A16,16,0,0,0,224,48Zm0,144H32V64H224V192ZM176,88a8,8,0,0,1-8,8H88a8,8,0,0,1,0-16h80A8,8,0,0,1,176,88Zm0,32a8,8,0,0,1-8,8H88a8,8,0,0,1,0-16h80A8,8,0,0,1,176,120Zm0,32a8,8,0,0,1-8,8H88a8,8,0,0,1,0-16h80A8,8,0,0,1,176,152Z'
}))

const TeamIcon = () => h('svg', {
    fill: 'currentColor',
    height: '20',
    viewBox: '0 0 256 256',
    width: '20',
    xmlns: 'http://www.w3.org/2000/svg'
}, h('path', {
    d: 'M244.8,150.4a8,8,0,0,1-11.2-1.6A51.6,51.6,0,0,0,192,128a8,8,0,0,1,0-16,24,24,0,1,0-23.24-30,8,8,0,1,1-15.5-4A40,40,0,1,1,219,117.51a67.94,67.94,0,0,1,27.43,21.68A8,8,0,0,1,244.8,150.4ZM190.92,212a8,8,0,1,1-13.84,8,57,57,0,0,0-98.16,0,8,8,0,1,1-13.84-8,72.06,72.06,0,0,1,33.74-29.92,48,48,0,1,1,58.36,0A72.06,72.06,0,0,1,190.92,212ZM128,176a32,32,0,1,0-32-32A32,32,0,0,0,128,176ZM72,120a8,8,0,0,0-8-8A24,24,0,1,1,87.24,82a8,8,0,1,0,15.5-4A40,40,0,1,0,37,117.51,67.94,67.94,0,0,0,9.6,139.19a8,8,0,1,0,12.8,9.61A51.6,51.6,0,0,1,64,128,8,8,0,0,0,72,120Z'
}))

const NetworkIcon = () => h('svg', {
    fill: 'currentColor',
    height: '20',
    viewBox: '0 0 256 256',
    width: '20',
    xmlns: 'http://www.w3.org/2000/svg'
}, h('path', {
    d: 'M240,104a40,40,0,1,0-64,32v24H144V136a40,40,0,1,0-16,0v24H80V136a40,40,0,1,0-16,0v24a16,16,0,0,0,16,16h48v24a40,40,0,1,0,16,0V176h48a16,16,0,0,0,16-16V136A40,40,0,0,0,240,104ZM216,80a24,24,0,1,1-24,24A24,24,0,0,1,216,80ZM96,80a24,24,0,1,1,24,24A24,24,0,0,1,96,80ZM152,216a24,24,0,1,1-24-24A24,24,0,0,1,152,216Z'
}))

interface Props {
    projectId: string
}

const props = defineProps<Props>()

// Tab state
const activeTab = ref<'core' | 'team' | 'network'>('core')

const tabs = [
    { id: 'core' as const, label: 'Core', icon: CoreIcon },
    { id: 'team' as const, label: 'Team', icon: TeamIcon },
    { id: 'network' as const, label: 'Network', icon: NetworkIcon }
]

// Core settings
const coreSettings = ref({
    domain: 'beispiel.theaterpedia.org',
    name: 'MeinDProject projekt',
    description: 'Ein spannendes Theaterprojekt mit vielen Veranstaltungen und Mitwirkenden.',
    logoType: 'text' as 'file' | 'text',
    logoFile: null as File | null,
    logoText: '🎭 Theater'
})

const logoPreview = ref<string | null>(null)

// Team data (dummy data for demonstration)
interface TeamMember {
    id: string
    username: string
    cimg?: string
    description?: string
    isInstructor?: boolean
}

const owner = ref<TeamMember | null>({
    id: 'owner@theaterpedia.org',
    username: 'project_owner',
    cimg: '',
    description: 'Projektleiter und Hauptverantwortlicher'
})

const members = ref<TeamMember[]>([
    {
        id: 'alice@theaterpedia.org',
        username: 'alice',
        cimg: '',
        description: 'Technische Leitung und Koordination'
    },
    {
        id: 'bob@theaterpedia.org',
        username: 'bob',
        cimg: '',
        description: 'Marketing und Kommunikation'
    }
])

const otherInstructors = ref<TeamMember[]>([
    {
        id: 'instructor1@theaterpedia.org',
        username: 'max_mueller',
        cimg: '',
        description: 'Schauspielunterricht und Regie'
    },
    {
        id: 'instructor2@theaterpedia.org',
        username: 'lisa_schmidt',
        cimg: '',
        description: 'Tanz und Bewegung'
    }
])

// Network settings
const networkSettings = ref({
    regioId: null as number | null,
    options: JSON.stringify({
        "enableSync": true,
        "visibility": "public",
        "analytics": true
    }, null, 2)
})

const regioProjects = ref([
    { id: 1, name: 'Regio Nord' },
    { id: 2, name: 'Regio Süd' },
    { id: 3, name: 'Regio Ost' }
])

const hardcodedPartners = ref([
    'Stadttheater München',
    'Kulturzentrum Berlin',
    'Theater am Rhein'
])

const jsonError = ref<string | null>(null)

// Logo handling
function handleLogoFileChange(event: Event) {
    const target = event.target as HTMLInputElement
    if (target.files && target.files.length > 0) {
        const file = target.files[0]
        if (!file) return

        // Check file size (2MB limit)
        if (file.size > 2 * 1024 * 1024) {
            alert('Datei zu groß! Maximal 2MB erlaubt.')
            return
        }

        coreSettings.value.logoFile = file

        // Create preview
        const reader = new FileReader()
        reader.onload = (e) => {
            logoPreview.value = e.target?.result as string
        }
        reader.readAsDataURL(file)
    }
}

function removeLogo() {
    coreSettings.value.logoFile = null
    logoPreview.value = null
}

// JSON validation
function validateJson() {
    jsonError.value = null
    try {
        JSON.parse(networkSettings.value.options)
    } catch (e) {
        jsonError.value = 'Ungültiges JSON-Format'
    }
}

// Team actions
function viewProfile(userId: string) {
    console.log('View profile:', userId)
    // TODO: Navigate to profile or open modal
}

function editUser(userId: string) {
    console.log('Edit user:', userId)
    // TODO: Open edit modal with AdminAction
}

function removeMember(userId: string) {
    if (confirm('Möchten Sie diesen Mitarbeiter wirklich entfernen?')) {
        members.value = members.value.filter((m: TeamMember) => m.id !== userId)
        console.log('Removed member:', userId)
    }
}

function addMember() {
    console.log('Add member')
    // TODO: Open modal to add new member using AdminAction
}

// Save settings
function saveSettings() {
    // Validate JSON before saving
    if (activeTab.value === 'network') {
        try {
            JSON.parse(networkSettings.value.options)
        } catch (e) {
            alert('Bitte korrigieren Sie das JSON-Format im Network-Tab')
            return
        }
    }

    console.log('Saving settings:', {
        core: coreSettings.value,
        network: networkSettings.value
    })

    // TODO: API call to save settings
    alert('Einstellungen gespeichert!')
}

// Load project settings on mount
onMounted(async () => {
    console.log('Loading project settings for:', props.projectId)
    // TODO: Load actual project data from API
})
</script>

<style scoped>
/* ===== PROJECT SETTINGS CONTAINER ===== */
.project-settings {
    display: flex;
    flex-direction: column;
    height: 100%;
    background: var(--color-bg-soft);
    overflow: hidden;
}

/* ===== HEADER ===== */
.settings-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.5rem 2rem;
    background: var(--color-card-bg);
    border-bottom: var(--border) solid var(--color-border);
}

.header-title {
    display: flex;
    align-items: center;
    gap: 1rem;
}

.header-title svg {
    color: var(--color-project);
}

.header-title h1 {
    font-size: 1.5rem;
    font-weight: 600;
    color: var(--color-text);
    margin: 0;
}

.btn-save {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.625rem 1.25rem;
    background: var(--color-project);
    border: none;
    border-radius: var(--radius-button);
    color: white;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
}

.btn-save:hover {
    opacity: 0.9;
    transform: translateY(-1px);
}

/* ===== TABS ===== */
.settings-tabs {
    display: flex;
    gap: 0.5rem;
    padding: 1rem 2rem;
    background: var(--color-card-bg);
    border-bottom: var(--border) solid var(--color-border);
    overflow-x: auto;
}

.tab-button {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1.5rem;
    background: transparent;
    border: none;
    border-bottom: 2px solid transparent;
    color: var(--color-dimmed);
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    white-space: nowrap;
}

.tab-button:hover {
    color: var(--color-text);
    background: var(--color-bg-soft);
}

.tab-button.active {
    color: var(--color-project);
    border-bottom-color: var(--color-project);
}

.tab-button svg {
    flex-shrink: 0;
}

/* ===== TAB CONTENT ===== */
.settings-content {
    flex: 1;
    overflow-y: auto;
    padding: 2rem;
}

.tab-panel {
    max-width: 900px;
    margin: 0 auto;
}

/* ===== FORM SECTIONS ===== */
.form-section {
    margin-bottom: 2rem;
}

.form-label {
    display: block;
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--color-text);
    margin-bottom: 0.5rem;
}

.form-input,
.form-textarea,
.form-select {
    width: 100%;
    padding: 0.75rem;
    background: var(--color-card-bg);
    border: var(--border) solid var(--color-border);
    border-radius: var(--radius-button);
    color: var(--color-text);
    font-size: 0.875rem;
    font-family: inherit;
    transition: all 0.2s ease;
}

.form-input:focus,
.form-textarea:focus,
.form-select:focus {
    outline: none;
    border-color: var(--color-project);
    box-shadow: 0 0 0 3px rgba(var(--color-project-rgb, 147, 51, 234), 0.1);
}

.form-textarea {
    resize: vertical;
}

.json-editor {
    font-family: 'Courier New', monospace;
    font-size: 0.8rem;
}

.form-hint {
    margin-top: 0.5rem;
    font-size: 0.75rem;
    color: var(--color-dimmed);
}

.error-hint {
    margin-top: 0.5rem;
    font-size: 0.75rem;
    color: var(--color-danger);
}

/* ===== LOGO OPTIONS ===== */
.logo-options {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.radio-group {
    display: flex;
    gap: 1.5rem;
}

.radio-label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.875rem;
    color: var(--color-text);
    cursor: pointer;
}

.radio-label input[type="radio"] {
    width: 1rem;
    height: 1rem;
    cursor: pointer;
    accent-color: var(--color-project);
}

.file-upload-section,
.text-logo-section {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.file-input {
    font-size: 0.875rem;
    color: var(--color-text);
}

.logo-preview {
    position: relative;
    width: 120px;
    height: 120px;
    border: var(--border) solid var(--color-border);
    border-radius: var(--radius-button);
    overflow: hidden;
    background: var(--color-bg-soft);
}

.logo-preview img {
    width: 100%;
    height: 100%;
    object-fit: contain;
}

.btn-remove {
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
    padding: 0.25rem;
    background: var(--color-danger);
    border: none;
    border-radius: var(--radius-button);
    color: white;
    cursor: pointer;
    transition: opacity 0.2s ease;
}

.btn-remove:hover {
    opacity: 0.8;
}

/* ===== TEAM LIST ===== */
.team-list {
    display: flex;
    flex-direction: column;
    gap: 2rem;
}

.team-section {
    background: var(--color-card-bg);
    border: var(--border) solid var(--color-border);
    border-radius: var(--radius-card);
    padding: 1.5rem;
}

.section-title {
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--color-project);
    margin: 0 0 1rem 0;
}

.team-member {
    display: grid;
    grid-template-columns: 80px 1fr auto;
    gap: 1rem;
    padding: 1rem;
    background: var(--color-bg-soft);
    border: var(--border) solid var(--color-border);
    border-radius: var(--radius-button);
    margin-bottom: 1rem;
    transition: all 0.2s ease;
}

.team-member:hover {
    border-color: var(--color-project);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.team-member:last-child {
    margin-bottom: 0;
}

.member-image {
    width: 80px;
    height: 80px;
    border-radius: var(--radius-button);
    overflow: hidden;
    background: var(--color-bg);
    border: var(--border) solid var(--color-border);
}

.member-image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.image-placeholder {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--color-dimmed);
}

.member-info {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    min-width: 0;
}

.member-username {
    font-size: 1rem;
    font-weight: 600;
    color: var(--color-text);
}

.member-description {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
}

.member-description :deep(.role-badge strong) {
    font-size: 0.75rem;
    font-weight: 700;
    color: var(--color-project);
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.member-description :deep(.description-text) {
    font-size: 0.875rem;
    color: var(--color-dimmed);
    line-height: 1.4;
}

.member-actions {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    align-items: flex-end;
}

.action-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    background: var(--color-bg);
    border: var(--border) solid var(--color-border);
    border-radius: var(--radius-button);
    color: var(--color-text);
    font-size: 0.75rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    white-space: nowrap;
}

.action-btn:hover {
    background: var(--color-project);
    border-color: var(--color-project);
    color: white;
}

.action-btn-danger:hover {
    background: var(--color-danger);
    border-color: var(--color-danger);
}

.add-member-section {
    display: flex;
    justify-content: center;
    padding: 2rem;
}

.btn-add-member {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1.5rem;
    background: var(--color-project);
    border: none;
    border-radius: var(--radius-button);
    color: white;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
}

.btn-add-member:hover {
    opacity: 0.9;
    transform: translateY(-1px);
}

/* ===== NETWORK SECTION ===== */
.partner-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    padding: 1rem;
    background: var(--color-card-bg);
    border: var(--border) solid var(--color-border);
    border-radius: var(--radius-button);
}

.partner-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem;
    background: var(--color-bg-soft);
    border-radius: var(--radius-button);
    font-size: 0.875rem;
    color: var(--color-text);
}

.partner-item svg {
    color: var(--color-project);
    flex-shrink: 0;
}

/* ===== RESPONSIVE ===== */
@media (max-width: 768px) {
    .settings-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 1rem;
    }

    .settings-tabs {
        padding: 0.75rem 1rem;
    }

    .settings-content {
        padding: 1rem;
    }

    .team-member {
        grid-template-columns: 1fr;
        gap: 1rem;
    }

    .member-image {
        width: 80px;
        height: 80px;
        margin: 0 auto;
    }

    .member-actions {
        flex-direction: row;
        flex-wrap: wrap;
        justify-content: center;
    }

    .action-btn {
        flex: 1;
        justify-content: center;
        min-width: 120px;
    }
}
</style>
