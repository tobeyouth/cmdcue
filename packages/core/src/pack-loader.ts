import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { parse as parseYaml } from "yaml";
import type { Operation, OperationPack, PackManifest } from "./types";

const loaderDir = dirname(__filename);

function defaultPacksDir(): string {
  const candidates = [
    process.env.CMDCUE_PACKS_DIR,
    resolve(process.cwd(), "packages", "raycast", "assets", "packs"),
    resolve(process.cwd(), "packages", "core", "packs"),
    resolve(process.cwd(), "assets", "packs"),
    resolve(process.cwd(), "packs"),
    resolve(loaderDir, "../../assets/packs"),
    resolve(loaderDir, "../../packs"),
    resolve(loaderDir, "../packs"),
    resolve(loaderDir, "../../../assets/packs"),
    resolve(loaderDir, "../../../packs"),
    resolve(loaderDir, "../../../packages/raycast/assets/packs"),
    resolve(loaderDir, "../../../packages/core/packs")
  ].filter((candidate): candidate is string => Boolean(candidate));
  const found = candidates.find((candidate) => existsSync(candidate));
  if (!found) return candidates[0];
  return found;
}

function readDataFile<T>(path: string): T {
  const content = readFileSync(path, "utf8");
  if (path.endsWith(".json")) return JSON.parse(content) as T;
  return parseYaml(content) as T;
}

function findDataFile(directory: string, basename: string): string {
  const candidates = [`${basename}.yaml`, `${basename}.yml`, `${basename}.json`].map((file) => join(directory, file));
  const found = candidates.find((candidate) => existsSync(candidate));
  if (!found) throw new Error(`Missing ${basename}.yaml, ${basename}.yml, or ${basename}.json in ${directory}`);
  return found;
}

function stringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

function normalizeOperation(operation: Operation & { queries?: unknown }): Operation {
  return {
    ...operation,
    intent: {
      verbs: stringArray(operation.intent?.verbs),
      objects: stringArray(operation.intent?.objects),
      queries: stringArray(operation.intent?.queries).concat(stringArray(operation.queries))
    },
    commands: Array.isArray(operation.commands) ? operation.commands : [],
    shortcuts: Array.isArray(operation.shortcuts) ? operation.shortcuts : []
  };
}

export function loadPacks(packsDir = defaultPacksDir()): OperationPack[] {
  return readdirSync(packsDir)
    .map((entry) => join(packsDir, entry))
    .filter((path) => statSync(path).isDirectory())
    .map((packDir) => {
      const manifest = readDataFile<PackManifest>(findDataFile(packDir, "pack"));
      const operationsDir = join(packDir, "operations");
      const operations = readdirSync(operationsDir)
        .filter((file) => file.endsWith(".json") || file.endsWith(".yaml") || file.endsWith(".yml"))
        .flatMap((file) => readDataFile<Operation[]>(join(operationsDir, file)))
        .map(normalizeOperation);
      return { manifest, operations };
    });
}

export function loadOperations(packsDir?: string): Operation[] {
  return loadPacks(packsDir).flatMap((pack) => pack.operations);
}
