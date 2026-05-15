export declare const AI_SETTINGS_STORAGE_KEY = "cmdcue.aiSettings";
export type AiSettings = {
    enabled: boolean;
    baseUrl: string;
    apiKey: string;
    model: string;
    temperature: number;
    maxTokens: number;
};
export declare const DEFAULT_AI_SETTINGS: AiSettings;
export declare function normalizeAiSettings(settings: Partial<AiSettings> | null | undefined): AiSettings;
export declare function isAiConfigured(settings: AiSettings): boolean;
