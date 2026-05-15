import type { CommandCue, Operation } from "./types";

export function primaryCommand(operation: Operation): CommandCue | undefined {
  return operation.commands[0];
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
