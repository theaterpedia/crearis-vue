import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import vue from '@vitejs/plugin-vue'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
    plugins: [vue()],
    
    test: {
        // Test environment - use happy-dom for Vue component tests
        environment: 'happy-dom',

        // Global setup and teardown
        globalSetup: './tests/setup/global-setup.ts',
        setupFiles: ['./tests/setup/test-setup.ts'],

        // Coverage configuration
        coverage: {
            provider: 'v8',
            reporter: ['text', 'html', 'json', 'lcov'],
            include: [
                'server/**/*.ts',
                'src/**/*.ts'
            ],
            exclude: [
                '**/*.d.ts',
                '**/*.config.ts',
                '**/node_modules/**',
                '**/dist/**',
                '**/.output/**',
                '**/tests/**'
            ],
            // Coverage thresholds
            thresholds: {
                lines: 70,
                functions: 70,
                branches: 70,
                statements: 70
            }
        },

        // Test reporters - visual output
        reporters: [
            'verbose',
            'html',
            ['json', { outputFile: 'test-results/results.json' }]
        ],

        // Output directory for HTML reports
        outputFile: {
            html: 'test-results/index.html'
        },

        // Test timeout
        testTimeout: 30000,
        hookTimeout: 30000,

        // Test execution
        globals: true,
        isolate: true,

        // Test filtering by tags
        // Use: pnpm test:pgintegration to run PostgreSQL tests
        // Use: pnpm test:sqlite to run SQLite tests
        // Use: pnpm test:unit for unit tests
    },

    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
            '~': path.resolve(__dirname, './server')
        }
    }
})
