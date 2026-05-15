import type { CommandCue, Operation, ShortcutCue } from "./types";

export const DEFAULT_LANGUAGE = "en";
export const LANGUAGE_STORAGE_KEY = "cmdcue.language";

export function operationTitle(operation: Operation, language = DEFAULT_LANGUAGE): string {
  return operation.i18n?.[language]?.title ?? (language === "zh" ? operation.zh : undefined) ?? operation.title;
}

export function commandDescription(command: CommandCue, language = DEFAULT_LANGUAGE): string {
  return command.i18n?.[language]?.description ?? command.description;
}

export function shortcutDescription(shortcut: ShortcutCue, language = DEFAULT_LANGUAGE): string {
  return shortcut.i18n?.[language]?.description ?? shortcut.description;
}
