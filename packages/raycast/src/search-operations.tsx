import { Action, ActionPanel, Clipboard, Detail, Icon, List, showToast, Toast, environment } from "@raycast/api";
import { join } from "node:path";
import { useEffect, useMemo, useState } from "react";
import {
  commandDescription,
  historyOperations,
  loadConfig,
  loadHistory,
  loadOperations,
  operationTitle,
  prefersShortcut,
  preferredCommandText,
  primaryCommand as getPrimaryCommand,
  primaryShortcut as getPrimaryShortcut,
  recordHistoryResult,
  searchOperations,
  shortcutDescription,
  shortcutKeys,
  type HistoryEntry,
  type Operation
} from "@cmdcue/core";

function operationMarkdown(operation: Operation, language: string): string {
  const commands = operation.commands.length
    ? operation.commands.map((command) => `- \`${preferredCommandText(command)}\` - ${commandDescription(command, language)} (${command.risk})`).join("\n")
    : "- No command. Use the shortcut cue.";
  const shortcuts = operation.shortcuts.length
    ? operation.shortcuts.map((shortcut) => `- \`${shortcutKeys(shortcut.keys)}\` - ${shortcutDescription(shortcut, language)}`).join("\n")
    : "- No shortcut cue.";
  const notes = operation.notes?.length ? operation.notes.map((note) => `- ${note}`).join("\n") : "- None";

  return [`# ${operationTitle(operation, language)}`, `**Tool:** ${operation.tool}`, `**Category:** ${operation.category}`, "## Commands", commands, "## Shortcuts", shortcuts, "## Notes", notes]
    .filter(Boolean)
    .join("\n\n");
}

function OperationDetail({ operation, language }: { operation: Operation; language: string }) {
  return <Detail markdown={operationMarkdown(operation, language)} />;
}

function OperationActions({ operation, language, query }: { operation: Operation; language: string; query: string }) {
  const primaryCommand = getPrimaryCommand(operation, query);
  const primaryShortcut = getPrimaryShortcut(operation);
  const primaryCommandText = primaryCommand ? preferredCommandText(primaryCommand) : undefined;
  const primaryShortcutText = primaryShortcut ? shortcutKeys(primaryShortcut.keys) : undefined;
  const shortcutMode = prefersShortcut(query) && primaryShortcutText;

  return (
    <ActionPanel>
      {shortcutMode ? <Action.CopyToClipboard title="Copy Shortcut Hint" content={primaryShortcutText} icon={Icon.Keyboard} /> : null}
      {primaryCommandText ? <Action.Paste title="Paste Command" content={primaryCommandText} icon={Icon.Terminal} /> : null}
      {primaryCommandText ? <Action.CopyToClipboard title="Copy Command" content={primaryCommandText} shortcut={{ modifiers: ["cmd"], key: "c" }} /> : null}
      {primaryShortcutText && !shortcutMode ? <Action.CopyToClipboard title="Copy Shortcut Hint" content={primaryShortcutText} icon={Icon.Keyboard} /> : null}
      <Action.Push title="Show Details" target={<OperationDetail operation={operation} language={language} />} icon={Icon.Sidebar} />
      {primaryCommandText ? (
        <Action
          title="Paste Command via Clipboard API"
          icon={Icon.Clipboard}
          onAction={async () => {
            await Clipboard.paste(primaryCommandText);
            await showToast({ style: Toast.Style.Success, title: "Pasted command" });
          }}
        />
      ) : null}
    </ActionPanel>
  );
}

function OperationListItem({ operation, language, query }: { operation: Operation; language: string; query: string }) {
  const command = getPrimaryCommand(operation, query);
  const shortcut = getPrimaryShortcut(operation);
  const shortcutText = shortcut ? shortcutKeys(shortcut.keys) : "";
  const shortcutMode = prefersShortcut(query) && shortcutText;
  const label = shortcutMode ? shortcutText : preferredCommandText(command);

  return (
    <List.Item
      key={`${operation.id}:${query}`}
      title={label || shortcutText || operationTitle(operation, language)}
      subtitle={shortcutMode && shortcut ? shortcutDescription(shortcut, language) : command ? commandDescription(command, language) : operationTitle(operation, language)}
      accessories={[
        shortcutText ? { text: shortcutText } : {},
        command?.risk ? { text: command.risk } : {},
        { text: operation.category }
      ]}
      actions={<OperationActions operation={operation} language={language} query={query} />}
    />
  );
}

export default function Command() {
  const [query, setQuery] = useState("");
  const [history, setHistory] = useState<HistoryEntry[]>(() => loadHistory());
  const language = loadConfig().language;
  const operations = useMemo(() => loadOperations(join(environment.assetsPath, "packs")), []);
  const results = useMemo(() => searchOperations(query, operations), [query, operations]);
  const historyResults = useMemo(() => historyOperations(history, operations), [history, operations]);
  const listItems = useMemo(() => {
    if (query.trim()) return results.map(({ operation }) => ({ operation, query }));

    const historyItems = historyResults.map(({ entry, operation }) => ({ operation, query: entry.query }));
    const historyOperationIds = new Set(historyItems.map(({ operation }) => operation.id));
    const browseItems = results
      .filter(({ operation }) => !historyOperationIds.has(operation.id))
      .map(({ operation }) => ({ operation, query: "" }));
    return [...historyItems, ...browseItems];
  }, [historyResults, query, results]);

  useEffect(() => {
    if (!query.trim() || results.length === 0) return;
    const timeout = setTimeout(() => {
      try {
        setHistory(recordHistoryResult(query, results[0]?.operation, operations));
      } catch {
        // History is a convenience layer; search should keep working if the file cannot be written.
      }
    }, 500);
    return () => clearTimeout(timeout);
  }, [query, results, operations]);

  return (
    <List searchText={query} onSearchTextChange={setQuery} searchBarPlaceholder="Search: tmux window, tmux 关掉 window, vim quit..." throttle>
      {listItems.map(({ operation, query: itemQuery }) => (
        <OperationListItem key={`${operation.id}:${itemQuery}`} operation={operation} language={language} query={itemQuery} />
      ))}
    </List>
  );
}
