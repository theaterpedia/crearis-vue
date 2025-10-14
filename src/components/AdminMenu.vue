<template>
    <div class="admin-menu">
        <div class="admin-menu-header">
            <h3>👑 Admin-Menü</h3>
            <button class="close-btn" @click="$emit('close')">&times;</button>
        </div>

        <div class="admin-menu-body">
            <!-- Base Mode Toggle (Always available on dashboard) -->
            <div v-if="isOnDashboard" class="admin-section base-mode-section">
                <h4 class="section-title">Ansichtsmodus</h4>
                <label class="toggle-label">
                    <input type="checkbox" :checked="baseMode" @change="$emit('toggle-base-mode')" />
                    <span class="toggle-switch toggle-switch-base"></span>
                    <span class="toggle-text">Basis-Modus</span>
                </label>
                <p class="settings-description">
                    {{ baseMode ?
                        '👤 Als Basis-Benutzer anzeigen (Admin-Funktionen ausgeblendet)' :
                        '👑 Als Admin anzeigen (Volle Kontrolle)'
                    }}
                </p>
            </div>

            <!-- Admin Mode Display (Only visible when NOT in base mode) -->
            <div v-if="!baseMode" class="admin-section">
                <h4 class="section-title">Aktueller Modus</h4>
                <div class="mode-badge" :class="`mode-${adminMode}`">
                    {{ adminMode === 'base-release' ? '📦 Basis-Release' : '🎯 Version-Release' }}
                </div>
            </div>

            <!-- Mode Toggle (Only on / route and NOT in base mode) -->
            <div v-if="isOnDashboard && !baseMode" class="admin-section">
                <h4 class="section-title">Modus wechseln</h4>
                <div class="button-group">
                    <button class="mode-button" :class="{ active: adminMode === 'base-release' }"
                        @click="$emit('set-mode', 'base-release')">
                        📦 Basis-Release
                    </button>
                    <button class="mode-button" :class="{ active: adminMode === 'version-release' }"
                        @click="$emit('set-mode', 'version-release')">
                        🎯 Version-Release
                    </button>
                </div>
                <p class="mode-description">
                    <strong v-if="adminMode === 'base-release'">Basis-Release:</strong>
                    <strong v-else>Version-Release:</strong>
                    <span v-if="adminMode === 'base-release'">
                        Zeigt nur Haupt-Tasks ohne Projekt-Zuordnung
                    </span>
                    <span v-else>
                        Zeigt Tasks eines spezifischen Releases mit Projekt-Zuordnung
                    </span>
                </p>
            </div>

            <!-- Settings Toggle (Only on / route and NOT in base mode) -->
            <div v-if="isOnDashboard && !baseMode" class="admin-section">
                <h4 class="section-title">Einstellungen</h4>
                <label class="toggle-label">
                    <input type="checkbox" :checked="settingsMode" @change="$emit('toggle-settings')" />
                    <span class="toggle-switch"></span>
                    <span class="toggle-text">Einstellungsmodus</span>
                </label>
                <p class="settings-description">
                    {{ settingsMode ?
                        '✅ CRUD-Verwaltung aktiv (Releases & Projekte)' :
                        '❌ CRUD-Verwaltung inaktiv (Admin-Tasks sichtbar)'
                    }}
                </p>
            </div>

            <!-- Action Stubs -->
            <div class="admin-section">
                <h4 class="section-title">Aktionen</h4>
                <div class="action-buttons">
                    <button class="action-button" @click="$emit('action', 'export')">
                        📤 Daten exportieren
                    </button>
                    <button class="action-button" @click="$emit('action', 'backup')">
                        💾 Backup erstellen
                    </button>
                    <button class="action-button" @click="$emit('action', 'sync')">
                        🔄 Synchronisieren
                    </button>
                    <button class="action-button" @click="$emit('action', 'report')">
                        📊 Bericht generieren
                    </button>
                </div>
            </div>

            <!-- Current Route Info -->
            <div class="admin-section">
                <h4 class="section-title">Route-Info</h4>
                <div class="route-info">
                    <span class="info-label">Aktueller Pfad:</span>
                    <code class="info-value">{{ currentRoute }}</code>
                </div>
                <div class="route-info">
                    <span class="info-label">Navigation:</span>
                    <span class="info-value">
                        {{ settingsMode ? '🔒 Gesperrt (Einstellungsmodus)' : '✅ Frei' }}
                    </span>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
defineProps<{
    adminMode: 'base-release' | 'version-release'
    settingsMode: boolean
    baseMode: boolean
    currentRoute: string
    isOnDashboard: boolean
}>()

defineEmits<{
    close: []
    'set-mode': [mode: 'base-release' | 'version-release']
    'toggle-settings': []
    'toggle-base-mode': []
    action: [action: string]
}>()
</script>

