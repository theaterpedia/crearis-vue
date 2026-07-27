/// <reference types="vite/client" />

// `export {}` makes this file a MODULE, which is what turns the `declare module
// 'vue'` below into a module *augmentation*. Without it the file is a global
// script, and then that block is an ambient module *declaration* — it replaces
// vue's real types wholesale, so every `import { ref } from 'vue'` in the repo
// fails with TS2305 "has no exported member". Removing this line reintroduces
// ~1200 vue-tsc errors across every file that imports from vue.
export {}

declare module 'vue' {
    interface AppConfig {
        devtools: boolean
    }
}
