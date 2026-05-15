import { afterEach, describe, expect, test, vi } from "vitest";
import { askOpenAICompatible } from "../src/ai-client";
import { normalizeAiSettings } from "../src/ai-settings";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("askOpenAICompatible", () => {
  test("calls chat completions with OpenAI-compatible payload", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ choices: [{ message: { content: "answer" } }] })
    });
    vi.stubGlobal("fetch", fetchMock);

    const answer = await askOpenAICompatible(
      "prompt",
      normalizeAiSettings({
        enabled: true,
        baseUrl: "https://example.com/v1/",
        apiKey: "secret",
        model: "custom-model",
        temperature: 0.1,
        maxTokens: 123
      })
    );

    expect(answer).toBe("answer");
    expect(fetchMock).toHaveBeenCalledWith(
      "https://example.com/v1/chat/completions",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ Authorization: "Bearer secret" }),
        body: JSON.stringify({
          model: "custom-model",
          messages: [{ role: "user", content: "prompt" }],
          temperature: 0.1,
          max_tokens: 123
        })
      })
    );
  });
});
