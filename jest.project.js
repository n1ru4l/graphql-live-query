const { resolve } = require("path");
const { pathsToModuleNameMapper } = require("ts-jest");

const ROOT_DIR = __dirname;
const TSCONFIG = resolve(ROOT_DIR, "tsconfig.json");
const tsconfig = require(TSCONFIG);
const CI = !!process.env.CI;

module.exports = ({ dirname, projectMode = true }) => {
  const pkg = require(resolve(dirname, "package.json"));

  return {
    ...(CI || !projectMode
      ? {}
      : { displayName: pkg.name.replace("@graphql-codegen/", "") }),
    transform: { "^.+\\.[jt]sx?$": "babel-jest" },
    testEnvironment: "node",
    rootDir: dirname,
    globals: {
      "ts-jest": {
        diagnostics: false,
        tsconfig: "tsconfig.json",
      },
    },
    restoreMocks: true,
    reporters: ["default"],
    modulePathIgnorePatterns: ["dist"],
    moduleNameMapper: pathsToModuleNameMapper(tsconfig.compilerOptions.paths, {
      prefix: `${ROOT_DIR}/`,
    }),
    cacheDirectory: resolve(
      ROOT_DIR,
      `${CI ? "" : "node_modules/"}.cache/jest`
    ),
    setupFiles: [`${ROOT_DIR}/dev-test/setup.js`],
    collectCoverage: false,
  };
};
