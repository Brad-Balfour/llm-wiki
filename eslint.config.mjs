import globals from 'globals';
import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import eslintConfigPrettier from 'eslint-config-prettier';
import js from '@eslint/js';

/** @type {import("eslint").Linter.Config[]} */
export default [
  {
    ignores: [
      'node_modules/',
      'dist/',
      '*.min.js',
      'build/',
      'coverage/',
      'test-results/',
      'worktrees/',
    ],
  },
  js.configs.recommended,
  {
    files: ['**/*.{js,ts,mjs,cjs}'],
    languageOptions: {
      globals: {
        ...globals.node,
      },
      parser: tsParser,
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
    },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
  {
    files: ['**/*.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: './tsconfig.json',
      },
    },
    rules: {
      '@typescript-eslint/explicit-function-return-type': 'off',
    },
  },
  eslintConfigPrettier,
];
