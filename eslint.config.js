const noCommentsPlugin = require('eslint-plugin-no-comments');

module.exports = [
  {
    ignores: [
      'node_modules/**',
      '.expo/**',
      '.expo-shared/**',
      'assets/**',
      'metro.config.js',
      'babel.config.js',
    ],
  },
  {
    files: ['**/*.js', '**/*.jsx'],
    plugins: {
      'no-comments': noCommentsPlugin,
    },
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        console: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        module: 'readonly',
        
        fetch: 'readonly',
        alert: 'readonly',
        require: 'readonly',
        __DEV__: 'readonly',
        
        Expo: 'readonly',
        
        describe: 'readonly',
        it: 'readonly',
        test: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        jest: 'readonly',
      },
    },
    rules: {
      
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'prefer-const': 'error',
      'no-var': 'error',
      'no-undef': 'error',
      "no-multiple-empty-lines": ["error", { "max": 1, "maxEOF": 1 }],
      "no-console": ["warn", { allow: ["warn", "error"] }],
      'no-comments/disallowComments': 'error',
      
    },
  },
  {
    files: ['**/*.test.js', '**/*.spec.js', '__tests__/**/*.js'],
    rules: {
      'no-console': 'off', 
    },
  },
];
