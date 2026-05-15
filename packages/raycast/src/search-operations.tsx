import { Action, ActionPanel, Clipboard, Detail, Icon, List, showToast, Toast, environment } from "@raycast/api";
import { join } from "node:path";
import { useMemo, useState } from "react";
import {
  commandDescription,
  loadConfig,
  loadOperations,
  operationTitle,
  preferredCommandText,
  primaryCommand as getPrimaryCommand,
  searchOperations,
  shortcutDescription,
  shortcutKeys,
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

function OperationActions({ operation, language }: { operation: Operation; language: string }) {
  const primaryCommand = getPrimaryCommand(operation);
  const primaryShortcut = operation.shortcuts[0];
  const primaryCommandText = primaryCommand ? preferredCommandText(primaryCommand) : undefined;

  return (
    <ActionPanel>
      {primaryCommandText ? <Action.Paste title="Paste Command" content={primaryCommandText} icon={Icon.Terminal} /> : null}
      {primaryCommandText ? <Action.CopyToClipboard title="Copy Command" content={primaryCommandText} shortcut={{ modifiers: ["cmd"], key: "c" }} /> : null}
      {primaryShortcut ? <Action.CopyToClipboard title="Copy Shortcut Hint" content={shortcutKeys(primaryShortcut.keys)} icon={Icon.Keyboard} /> : null}
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

export default function Command() {
  const [query, setQuery] = useState("");
  const language = loadConfig().language;
  const operations = useMemo(() => loadOperations(join(environment.assetsPath, "packs")), []);
  const results = useMemo(() => searchOperations(query, operations), [query, operations]);

  return (
    <List searchText={query} onSearchTextChange={setQuery} searchBarPlaceholder="Search: tmux window, tmux 关掉 window, vim quit..." throttle>
      {results.map(({ operation }) => {
        const command = getPrimaryCommand(operation);
        const label = preferredCommandText(command);
        const shortcut = operation.shortcuts[0]?.keys;
        return (
          <List.Item
            key={operation.id}
            title={label || shortcutKeys(shortcut ?? "") || operationTitle(operation, language)}
            subtitle={command ? commandDescription(command, language) : operationTitle(operation, language)}
            accessories={[
              { text: operation.category },
              command?.risk ? { text: command.risk } : shortcut ? { text: shortcutKeys(shortcut) } : {}
            ]}
            actions={<OperationActions operation={operation} language={language} />}
          />
        );
      })}
    </List>
  );
}
