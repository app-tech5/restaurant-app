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
      'i18next': require('eslint-plugin-i18next'),
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

      // i18next rules for detecting hardcoded strings
      'i18next/no-literal-string': [
        'error',
        {
          // Allow strings that are likely not meant to be translated
          ignore: [
            // Empty strings
            '',
            // Single characters
            /^[a-zA-Z]$/,
            // Common non-translatable strings
            /^[\d\s\.\-\+\=\<\>\[\]\(\)\{\}\*\+\?\^\$\|\\]*$/,
            // URLs and paths
            /^https?:\/\//,
            /^\/\w+/,
            // CSS classes and styles
            /^[a-zA-Z][a-zA-Z0-9\-_]*$/,
            // Import/export statements
            /^(import|export|from|require)$/,
            // React component names
            /^[A-Z][a-zA-Z0-9]*$/,
            // Common programming keywords
            /^(true|false|null|undefined|function|const|let|var|if|else|for|while|do|switch|case|default|try|catch|finally|throw|return|break|continue)$/,
            // File extensions
            /\.(js|jsx|ts|tsx|json|css|scss|html|xml)$/,
            // Common abbreviations
            /^(id|url|api|http|https|www|com|org|net|io)$/i,
            // Version numbers
            /^\d+\.\d+\.\d+$/,
            // Time formats
            /^\d{1,2}:\d{2}$/,
            // Date formats
            /^\d{1,2}\/\d{1,2}\/\d{4}$/,
            // Phone numbers (basic pattern)
            /^\+?\d[\d\s\-\(\)]+$/,
            // Email domains
            /^@\w+\.\w+$/,
          ],
          // Allow JSX attributes that commonly contain non-translatable strings
          ignoreCallee: [
            'console.log',
            'console.error',
            'console.warn',
            'console.info',
            'StyleSheet.create',
            'require',
            'import',
          ],
          // Allow specific JSX attributes
          ignoreAttribute: [
            'key',
            'testID',
            'accessibilityLabel',
            'accessibilityHint',
            'placeholder',
            'style',
            'className',
            'id',
            'name',
            'type',
            'value',
            'defaultValue',
            'src',
            'href',
            'alt',
            'title',
            'role',
            'aria-label',
            'aria-describedby',
            'data-testid',
            'data-cy',
          ],
        },
      ],

    },
  },
  {
    files: ['**/*.test.js', '**/*.spec.js', '__tests__/**/*.js'],
    rules: {
      'no-console': 'off', 
    },
  },
];
