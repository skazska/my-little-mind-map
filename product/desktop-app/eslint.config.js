import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
    globalIgnores(['dist']),
    {
        files: ['**/*.{ts,tsx}'],
        extends: [
            js.configs.recommended,
            tseslint.configs.recommended,
            reactHooks.configs.flat.recommended,
            reactRefresh.configs.vite,
        ],
        languageOptions: {
            globals: globals.browser,
        },
        rules: {
            // Allow _-prefixed names to be intentionally unused (standard convention).
            '@typescript-eslint/no-unused-vars': ['error', {
                varsIgnorePattern: '^_',
                argsIgnorePattern: '^_',
            }],
        },
    },
    // E2E test and config files run in Node.js; relax browser-only restrictions.
    {
        files: ['tests/**/*.{ts,tsx}'],
        languageOptions: {
            globals: { ...globals.browser, ...globals.node },
        },
        rules: {
            // Test runner config may use require() for dynamic paths.
            '@typescript-eslint/no-require-imports': 'off',
        },
    },
])
