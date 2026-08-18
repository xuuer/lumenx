import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const nextTypesDir = path.resolve(".next", "types");
const nextBuildEntry = path.resolve("node_modules", "next", "dist", "bin", "next");
const tscEntry = path.resolve("node_modules", "typescript", "bin", "tsc");

function runNodeCli(entry, args) {
  const result = spawnSync(process.execPath, [entry, ...args], {
    stdio: "inherit",
  });

  if (typeof result.status === "number") {
    return result.status;
  }
  return 1;
}

function hasNextTypes() {
  if (!fs.existsSync(nextTypesDir)) {
    return false;
  }

  const entries = fs.readdirSync(nextTypesDir, { recursive: true });
  return entries.some((entry) => String(entry).endsWith(".ts"));
}

if (!hasNextTypes()) {
  console.log(
    "Next.js generated types are missing. Running `next build` once to bootstrap .next/types...",
  );
  const buildStatus = runNodeCli(nextBuildEntry, ["build"]);
  if (buildStatus !== 0) {
    process.exit(buildStatus);
  }
}

process.exit(runNodeCli(tscEntry, ["--noEmit"]));