<style scoped>
.admin-menu {
    background: var(--color-surface);
    border-radius: 8px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    width: 400px;
    max-height: 80vh;
    overflow-y: auto;
}

.admin-menu-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.5rem;
    border-bottom: 1px solid var(--color-border);
    background: var(--color-accent);
    color: white;
    border-radius: 8px 8px 0 0;
}

.admin-menu-header h3 {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 600;
}

.close-btn {
    background: none;
    border: none;
    font-size: 2rem;
    color: white;
    cursor: pointer;
    line-height: 1;
    padding: 0;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
    transition: background 0.2s;
}

.close-btn:hover {
    background: rgba(255, 255, 255, 0.2);
}

.admin-menu-body {
    padding: 1.5rem;
}

.admin-section {
    margin-bottom: 2rem;
}

.admin-section:last-child {
    margin-bottom: 0;
}

.section-title {
    font-size: 0.875rem;
    font-weight: 600;
    text-transform: uppercase;
    color: var(--color-text-secondary);
    margin: 0 0 0.75rem 0;
    letter-spacing: 0.5px;
}

.base-mode-section {
    background: linear-gradient(135deg, #f3e5f5 0%, #e1bee7 100%);
    padding: 1rem;
    border-radius: 8px;
    border: 2px solid #9c27b0;
}

.base-mode-section .section-title {
    color: #6a1b9a;
}

.mode-badge {
    display: inline-block;
    padding: 0.75rem 1.25rem;
    border-radius: 6px;
    font-weight: 600;
    font-size: 1rem;
}

.mode-base-release {
    background: #e3f2fd;
    color: #1976d2;
}

.mode-version-release {
    background: #f3e5f5;
    color: #7b1fa2;
}

.button-group {
    display: flex;
    gap: 0.75rem;
    margin-bottom: 0.75rem;
}

.mode-button {
    flex: 1;
    padding: 0.75rem 1rem;
    border: 2px solid var(--color-border);
    border-radius: 6px;
    background: var(--color-background);
    color: var(--color-text);
    font-weight: 500;
    font-size: 0.875rem;
    cursor: pointer;
    transition: all 0.2s;
}

.mode-button:hover {
    border-color: var(--color-accent);
    background: var(--color-surface);
}

.mode-button.active {
    border-color: var(--color-accent);
    background: var(--color-accent);
    color: white;
}

.mode-description {
    font-size: 0.875rem;
    color: var(--color-text-secondary);
    margin: 0;
    padding: 0.75rem;
    background: var(--color-background);
    border-radius: 4px;
}

.mode-description strong {
    display: block;
    color: var(--color-text);
    margin-bottom: 0.25rem;
}

.toggle-label {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    cursor: pointer;
    margin-bottom: 0.75rem;
}

.toggle-label input[type="checkbox"] {
    display: none;
}

.toggle-switch {
    position: relative;
    width: 48px;
    height: 24px;
    background: var(--color-border);
    border-radius: 12px;
    transition: background 0.3s;
}

.toggle-switch::after {
    content: '';
    position: absolute;
    top: 2px;
    left: 2px;
    width: 20px;
    height: 20px;
    background: white;
    border-radius: 50%;
    transition: transform 0.3s;
}

input[type="checkbox"]:checked+.toggle-switch {
    background: var(--color-accent);
}

input[type="checkbox"]:checked+.toggle-switch::after {
    transform: translateX(24px);
}

.toggle-switch-base {
    background: #ce93d8;
}

input[type="checkbox"]:checked+.toggle-switch-base {
    background: #9c27b0;
}

.toggle-text {
    font-weight: 500;
    color: var(--color-text);
}

.settings-description {
    font-size: 0.875rem;
    color: var(--color-text-secondary);
    margin: 0;
    padding: 0.75rem;
    background: var(--color-background);
    border-radius: 4px;
}

.action-buttons {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.75rem;
}

.action-button {
    padding: 0.75rem 1rem;
    border: 1px solid var(--color-border);
    border-radius: 6px;
    background: var(--color-background);
    color: var(--color-text);
    font-weight: 500;
    font-size: 0.875rem;
    cursor: pointer;
    transition: all 0.2s;
    text-align: left;
}

.action-button:hover {
    background: var(--color-surface);
    border-color: var(--color-accent);
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.route-info {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem;
    background: var(--color-background);
    border-radius: 4px;
    margin-bottom: 0.5rem;
}

.route-info:last-child {
    margin-bottom: 0;
}

.info-label {
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--color-text);
}

.info-value {
    font-size: 0.875rem;
    color: var(--color-text-secondary);
}

code.info-value {
    background: var(--color-surface);
    padding: 0.25rem 0.5rem;
    border-radius: 3px;
    font-family: 'Courier New', monospace;
}
</style>
