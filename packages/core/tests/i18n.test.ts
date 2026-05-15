import { describe, expect, test } from "vitest";
import { commandDescription, operationTitle } from "../src/i18n";
import type { Operation } from "../src/types";

const operation: Operation = {
  id: "tmux.window.new",
  tool: "tmux",
  category: "window",
  title: "Create a new window",
  i18n: {
    zh: {
      title: "创建新的 tmux window"
    }
  },
  intent: {
    verbs: ["new"],
    objects: ["window"],
    queries: ["tmux 新建 window"]
  },
  shortcuts: [],
  commands: [
    {
      command: "tmux new-window",
      preferredCommand: "tmux neww",
      description: "Create a new window in the current session",
      i18n: {
        zh: {
          description: "在当前 session 中创建新的 window"
        }
      },
      pasteable: true,
      risk: "safe"
    }
  ]
};

describe("i18n helpers", () => {
  test("defaults to English text", () => {
    expect(operationTitle(operation)).toBe("Create a new window");
    expect(commandDescription(operation.commands[0])).toBe("Create a new window in the current session");
  });

  test("uses configured language text when present", () => {
    expect(operationTitle(operation, "zh")).toBe("创建新的 tmux window");
    expect(commandDescription(operation.commands[0], "zh")).toBe("在当前 session 中创建新的 window");
  });
});
