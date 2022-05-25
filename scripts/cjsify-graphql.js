"use strict";

const path = require("path");
const fs = require("fs");
const babel = require("@babel/core");
const cjsTransform = require("@babel/plugin-transform-modules-commonjs");
const glob = require("glob");

const graphqlPath = path.dirname(require.resolve("graphql"));
const pkgJSONPath = path.join(graphqlPath, "package.json");
const oldPkgJSONPath = path.join(graphqlPath, "package.json.backup");

const fileExists = (path) => {
  try {
    fs.statSync(path);
  } catch (_) {
    return false;
  }
  return true;
};

console.log("Need some graphql commonjs?");

const pkgJSON = JSON.parse(fs.readFileSync(pkgJSONPath, "utf-8"));

const [major] = pkgJSON.version.split(".").map((value) => Number(value));
if (major < 17) {
  console.log("this graphql version supports commonjs. all good.");
  process.exit(0);
}

if (fileExists(oldPkgJSONPath)) {
  console.log("already applied everything. all good.");
  process.exit(0);
}

fs.copyFileSync(pkgJSONPath, oldPkgJSONPath);

for (const [exportName, exportPathName] of Object.entries(pkgJSON.exports)) {
  pkgJSON.exports[exportName] = {
    import: exportPathName,
    require: exportPathName.replace(".js", ".cjs"),
  };
}

fs.writeFileSync(pkgJSONPath, JSON.stringify(pkgJSON, null, 2));

const files = glob.sync(path.join(graphqlPath, "**", "*.js"));

for (const file of files) {
  console.log("process", file);
  const cjsRegex = /from '(.*).js';$/gm;

  fs.writeFileSync(
    file.replace(".js", ".cjs"),
    babel.transform(
      fs
        .readFileSync(file, "utf-8")
        .replace(cjsRegex, (str, match1) => `from '${match1}.cjs'`),
      {
        plugins: [cjsTransform],
        babelrc: false,
        filename: file,
      }
    ).code
  );
}
