const { cpSync, rmSync } = require("node:fs");
const { join } = require("node:path");

const source = join(process.cwd(), "packages", "core", "packs");
const target = join(process.cwd(), "packages", "raycast", "assets", "packs");

rmSync(target, { recursive: true, force: true });
cpSync(source, target, { recursive: true });
