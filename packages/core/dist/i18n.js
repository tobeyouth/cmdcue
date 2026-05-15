"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LANGUAGE_STORAGE_KEY = exports.DEFAULT_LANGUAGE = void 0;
exports.operationTitle = operationTitle;
exports.commandDescription = commandDescription;
exports.shortcutDescription = shortcutDescription;
exports.DEFAULT_LANGUAGE = "en";
exports.LANGUAGE_STORAGE_KEY = "cmdcue.language";
function operationTitle(operation, language = exports.DEFAULT_LANGUAGE) {
    return operation.i18n?.[language]?.title ?? (language === "zh" ? operation.zh : undefined) ?? operation.title;
}
function commandDescription(command, language = exports.DEFAULT_LANGUAGE) {
    return command.i18n?.[language]?.description ?? command.description;
}
function shortcutDescription(shortcut, language = exports.DEFAULT_LANGUAGE) {
    return shortcut.i18n?.[language]?.description ?? shortcut.description;
}
