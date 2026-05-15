import { describe, expect, test } from "vitest";
import { keywordLabel, preferredCommandText, primaryCommand } from "../src/display";
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
});
