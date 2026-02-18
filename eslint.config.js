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
        // React Native globals
        fetch: 'readonly',
        alert: 'readonly',
        require: 'readonly',
        __DEV__: 'readonly',
        // Expo globals
        Expo: 'readonly',
        // Jest globals
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
      // Règles JavaScript générales
      'no-console': 'warn',
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'prefer-const': 'error',
      'no-var': 'error',
      'no-undef': 'error',

      // Règles React peuvent être ajoutées plus tard si nécessaire
    },
  },
  {
    files: ['**/*.test.js', '**/*.spec.js', '__tests__/**/*.js'],
    rules: {
      'no-console': 'off', // Permettre console.log dans les tests
    },
  },
];
