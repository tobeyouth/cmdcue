import { join } from "node:path";
import { describe, expect, test } from "vitest";
import { validatePacks } from "../src/pack-validator";

describe("validatePacks", () => {
  test("accepts valid YAML packs", () => {
    const result = validatePacks(join(process.cwd(), "tests", "fixtures", "yaml-packs"));
    expect(result.ok).toBe(true);
    expect(result.errors).toEqual([]);
  });

  test("rejects common AI-generated schema mistakes", () => {
    const result = validatePacks(join(process.cwd(), "tests", "fixtures", "invalid-packs"));
    expect(result.ok).toBe(false);
    expect(result.errors.map((error) => error.message)).toEqual(
      expect.arrayContaining([
        "Move queries under intent.queries",
        "Expected one of: safe, readonly, destructive",
        "Invalid placeholder <Name>; use lowercase kebab-case",
        "Template commands with placeholders must be pasteable"
      ])
    );
  });

  test("accepts the repository source packs", () => {
    const result = validatePacks(join(process.cwd(), "packs"));
    expect(result.ok).toBe(true);
    expect(result.errors).toEqual([]);
  });
});
