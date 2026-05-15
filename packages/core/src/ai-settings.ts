export const AI_SETTINGS_STORAGE_KEY = "cmdcue.aiSettings";

export type AiSettings = {
  enabled: boolean;
  baseUrl: string;
  apiKey: string;
  model: string;
  temperature: number;
  maxTokens: number;
};

export const DEFAULT_AI_SETTINGS: AiSettings = {
  enabled: false,
  baseUrl: "https://api.openai.com/v1",
  apiKey: "",
  model: "gpt-4o-mini",
  temperature: 0.2,
  maxTokens: 600
};

export function normalizeAiSettings(settings: Partial<AiSettings> | null | undefined): AiSettings {
  return {
    ...DEFAULT_AI_SETTINGS,
    ...(settings ?? {}),
    baseUrl: (settings?.baseUrl ?? DEFAULT_AI_SETTINGS.baseUrl).replace(/\/+$/, ""),
    temperature: Number.isFinite(settings?.temperature) ? Number(settings?.temperature) : DEFAULT_AI_SETTINGS.temperature,
    maxTokens: Number.isFinite(settings?.maxTokens) ? Number(settings?.maxTokens) : DEFAULT_AI_SETTINGS.maxTokens
  };
}

export function isAiConfigured(settings: AiSettings): boolean {
  return settings.enabled && Boolean(settings.baseUrl.trim()) && Boolean(settings.apiKey.trim()) && Boolean(settings.model.trim());
}
