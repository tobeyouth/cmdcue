import type { CommandCue, Operation, ShortcutCue } from "./types";
import { expandQuery, normalizeToken, tokenize } from "./synonyms";

const shortcutQueryTerms = new Set(["shortcut", "shortcuts", "key", "keys", "keybinding", "keybindings", "hotkey", "hotkeys", "prefix", "快捷键", "热键"]);

function commandSearchText(command: CommandCue): string {
  return [
    command.command,
    command.preferredCommand,
    command.description,
    ...Object.values(command.i18n ?? {}).map((entry) => entry.description)
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function commandIntentTokens(command: CommandCue): Set<string> {
  return new Set(tokenize(commandSearchText(command)).map(normalizeToken));
}

function commandScore(command: CommandCue, query: string): number {
  const queryTokens = expandQuery(query);
  if (queryTokens.length === 0) return 0;

  const commandLine = preferredCommandText(command).toLowerCase();
  const text = commandSearchText(command);
  const intentTokens = commandIntentTokens(command);
  let score = 0;

  const shortFlagAliases: Array<[RegExp, string]> = [
    [/(^|\s)-B(\s|$)/, "--base"],
    [/(^|\s)-H(\s|$)/, "--head"],
    [/(^|\s)-r(\s|$)/, "--reviewer"],
    [/(^|\s)-a(\s|$)/, "--assignee"],
    [/(^|\s)-l(\s|$)/, "--label"]
  ];
  for (const [pattern, longFlag] of shortFlagAliases) {
    if (pattern.test(query) && commandLine.includes(longFlag)) score += 20;
  }

  return queryTokens.reduce((currentScore, token) => {
    if (commandLine.includes(`--${token}`) || commandLine.includes(`<${token}`)) return currentScore + 10;
    if (commandLine.includes(token)) return currentScore + 6;
    if (intentTokens.has(token)) return currentScore + 4;
    if (text.includes(token)) return currentScore + 1;
    return currentScore;
  }, score);
}

export function primaryCommand(operation: Operation, query?: string): CommandCue | undefined {
  const fallback = operation.commands[0];
  if (!query?.trim() || operation.commands.length < 2) return fallback;

  const [best] = operation.commands
    .map((command, index) => ({ command, index, score: commandScore(command, query) }))
    .sort((left, right) => right.score - left.score || left.index - right.index);

  return best && best.score > 0 ? best.command : fallback;
}

export function prefersShortcut(query?: string): boolean {
  if (!query?.trim()) return false;
  const lowered = query.toLowerCase();
  if (lowered.includes("ctrl+b") || lowered.includes("ctrl + b")) return true;
  return tokenize(query).some((token) => shortcutQueryTerms.has(token));
}

export function primaryShortcut(operation: Operation): ShortcutCue | undefined {
  return operation.shortcuts[0];
}

export function preferredCommandText(command: CommandCue | undefined): string {
  if (!command) return "";
  return command.preferredCommand ?? command.command;
}

export function keywordLabel(operation: Operation, maxItems = 5): string {
  const keywords = [...operation.intent.verbs, ...operation.intent.objects]
    .map((keyword) => keyword.trim())
    .filter(Boolean);
  return [...new Set(keywords)].slice(0, maxItems).join(" / ");
}
