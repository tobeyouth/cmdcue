"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.shortcutKeys = shortcutKeys;
function shortcutKeys(keys) {
    return keys.replace(/\bprefix\b/gi, "ctrl + b");
}
