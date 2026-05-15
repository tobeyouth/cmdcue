import { describe, expect, test } from "vitest";
import { shortcutKeys } from "../src/shortcut";

describe("shortcutKeys", () => {
  test("expands tmux prefix to ctrl + b", () => {
    expect(shortcutKeys("prefix + c")).toBe("ctrl + b + c");
  });
});
