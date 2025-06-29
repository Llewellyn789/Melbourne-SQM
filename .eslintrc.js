module.exports = {
  root: true,
  extends: ['react-app'],
  rules: {
    // Add any custom rules here
  },
  // This will resolve the conflict by explicitly setting the parser options
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
  }
};
