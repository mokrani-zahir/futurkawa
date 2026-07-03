module.exports = {
  root: true,
  env: { browser: true, es2021: true, node: true },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: { jsx: true },
  },
  settings: { react: { version: 'detect' } },
  plugins: ['react-refresh'],
  rules: {
    'react/prop-types': 'off', // no PropTypes convention in this codebase
    'react/react-in-jsx-scope': 'off', // React 18 automatic JSX runtime
    'react/no-unescaped-entities': 'off', // French UI copy is full of literal apostrophes
    'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    // Context + hook are intentionally co-located in one file throughout
    // this codebase (AuthContext, AlertContext, WebSocketContext) — not
    // worth splitting into two files each just for HMR granularity.
    'react-refresh/only-export-components': 'off',
  },
  overrides: [
    {
      files: ['**/*.test.{js,jsx}', 'src/test/**'],
      globals: {
        describe: 'readonly',
        it: 'readonly',
        test: 'readonly',
        expect: 'readonly',
        vi: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
      },
    },
  ],
};
