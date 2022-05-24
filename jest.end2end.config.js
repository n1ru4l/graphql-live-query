const { resolve } = require("path");
const { pathsToModuleNameMapper } = require("ts-jest");
const CI = !!process.env.CI;

const ROOT_DIR = __dirname;
const TSCONFIG = resolve(ROOT_DIR, "tsconfig.json");
const tsconfig = require(TSCONFIG);

module.exports = {
  testEnvironment: "node",
  transform: { "^.+\\.[jt]sx?$": "babel-jest" },
  transformIgnorePatterns: ["node_modules/(?!graphql)"],
  rootDir: ROOT_DIR,
  restoreMocks: true,
  reporters: ["default"],
  modulePathIgnorePatterns: ["dist", "test-assets", "test-files", "fixtures"],
  testMatch: ["**/packages/todo-example/end2end-tests/**/*.spec.ts"],
  moduleNameMapper: pathsToModuleNameMapper(tsconfig.compilerOptions.paths, {
    prefix: `${ROOT_DIR}/`,
  }),
  collectCoverage: false,
  cacheDirectory: resolve(
    ROOT_DIR,
    `${CI ? "" : "node_modules/"}.cache/jest-end2end`
  ),
};
