import './assets/css/00-theme.css'
import './styles'

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import i18nPlugin from './plugins/i18n'

const app = createApp(App)

// Enable Vue DevTools in development
if (import.meta.env.DEV) {
    app.config.devtools = true
    app.config.performance = true
}

// Initialize i18n system
app.use(i18nPlugin)

app.use(router)
app.mount('#app')
