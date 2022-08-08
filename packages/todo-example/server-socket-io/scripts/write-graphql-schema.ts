import { printSchema } from "@graphql-tools/graphql";
import { schema } from "../src/schema.js";
import * as fs from "fs";
import * as path from "path";

const contents = "### THIS FILE IS AUTO GENERATED\n\n" + printSchema(schema);

fs.writeFileSync(
  path.join(__dirname, "..", "..", "schema.graphql"),
  contents,
  "utf-8"
);
