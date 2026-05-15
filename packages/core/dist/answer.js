"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildGroundedAnswerPrompt = buildGroundedAnswerPrompt;
const display_1 = require("./display");
const i18n_1 = require("./i18n");
const shortcut_1 = require("./shortcut");
function buildGroundedAnswerPrompt(question, results, language = i18n_1.DEFAULT_LANGUAGE) {
    const context = results
        .slice(0, 6)
        .map(({ operation }, index) => {
        const commands = operation.commands.map((command) => `- command: ${(0, display_1.preferredCommandText)(command)} (${(0, i18n_1.commandDescription)(command, language)}, risk=${command.risk})`).join("\n");
        const shortcuts = operation.shortcuts.map((shortcut) => `- shortcut: ${(0, shortcut_1.shortcutKeys)(shortcut.keys)} (${(0, i18n_1.shortcutDescription)(shortcut, language)})`).join("\n");
        return [
            `Result ${index + 1}: ${(0, i18n_1.operationTitle)(operation, language)}`,
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
