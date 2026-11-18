module.exports = {
  env: {
    browser: true,
    commonjs: true,
    es6: true,
    node: true,
  },
  extends: ["eslint:recommended", "plugin:react/recommended"],
  globals: {
    wp: "readonly",
    jQuery: "readonly",
    ttpLayer: "readonly",
    modelRenderer: "readonly",
    BSDK: "readonly",
    bp3dBlock: "readonly",
    elementorFrontend: "readonly",
    OV: "readonly",
  },
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 12,
    sourceType: "module",
  },
  plugins: ["react"],
  settings: {
    react: { version: "detect" },
  },
  rules: {
    'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' }],

    "func-names": "off",
    "no-console": "off",
    "react/jsx-filename-extension": [1, { extensions: [".js", ".jsx"] }],
    "react/prop-types": "off",
    "react/react-in-jsx-scope": "off",
    "react/display-name": "off",
    "no-process-exit": "off",
    "no-unsafe-optional-chaining": "off",
    "object-shorthand": "warn",
    "class-methods-use-this": "off",
  },
  overrides: [
    {
      // src/ is TypeScript; tsc covers undefined names and types.
      files: ["*.ts", "*.tsx"],
      parser: "@typescript-eslint/parser",
      plugins: ["@typescript-eslint"],
      rules: {
        "no-undef": "off",
        "no-unused-vars": "off",
        "no-redeclare": "off",
        "@typescript-eslint/no-unused-vars": ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' }],
        "react/jsx-filename-extension": "off",
      },
    },
  ],
};
