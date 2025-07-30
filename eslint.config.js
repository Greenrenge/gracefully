module.exports = {
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint", "prettier", "mocha"],
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: "module",
  },
  extends: ["eslint:recommended", "@typescript-eslint/recommended", "prettier"],
  env: {
    node: true,
    mocha: true,
    es6: true,
  },
  rules: {
    "no-console": "error",
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/explicit-function-return-type": "off",
  },
  plugins: ["@typescript-eslint"],
}
