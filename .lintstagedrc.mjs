import path from 'node:path';

/** @type {import('lint-staged').ConfigFn} */
const buildEslintCommand = (filenames) =>
  `next lint --fix --file ${filenames
    .map((f) => path.relative(process.cwd(), f))
    .join(' --file ')}`;
const prettierCommand = 'prettier --write';

/** @type {import('lint-staged').Config} */
export default {
  '*.{ts,tsx}': [
    () => 'tsc --incremental false --noEmit',
    buildEslintCommand,
    prettierCommand,
  ],
  '*.{js,jsx}': [buildEslintCommand, prettierCommand],
  '*.{json,yml,md,html,css,scss}': prettierCommand,
};
