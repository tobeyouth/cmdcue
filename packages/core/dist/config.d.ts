import { type AiSettings } from "./ai-settings";
export type CmdCueConfig = {
    language: string;
    ai: AiSettings;
};
export declare const DEFAULT_CONFIG: CmdCueConfig;
export declare function configPath(): string;
export declare function normalizeConfig(config: Partial<CmdCueConfig> | null | undefined): CmdCueConfig;
export declare function loadConfig(path?: string): CmdCueConfig;
export declare function saveConfig(config: CmdCueConfig, path?: string): CmdCueConfig;
export declare function updateConfig(updater: (config: CmdCueConfig) => CmdCueConfig, path?: string): CmdCueConfig;
