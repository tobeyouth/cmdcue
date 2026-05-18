import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { parse as parseYaml, stringify as stringifyYaml } from "yaml";
import { configPath } from "./config";
import { tokenize } from "./synonyms";
import type { Operation } from "./types";

const HISTORY_LIMIT = 10;

export type HistoryEntry = {
  operationId: string;
  query: string;
  updatedAt: string;
};

export function historyPath(): string {
  return process.env.CMDCUE_HISTORY || join(dirname(configPath()), "history.yaml");
}

function normalizeHistory(value: unknown): HistoryEntry[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((entry): entry is Partial<HistoryEntry> => typeof entry === "object" && entry !== null)
    .filter((entry) => typeof entry.operationId === "string" && typeof entry.query === "string")
    .map((entry) => ({
      operationId: entry.operationId ?? "",
      query: entry.query ?? "",
      updatedAt: typeof entry.updatedAt === "string" ? entry.updatedAt : new Date(0).toISOString()
    }))
    .filter((entry) => entry.operationId.trim() && entry.query.trim());
}

export function loadHistory(path = historyPath()): HistoryEntry[] {
  if (!existsSync(path)) return [];
  try {
    return normalizeHistory(parseYaml(readFileSync(path, "utf8")));
  } catch {
    return [];
  }
}

export function saveHistory(history: HistoryEntry[], path = historyPath()): HistoryEntry[] {
  const normalized = normalizeHistory(history).slice(0, HISTORY_LIMIT);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, stringifyYaml(normalized), { mode: 0o600 });
  return normalized;
}

export function queryMentionsKnownTool(query: string, operations: Operation[]): boolean {
  const tokens = new Set(tokenize(query));
  if (tokens.size === 0) return false;
  return operations.some((operation) => tokens.has(operation.tool.toLowerCase()));
}

export function recordHistoryResult(query: string, operation: Operation | undefined, operations: Operation[], path = historyPath()): HistoryEntry[] {
  const normalizedQuery = query.trim();
  if (!operation || !normalizedQuery || !queryMentionsKnownTool(normalizedQuery, operations)) return loadHistory(path);

  const entry: HistoryEntry = {
    operationId: operation.id,
    query: normalizedQuery,
    updatedAt: new Date().toISOString()
  };
  const current = loadHistory(path);
  const next = [entry, ...current.filter((candidate) => candidate.operationId !== entry.operationId || candidate.query !== entry.query)];
  return saveHistory(next, path);
}

export function historyOperations(history: HistoryEntry[], operations: Operation[]): Array<{ entry: HistoryEntry; operation: Operation }> {
  return history
    .map((entry) => {
      const operation = operations.find((candidate) => candidate.id === entry.operationId);
      return operation ? { entry, operation } : undefined;
    })
    .filter((item): item is { entry: HistoryEntry; operation: Operation } => Boolean(item));
}
