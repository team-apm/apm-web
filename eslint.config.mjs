import { FlatCompat } from '@eslint/eslintrc';
import eslintConfigPrettier from 'eslint-config-prettier';
import globals from 'globals';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
  baseDirectory: __dirname,
});

export default [
  {
    ignores: ['**/node_modules/'],
  },
  ...compat.extends('next/core-web-vitals'),
  {
    languageOptions: {
      globals: {
        ...globals.browser,
      },

      ecmaVersion: 2022,
      sourceType: 'module',
    },

    rules: {
      'prefer-arrow-callback': 'error',
      'require-jsdoc': 'off',

      'new-cap': [
        'error',
        {
          capIsNew: false,
        },
      ],

      'react/display-name': 'off',
    },
  },
  eslintConfigPrettier,
];
