"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_AI_SETTINGS = exports.AI_SETTINGS_STORAGE_KEY = void 0;
exports.normalizeAiSettings = normalizeAiSettings;
exports.isAiConfigured = isAiConfigured;
exports.AI_SETTINGS_STORAGE_KEY = "cmdcue.aiSettings";
exports.DEFAULT_AI_SETTINGS = {
    enabled: false,
    baseUrl: "https://api.openai.com/v1",
    apiKey: "",
    model: "gpt-4o-mini",
    temperature: 0.2,
    maxTokens: 600
};
function normalizeAiSettings(settings) {
    return {
        ...exports.DEFAULT_AI_SETTINGS,
        ...(settings ?? {}),
        baseUrl: (settings?.baseUrl ?? exports.DEFAULT_AI_SETTINGS.baseUrl).replace(/\/+$/, ""),
        temperature: Number.isFinite(settings?.temperature) ? Number(settings?.temperature) : exports.DEFAULT_AI_SETTINGS.temperature,
        maxTokens: Number.isFinite(settings?.maxTokens) ? Number(settings?.maxTokens) : exports.DEFAULT_AI_SETTINGS.maxTokens
    };
}
function isAiConfigured(settings) {
    return settings.enabled && Boolean(settings.baseUrl.trim()) && Boolean(settings.apiKey.trim()) && Boolean(settings.model.trim());
}
