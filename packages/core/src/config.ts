import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { homedir } from "node:os";
import { parse as parseYaml, stringify as stringifyYaml } from "yaml";
import { DEFAULT_AI_SETTINGS, normalizeAiSettings, type AiSettings } from "./ai-settings";
import { DEFAULT_LANGUAGE } from "./i18n";

export type CmdCueConfig = {
  language: string;
  ai: AiSettings;
};

export const DEFAULT_CONFIG: CmdCueConfig = {
  language: DEFAULT_LANGUAGE,
  ai: DEFAULT_AI_SETTINGS
};

export function configPath(): string {
  return process.env.CMDCUE_CONFIG || join(homedir(), ".config", "cmdcue", "config.yaml");
}

export function normalizeConfig(config: Partial<CmdCueConfig> | null | undefined): CmdCueConfig {
  return {
    language: config?.language || DEFAULT_CONFIG.language,
    ai: normalizeAiSettings(config?.ai)
  };
}

export function loadConfig(path = configPath()): CmdCueConfig {
  if (!existsSync(path)) return DEFAULT_CONFIG;
  const data = parseYaml(readFileSync(path, "utf8")) as Partial<CmdCueConfig> | null;
  return normalizeConfig(data);
}

export function saveConfig(config: CmdCueConfig, path = configPath()): CmdCueConfig {
  const normalized = normalizeConfig(config);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, stringifyYaml(normalized), { mode: 0o600 });
  return normalized;
}

export function updateConfig(updater: (config: CmdCueConfig) => CmdCueConfig, path = configPath()): CmdCueConfig {
  return saveConfig(updater(loadConfig(path)), path);
}
