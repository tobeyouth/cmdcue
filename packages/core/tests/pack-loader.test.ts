import { join } from "node:path";
import { describe, expect, test } from "vitest";
import { buildGroundedAnswerPrompt } from "../src/answer";
import { loadOperations } from "../src/pack-loader";
import { searchOperations } from "../src/search";

describe("loadOperations", () => {
  test("loads operations from an explicit Raycast assets packs directory", () => {
    const operations = loadOperations(join(process.cwd(), "..", "raycast", "assets", "packs"));
    expect(operations.some((operation) => operation.id === "tmux.window.close-current")).toBe(true);
    expect(operations.some((operation) => operation.id === "vim.quit.normal")).toBe(true);
  });

  test("normalizes top-level YAML queries into intent queries", () => {
    const operations = loadOperations(join(process.cwd(), "..", "raycast", "assets", "packs"));
    const operation = operations.find((candidate) => candidate.id === "gh.auth.login");

    expect(operation?.intent.queries).toContain("gh login");
    expect(searchOperations("gh login", operations).map((result) => result.operation.id)).toContain("gh.auth.login");
  });

  test("loads packs written in YAML", () => {
    const operations = loadOperations(join(process.cwd(), "tests", "fixtures", "yaml-packs"));
    expect(operations.map((operation) => operation.id)).toEqual(["demo.echo"]);
  });

  test("tmux session query lists multiple session operations", () => {
    const operations = loadOperations(join(process.cwd(), "..", "raycast", "assets", "packs"));
    const results = searchOperations("tmux session", operations, 20);
    expect(results.length).toBeGreaterThanOrEqual(8);
    expect(results.map((result) => result.operation.id)).toEqual(
      expect.arrayContaining(["tmux.session.list", "tmux.session.new-named", "tmux.session.attach", "tmux.session.kill"])
    );
    expect(results.every((result) => result.operation.category === "session")).toBe(true);
  });

  test("commands with placeholders are pasteable templates", () => {
    const operations = loadOperations(join(process.cwd(), "..", "raycast", "assets", "packs"));
    const placeholderCommands = operations.flatMap((operation) =>
      operation.commands.filter((command) => command.command.includes("<") || command.command.includes(">"))
    );
    expect(placeholderCommands.length).toBeGreaterThan(0);
    expect(placeholderCommands.every((command) => command.pasteable === true)).toBe(true);
  });

  test("ask grounding expands tmux prefix shortcut", () => {
    const operations = loadOperations(join(process.cwd(), "..", "raycast", "assets", "packs"));
    const results = searchOperations("tmux 新建 window", operations, 6);
    const prompt = buildGroundedAnswerPrompt("tmux 新建 window", results, "zh");
    expect(prompt).toContain("ctrl + b + c");
  });
});
