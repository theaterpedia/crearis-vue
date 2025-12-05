import './assets/css/00-theme.css'
import './styles'

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import i18nPlugin from './plugins/i18n'
import sysregPlugin from './plugins/sysreg'
import FloatingVue from 'floating-vue'
import 'floating-vue/dist/style.css'

const app = createApp(App)

// Enable Vue DevTools in development
if (import.meta.env.DEV) {
    app.config.devtools = true
    app.config.performance = true
}

// Configure Floating Vue
app.use(FloatingVue, {
    themes: {
        'edit-panel': {
            $extend: 'dropdown',
            placement: 'right',
            distance: 0,
            triggers: [],
            autoHide: false,
        },
        'status-editor': {
            $extend: 'dropdown',
            placement: 'bottom-start',
            distance: 4,
            triggers: ['click'],
            autoHide: true,
        }
    }
})

// Initialize i18n system first (translations needed by sysreg)
app.use(i18nPlugin)

// Initialize sysreg cache (status values, depends on i18n being ready)
app.use(sysregPlugin)

app.use(router)
app.mount('#app')
