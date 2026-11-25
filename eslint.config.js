import js from '@eslint/js';
import globals from 'globals';

export default [
  {
    ignores: [
      'node_modules/**',
      'coverage/**',
      'playwright-report/**',
      'test-results/**',
      'frontend/audio/**',
      'frontend/data/names-data.js',
    ],
  },
  {
    files: ['scripts/**/*.mjs', 'tests/**/*.js', 'tests/**/*.mjs'],
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: 'module',
      globals: {
        ...globals.node,
      },
    },
    ...js.configs.recommended,
    rules: {
      ...js.configs.recommended.rules,
      'no-unused-vars': ['error', { argsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' }],
      'no-var': 'error',
      'prefer-const': 'error',
    },
  },
  {
    files: ['frontend/js/pages/*.js', 'frontend/reciter-player.js', 'frontend/i18n.js', 'frontend/idb-store.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'script',
      globals: {
        ...globals.browser,
      },
    },
    ...js.configs.recommended,
    rules: {
      ...js.configs.recommended.rules,
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' }],
      'no-var': 'error',
      'prefer-const': 'error',
    },
  },
  {
    files: ['frontend/shared.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'script',
      globals: {
        ...globals.browser,
        ...globals.commonjs,
      },
    },
    ...js.configs.recommended,
    rules: {
      ...js.configs.recommended.rules,
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' }],
    },
  },
  {
    files: ['frontend/sw.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'script',
      globals: {
        ...globals.serviceworker,
      },
    },
    ...js.configs.recommended,
    rules: {
      ...js.configs.recommended.rules,
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' }],
    },
  },
];

