import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import unusedImportsPlugin from 'eslint-plugin-unused-imports';

export default [
  {
    ignores: ['node_modules/**', 'build/**', 'dist/**', '**/*.test.ts']
  },
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true
        }
      },
      globals: {
        // Browser globals
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
        // Node.js globals
        process: 'readonly',
        // React globals
        React: 'readonly'
      }
    },
    settings: {
      react: {
        version: 'detect'
      }
    },
    plugins: {
      react: reactPlugin,
      '@typescript-eslint': tsPlugin,
      'react-hooks': reactHooksPlugin,
      'unused-imports': unusedImportsPlugin
    },
    rules: {
      // Disable standard no-unused-vars rules in favor of unused-imports
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      
      // Enable unused-imports rules
      'unused-imports/no-unused-imports': 'error',
      'unused-imports/no-unused-vars': [
        'warn',
        { 
          'vars': 'all', 
          'varsIgnorePattern': '^_', 
          'args': 'after-used', 
          'argsIgnorePattern': '^_' 
        }
      ]
    }
  }
];