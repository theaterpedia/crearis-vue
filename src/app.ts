import './assets/css/00-theme.css'
import './styles'

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import i18nPlugin from './plugins/i18n'
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
        }
    }
})

// Initialize i18n system
app.use(i18nPlugin)

app.use(router)
app.mount('#app')
