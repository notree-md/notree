module.exports = {
  ignorePatterns: ['*.cjs'],
  env: {
    browser: true,
  },
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],
  parser: '@typescript-eslint/parser',
  rules: {
    '@typescript-eslint/no-non-null-assertion': 'off',
  },
};
