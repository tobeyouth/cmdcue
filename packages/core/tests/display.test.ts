import { describe, expect, test } from "vitest";
import { keywordLabel, preferredCommandText, prefersShortcut, primaryCommand, primaryShortcut } from "../src/display";
import { loadOperations } from "../src/pack-loader";
import type { Operation } from "../src/types";

const operation: Operation = {
  id: "tmux.session.new-named",
  tool: "tmux",
  category: "session",
  title: "Create a named session",
  zh: "创建一个命名 tmux session",
  intent: {
    verbs: ["new", "create", "新建"],
    objects: ["session", "会话"],
    queries: ["tmux new session"]
  },
  shortcuts: [],
  commands: [
    {
      command: "tmux new-session -s <session-name>",
      preferredCommand: "tmux new -s <session-name>",
      description: "Create and attach to a new named session",
      pasteable: true,
      risk: "safe"
    }
  ]
};

describe("display helpers", () => {
  test("uses preferredCommand for list labels", () => {
    expect(preferredCommandText(primaryCommand(operation))).toBe("tmux new -s <session-name>");
  });

  test("uses preferredCommand for copy and paste text", () => {
    const command = primaryCommand(operation);
    expect(command).toBeDefined();
    expect(preferredCommandText(command!)).toBe("tmux new -s <session-name>");
  });

  test("keeps keywords short and ordered by intent", () => {
    expect(keywordLabel(operation)).toBe("new / create / 新建 / session / 会话");
  });

  test("uses the parameterized gh pr create template as the primary command", () => {
    const operations = loadOperations();
    const ghPrCreate = operations.find((candidate) => candidate.id === "gh.pr.create");

    expect(preferredCommandText(primaryCommand(ghPrCreate!))).toBe('gh pr create --title "<title>" --body "<body>"');
  });

  test("uses the query to choose the best command template within an operation", () => {
    const operations = loadOperations();
    const ghPrCreate = operations.find((candidate) => candidate.id === "gh.pr.create");

    expect(preferredCommandText(primaryCommand(ghPrCreate!, "gh pr create base branch"))).toBe("gh pr create --base <base-branch>");
    expect(preferredCommandText(primaryCommand(ghPrCreate!, "gh pr create -B"))).toBe("gh pr create --base <base-branch>");
    expect(preferredCommandText(primaryCommand(ghPrCreate!, "gh pr create head branch"))).toBe("gh pr create --head <head-branch>");
    expect(preferredCommandText(primaryCommand(ghPrCreate!, "gh pr create reviewer"))).toBe("gh pr create --reviewer <user-or-team>");
  });

  test("detects shortcut-focused queries and exposes primary shortcuts", () => {
    const operations = loadOperations();
    const newWindow = operations.find((candidate) => candidate.id === "tmux.window.new");

    expect(prefersShortcut("tmux window 快捷键")).toBe(true);
    expect(prefersShortcut("tmux prefix window")).toBe(true);
    expect(prefersShortcut("tmux window")).toBe(false);
    expect(primaryShortcut(newWindow!)?.keys).toBe("prefix + c");
  });
});
