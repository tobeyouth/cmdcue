import { describe, expect, test } from "vitest";
import { isAiConfigured, normalizeAiSettings } from "../src/ai-settings";

describe("AI settings", () => {
  test("defaults to disabled local settings", () => {
    const settings = normalizeAiSettings(null);
    expect(settings.enabled).toBe(false);
    expect(isAiConfigured(settings)).toBe(false);
  });

  test("normalizes base URL and detects configured settings", () => {
    const settings = normalizeAiSettings({
      enabled: true,
      baseUrl: "https://example.com/v1/",
      apiKey: "key",
      model: "model"
    });
    expect(settings.baseUrl).toBe("https://example.com/v1");
    expect(isAiConfigured(settings)).toBe(true);
  });
});
