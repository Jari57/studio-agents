const globals = require("globals");
const pluginJs = require("@eslint/js");

module.exports = [
  // Global ignore patterns
  {
    ignores: ["node_modules/", "public/", "logs/", "temp/", "server-security-patch.js", "test_*.js"],
  },
  // Javascript file configuration
  {
    files: ["**/*.js"],
    languageOptions: {
      sourceType: "commonjs",
      globals: {
        ...globals.node,
        ...globals.es2021,
      },
      ecmaVersion: 2022,
    },
    rules: {
      // Functional rules
      "no-unused-vars": ["warn", { 
        "argsIgnorePattern": "^_",
        "varsIgnorePattern": "^_",
        "caughtErrorsIgnorePattern": "^_"
      }],
      "no-console": "off", // Backend apps log to console frequently
      "no-undef": "error",
      "prefer-const": "warn",
    },
  },
  // Apply standard recommended rules
  pluginJs.configs.recommended,
];
