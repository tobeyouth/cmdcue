import type { CommandCue, Operation, ShortcutCue } from "./types";
export declare const DEFAULT_LANGUAGE = "en";
export declare const LANGUAGE_STORAGE_KEY = "cmdcue.language";
export declare function operationTitle(operation: Operation, language?: string): string;
export declare function commandDescription(command: CommandCue, language?: string): string;
export declare function shortcutDescription(shortcut: ShortcutCue, language?: string): string;
