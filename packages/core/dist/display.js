"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.primaryCommand = primaryCommand;
exports.preferredCommandText = preferredCommandText;
exports.keywordLabel = keywordLabel;
function primaryCommand(operation) {
    return operation.commands[0];
}
function preferredCommandText(command) {
    if (!command)
        return "";
    return command.preferredCommand ?? command.command;
}
function keywordLabel(operation, maxItems = 5) {
    const keywords = [...operation.intent.verbs, ...operation.intent.objects]
        .map((keyword) => keyword.trim())
        .filter(Boolean);
    return [...new Set(keywords)].slice(0, maxItems).join(" / ");
}
