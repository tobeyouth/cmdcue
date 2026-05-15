import { describe, expect, test } from "vitest";
import { searchOperations } from "../src/search";
import type { Operation } from "../src/types";

const operations: Operation[] = [
  {
    id: "tmux.window.close-current",
    tool: "tmux",
    category: "window",
    title: "Close current window",
    zh: "关闭当前 tmux window",
    intent: {
      verbs: ["close", "kill", "delete", "关掉", "关闭"],
      objects: ["window", "窗口"],
      queries: ["tmux close window", "tmux 关掉 window"]
    },
    commands: [{ command: "tmux kill-window", description: "Kill the current window", pasteable: true, risk: "destructive" }],
    shortcuts: [{ keys: "prefix + &", description: "Prompt before killing current window" }]
  },
  {
    id: "vim.quit.force",
    tool: "vim",
    category: "quit",
    title: "Quit without saving",
    zh: "不保存退出 Vim",
    intent: {
      verbs: ["quit", "exit", "close", "退出", "关掉"],
      objects: ["vim", "editor", "编辑器"],
      queries: ["vim quit without saving", "如何关掉 vim"]
    },
    commands: [{ command: ":q!", description: "Quit without saving changes", pasteable: true, risk: "destructive" }],
    shortcuts: [{ keys: "Esc then :q!", description: "Leave insert mode, then force quit" }]
  }
];

describe("searchOperations", () => {
  test("ranks direct tool and category intent matches first", () => {
    const results = searchOperations("tmux window", operations);
    expect(results[0]?.operation.id).toBe("tmux.window.close-current");
  });

  test("matches Chinese intent aliases against English operation metadata", () => {
    const results = searchOperations("tmux 关掉 window", operations);
    expect(results[0]?.operation.id).toBe("tmux.window.close-current");
  });

  test("filters to the explicitly mentioned tool", () => {
    const results = searchOperations("tmux 关掉 window", operations);
    expect(results.map((result) => result.operation.tool)).toEqual(["tmux"]);
  });

  test("answers natural language tool questions from query aliases", () => {
    const results = searchOperations("如何关掉 vim", operations);
    expect(results[0]?.operation.id).toBe("vim.quit.force");
  });

  test("excludes results that only match the explicit tool when the query has intent terms", () => {
    const richerOperations: Operation[] = [
      ...operations,
      {
        id: "vim.movement.word-forward",
        tool: "vim",
        category: "movement",
        title: "Move forward by word",
        zh: "按单词向前移动",
        intent: {
          verbs: ["move", "jump", "移动"],
          objects: ["word", "单词"],
          queries: ["vim move word"]
        },
        commands: [],
        shortcuts: [{ keys: "w", description: "Move to the next word" }]
      }
    ];

    const results = searchOperations("如何关掉 vim", richerOperations);
    expect(results.map((result) => result.operation.id)).not.toContain("vim.movement.word-forward");
  });
}
);
