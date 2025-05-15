module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true
    }
  },
  settings: {
    react: {
      version: 'detect'
    }
  },
  env: {
    browser: true,
    es6: true,
    node: true
  },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:@typescript-eslint/recommended'
  ],
  plugins: [
    'react',
    '@typescript-eslint',
    'unused-imports' // Plugin mới thêm vào
  ],
  rules: {
    // Quy tắc cho unused-imports
    'no-unused-vars': 'off', // Tắt quy tắc mặc định
    '@typescript-eslint/no-unused-vars': 'off', // Tắt quy tắc TypeScript
    'unused-imports/no-unused-imports': 'error', // Báo lỗi với import không sử dụng
    'unused-imports/no-unused-vars': [
      'warn',
      { 
        'vars': 'all', 
        'varsIgnorePattern': '^_', 
        'args': 'after-used', 
        'argsIgnorePattern': '^_' 
      }
    ]
  }
};