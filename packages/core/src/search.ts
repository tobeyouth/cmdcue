import type { Operation, SearchResult } from "./types";
import { expandQuery, normalizeToken, tokenize } from "./synonyms";

function intentQueries(operation: Operation): string[] {
  return Array.isArray(operation.intent.queries) ? operation.intent.queries : [];
}

function operationSearchText(operation: Operation): string {
  return [
    operation.id,
    operation.tool,
    operation.category,
    operation.title,
    operation.zh,
    ...operation.intent.verbs,
    ...operation.intent.objects,
    ...intentQueries(operation),
    ...operation.commands.map((command) => `${command.command} ${command.description}`),
    ...operation.shortcuts.map((shortcut) => `${shortcut.keys} ${shortcut.description}`),
    ...(operation.notes ?? [])
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function normalizedIntentTokens(operation: Operation): Set<string> {
  const tokens = [
    operation.tool,
    operation.category,
    ...operation.intent.verbs,
    ...operation.intent.objects,
    ...intentQueries(operation).flatMap(tokenize)
  ];
  return new Set(tokens.map(normalizeToken));
}

function scoreOperation(query: string, operation: Operation): SearchResult | null {
  const rawTokens = tokenize(query);
  const queryTokens = expandQuery(query);
  const text = operationSearchText(operation);
  const intentTokens = normalizedIntentTokens(operation);
  const reasons: string[] = [];
  let score = 0;

  for (const token of rawTokens) {
    if (operation.tool.toLowerCase() === token) {
      score += 25;
      reasons.push(`tool:${token}`);
    }
    if (operation.category.toLowerCase() === token) {
      score += 18;
      reasons.push(`category:${token}`);
    }
  }

  for (const token of queryTokens) {
    if (intentTokens.has(token)) {
      score += 12;
      reasons.push(`intent:${token}`);
    } else if (text.includes(token)) {
      score += 4;
      reasons.push(`text:${token}`);
    }
  }

  const loweredQuery = query.toLowerCase().trim();
  if (intentQueries(operation).some((candidate) => candidate.toLowerCase() === loweredQuery)) {
    score += 35;
    reasons.push("query-alias:exact");
  }

  if (score === 0) return null;
  return { operation, score, reasons: [...new Set(reasons)] };
}

export function searchOperations(query: string, operations: Operation[], limit = 20): SearchResult[] {
  if (!query.trim()) {
    return operations.slice(0, limit).map((operation) => ({ operation, score: 0, reasons: ["browse"] }));
  }

  const rawTokens = tokenize(query);
  const knownTools = new Set(operations.map((operation) => operation.tool.toLowerCase()));
  const explicitTools = rawTokens.filter((token) => knownTools.has(token));
  const toolFilteredOperations =
    explicitTools.length > 0 ? operations.filter((operation) => explicitTools.includes(operation.tool.toLowerCase())) : operations;
  const knownCategories = new Set(toolFilteredOperations.map((operation) => operation.category.toLowerCase()));
  const explicitCategories = rawTokens.filter((token) => knownCategories.has(token));
  const candidateOperations =
    explicitCategories.length > 0
      ? toolFilteredOperations.filter((operation) => explicitCategories.includes(operation.category.toLowerCase()))
      : toolFilteredOperations;
  const hasIntentTerms = rawTokens.some((token) => !explicitTools.includes(token));

  return candidateOperations
    .map((operation) => scoreOperation(query, operation))
    .filter((result): result is SearchResult => result !== null)
    .filter((result) => {
      if (explicitTools.length === 0 || !hasIntentTerms) return true;
      return result.reasons.some((reason) => {
        if (reason.startsWith("tool:")) return false;
        return !explicitTools.some((tool) => reason === `intent:${tool}` || reason === `text:${tool}`);
      });
    })
    .sort((left, right) => right.score - left.score || left.operation.title.localeCompare(right.operation.title))
    .slice(0, limit);
}
