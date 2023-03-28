const { defineConfig } = require('eslint-define-config');
const importRules = require('eslint-config-airbnb-base/rules/imports');

module.exports = defineConfig({
  env: {
    browser: true,
    es2022: true,
    node: true,
  },
  extends: [
    'airbnb-base',
    'airbnb-typescript/base',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: 'tsconfig.eslint.json',
    ecmaVersion: 13,
    sourceType: 'module',
  },
  rules: {
    'import/no-extraneous-dependencies': ['error', {
      devDependencies: importRules
        .rules['import/no-extraneous-dependencies'][1]
        .devDependencies.concat([
          '**/vite.config.{js,ts}',
        ]),
      packageDir: ['.'],
    }],
  },
});
