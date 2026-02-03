// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*', '.expo/*', 'node_modules/*'],
  },
  {
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
      'no-unused-imports/no-unused-imports': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      'react/jsx-no-bind': [
        'warn',
        {
          allowArrowFunctions: true,
          allowBind: false,
        },
      ],
    },
  },
]);
