import { FlatCompat } from '@eslint/eslintrc';
import pluginJs from '@eslint/js';
import eslintConfigPrettier from 'eslint-config-prettier';
import globals from 'globals';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import tseslint from 'typescript-eslint';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
  baseDirectory: __dirname,
});

export default [
  {
    ignores: ['**/node_modules/'],
  },
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
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
