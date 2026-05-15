"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_CONFIG = void 0;
exports.configPath = configPath;
exports.normalizeConfig = normalizeConfig;
exports.loadConfig = loadConfig;
exports.saveConfig = saveConfig;
exports.updateConfig = updateConfig;
const node_fs_1 = require("node:fs");
const node_path_1 = require("node:path");
const node_os_1 = require("node:os");
const yaml_1 = require("yaml");
const ai_settings_1 = require("./ai-settings");
const i18n_1 = require("./i18n");
exports.DEFAULT_CONFIG = {
    language: i18n_1.DEFAULT_LANGUAGE,
    ai: ai_settings_1.DEFAULT_AI_SETTINGS
};
function configPath() {
    return process.env.CMDCUE_CONFIG || (0, node_path_1.join)((0, node_os_1.homedir)(), ".config", "cmdcue", "config.yaml");
}
function normalizeConfig(config) {
    return {
        language: config?.language || exports.DEFAULT_CONFIG.language,
        ai: (0, ai_settings_1.normalizeAiSettings)(config?.ai)
    };
}
function loadConfig(path = configPath()) {
    if (!(0, node_fs_1.existsSync)(path))
        return exports.DEFAULT_CONFIG;
    const data = (0, yaml_1.parse)((0, node_fs_1.readFileSync)(path, "utf8"));
    return normalizeConfig(data);
}
function saveConfig(config, path = configPath()) {
    const normalized = normalizeConfig(config);
    (0, node_fs_1.mkdirSync)((0, node_path_1.dirname)(path), { recursive: true });
    (0, node_fs_1.writeFileSync)(path, (0, yaml_1.stringify)(normalized), { mode: 0o600 });
    return normalized;
}
function updateConfig(updater, path = configPath()) {
    return saveConfig(updater(loadConfig(path)), path);
}
