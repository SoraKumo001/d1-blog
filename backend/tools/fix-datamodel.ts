import fs from "fs";
import path from "path";

const prismaPath = require.resolve("@prisma/client");
const runtimePath = path.join(path.dirname(prismaPath), "../../.prisma/client");

const srcPath = path.join(runtimePath, "index.js");
const destPath = path.join(runtimePath, "wasm.js");

const src = fs.readFileSync(srcPath);
const runtimeDataModel = String(src).match(
  /config\.runtimeDataModel = JSON\.parse\(".*"\)/
)?.[0];
if (runtimeDataModel) {
  const dist = fs.readFileSync(destPath);
  const newRuntimeDataModel = String(dist).replace(
    /config\.runtimeDataModel = JSON\.parse\(".*"\)/,
    runtimeDataModel
  );
  fs.writeFileSync(destPath, newRuntimeDataModel);
}
