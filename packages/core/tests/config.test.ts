import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { afterEach, describe, expect, test } from "vitest";
import { DEFAULT_CONFIG, loadConfig, saveConfig, updateConfig } from "../src/config";

const dirs: string[] = [];

afterEach(() => {
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true });
});

function tempConfigPath(): string {
  const dir = mkdtempSync(join(tmpdir(), "cmdcue-config-"));
  dirs.push(dir);
  return join(dir, "nested", "config.yaml");
}

describe("file config", () => {
  test("returns defaults when config file is missing", () => {
    expect(loadConfig(tempConfigPath())).toEqual(DEFAULT_CONFIG);
  });

  test("saves and loads YAML config", () => {
    const path = tempConfigPath();
    saveConfig(
      {
        language: "zh",
        ai: {
          enabled: true,
          baseUrl: "https://example.com/v1/",
          apiKey: "key",
          model: "model",
          temperature: 0.1,
          maxTokens: 123
        }
      },
      path
    );

    expect(loadConfig(path)).toMatchObject({
      language: "zh",
      ai: {
        enabled: true,
        baseUrl: "https://example.com/v1",
        apiKey: "key",
        model: "model",
        temperature: 0.1,
        maxTokens: 123
      }
    });
  });

  test("updates existing config", () => {
    const path = tempConfigPath();
    const next = updateConfig((config) => ({ ...config, language: "zh" }), path);
    expect(next.language).toBe("zh");
    expect(loadConfig(path).language).toBe("zh");
  });
});
