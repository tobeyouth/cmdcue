"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadPacks = loadPacks;
exports.loadOperations = loadOperations;
const node_fs_1 = require("node:fs");
const node_path_1 = require("node:path");
const yaml_1 = require("yaml");
const loaderDir = (0, node_path_1.dirname)(__filename);
function defaultPacksDir() {
    const candidates = [
        process.env.CMDCUE_PACKS_DIR,
        (0, node_path_1.resolve)(process.cwd(), "packages", "raycast", "assets", "packs"),
        (0, node_path_1.resolve)(process.cwd(), "packages", "core", "packs"),
        (0, node_path_1.resolve)(process.cwd(), "assets", "packs"),
        (0, node_path_1.resolve)(process.cwd(), "packs"),
        (0, node_path_1.resolve)(loaderDir, "../../assets/packs"),
        (0, node_path_1.resolve)(loaderDir, "../../packs"),
        (0, node_path_1.resolve)(loaderDir, "../packs"),
        (0, node_path_1.resolve)(loaderDir, "../../../assets/packs"),
        (0, node_path_1.resolve)(loaderDir, "../../../packs"),
        (0, node_path_1.resolve)(loaderDir, "../../../packages/raycast/assets/packs"),
        (0, node_path_1.resolve)(loaderDir, "../../../packages/core/packs")
    ].filter((candidate) => Boolean(candidate));
    const found = candidates.find((candidate) => (0, node_fs_1.existsSync)(candidate));
    if (!found)
        return candidates[0];
    return found;
}
function readDataFile(path) {
    const content = (0, node_fs_1.readFileSync)(path, "utf8");
    if (path.endsWith(".json"))
        return JSON.parse(content);
    return (0, yaml_1.parse)(content);
}
function findDataFile(directory, basename) {
    const candidates = [`${basename}.yaml`, `${basename}.yml`, `${basename}.json`].map((file) => (0, node_path_1.join)(directory, file));
    const found = candidates.find((candidate) => (0, node_fs_1.existsSync)(candidate));
    if (!found)
        throw new Error(`Missing ${basename}.yaml, ${basename}.yml, or ${basename}.json in ${directory}`);
    return found;
}
function stringArray(value) {
    if (!Array.isArray(value))
        return [];
    return value.filter((item) => typeof item === "string");
}
function normalizeOperation(operation) {
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
function loadPacks(packsDir = defaultPacksDir()) {
    return (0, node_fs_1.readdirSync)(packsDir)
        .map((entry) => (0, node_path_1.join)(packsDir, entry))
        .filter((path) => (0, node_fs_1.statSync)(path).isDirectory())
        .map((packDir) => {
        const manifest = readDataFile(findDataFile(packDir, "pack"));
        const operationsDir = (0, node_path_1.join)(packDir, "operations");
        const operations = (0, node_fs_1.readdirSync)(operationsDir)
            .filter((file) => file.endsWith(".json") || file.endsWith(".yaml") || file.endsWith(".yml"))
            .flatMap((file) => readDataFile((0, node_path_1.join)(operationsDir, file)))
            .map(normalizeOperation);
        return { manifest, operations };
    });
}
function loadOperations(packsDir) {
    return loadPacks(packsDir).flatMap((pack) => pack.operations);
}
