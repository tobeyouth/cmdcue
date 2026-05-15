import type { SearchResult } from "./types";
import { preferredCommandText } from "./display";
import { commandDescription, DEFAULT_LANGUAGE, operationTitle, shortcutDescription } from "./i18n";
import { shortcutKeys } from "./shortcut";

export function buildGroundedAnswerPrompt(question: string, results: SearchResult[], language = DEFAULT_LANGUAGE): string {
  const context = results
    .slice(0, 6)
    .map(({ operation }, index) => {
      const commands = operation.commands.map((command) => `- command: ${preferredCommandText(command)} (${commandDescription(command, language)}, risk=${command.risk})`).join("\n");
      const shortcuts = operation.shortcuts.map((shortcut) => `- shortcut: ${shortcutKeys(shortcut.keys)} (${shortcutDescription(shortcut, language)})`).join("\n");
      return [
        `Result ${index + 1}: ${operationTitle(operation, language)}`,
        `Tool: ${operation.tool}`,
        `Category: ${operation.category}`,
        commands,
        shortcuts,
        operation.notes?.length ? `Notes: ${operation.notes.join(" ")}` : undefined
      ]
        .filter(Boolean)
        .join("\n");
    })
    .join("\n\n");

  return [
    "Answer the developer's question using only the local operation results below.",
    "Be concise. Prefer exact commands or shortcuts. Mention destructive risk when relevant.",
    "If the local results do not answer the question, say that the local packs do not contain a confident match.",
    "",
    `Question: ${question}`,
    "",
    "Local operation results:",
    context || "No local results."
  ].join("\n");
}
