import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { afterEach, describe, expect, test } from "vitest";
import { loadHistory, recordHistoryResult } from "../src/history";
import type { Operation } from "../src/types";

const dirs: string[] = [];

afterEach(() => {
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true });
});

function tempHistoryPath(): string {
  const dir = mkdtempSync(join(tmpdir(), "cmdcue-history-"));
  dirs.push(dir);
  return join(dir, "history.yaml");
}

function operation(id: string, tool: string): Operation {
  return {
    id,
    tool,
    category: "general",
    title: id,
    intent: {
      verbs: ["show"],
      objects: ["thing"],
      queries: []
    },
    commands: [{ command: `${tool} show`, description: "Show thing", pasteable: true, risk: "safe" }],
    shortcuts: []
  };
}

const operations = [operation("tmux.window.new", "tmux"), operation("gh.pr.create", "gh"), operation("vim.quit.normal", "vim")];

describe("history", () => {
  test("records only queries that explicitly mention a known tool", () => {
    const path = tempHistoryPath();

    recordHistoryResult("window new", operations[0], operations, path);
    recordHistoryResult("tmux window new", operations[0], operations, path);

    expect(loadHistory(path)).toMatchObject([{ operationId: "tmux.window.new", query: "tmux window new" }]);
  });

  test("keeps the most recent 10 entries in reverse chronological order", () => {
    const path = tempHistoryPath();

    for (let index = 0; index < 12; index += 1) {
      recordHistoryResult(`tmux query ${index}`, operations[0], operations, path);
    }

    const history = loadHistory(path);
    expect(history).toHaveLength(10);
    expect(history[0].query).toBe("tmux query 11");
    expect(history[9].query).toBe("tmux query 2");
  });

  test("moves repeated operation and query pairs to the top", () => {
    const path = tempHistoryPath();

    recordHistoryResult("tmux window", operations[0], operations, path);
    recordHistoryResult("gh pr create", operations[1], operations, path);
    recordHistoryResult("tmux window", operations[0], operations, path);

    expect(loadHistory(path).map((entry) => entry.query)).toEqual(["tmux window", "gh pr create"]);
  });
});
