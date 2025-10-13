import './assets/css/00-theme.css'
import './styles'

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

const app = createApp(App)

// Enable Vue DevTools in development
if (import.meta.env.DEV) {
    app.config.devtools = true
    app.config.performance = true
}

app.use(router)
app.mount('#app')
