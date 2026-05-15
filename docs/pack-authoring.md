# CmdCue Pack Authoring Guide

This guide is written for both humans and AI agents. Follow it when creating or expanding a CmdCue pack.

## Goal

CmdCue is not a man-page mirror. A pack should answer:

> "I know what I want to do, but I forgot the command or shortcut."

Write operations around user intent, not around documentation order.

## Directory Shape

Each tool gets one directory:

```text
packs/<tool>/
  pack.yaml
  operations/
    session.yaml
    window.yaml
    pane.yaml
```

Use category files that match how users think about the tool. For `tmux`, good categories are `session`, `window`, `pane`, `copy-mode`, `layout`, `buffer`, `key-binding`.

## Source Quality

Use primary or reliable sources before writing data:

- Official man page, `--help`, or project documentation.
- Existing local command output, such as `man tmux`, `tmux list-commands`, or `git help`.
- Avoid guessing command aliases, shortcut keys, risks, or behavior.

If a command is version-sensitive, add a note.

## `pack.yaml`

```yaml
id: tmux
name: tmux
aliases:
  - terminal multiplexer
  - 终端复用
description: Terminal multiplexer operations and shortcuts
```

Rules:

- `id` should be lowercase and stable.
- `aliases` are search hints for tool-level names.
- Keep description short.

## Operation Format

Each operation is one user intent.

```yaml
- id: tmux.session.new-named
  tool: tmux
  category: session
  title: Create a named session
  i18n:
    zh:
      title: 创建一个命名 tmux session
  intent:
    verbs: [new, create, start, 新建, 创建, 启动]
    objects: [session, 会话]
    queries:
      - tmux new session
      - tmux create session
      - 新建 tmux session
  shortcuts: []
  commands:
    - command: tmux new-session -s <session-name>
      preferredCommand: tmux new -s <session-name>
      description: Create and attach to a new named session
      i18n:
        zh:
          description: 创建并进入一个命名 session
      pasteable: true
      risk: safe
  notes:
    - Replace <session-name> before running.
```

## Field Rules

`id`
: Use `<tool>.<category>.<action>`. Keep it stable.

`tool`
: Must match `pack.yaml` `id`.

`category`
: Use the filename concept, such as `session`, `window`, `pane`.

`title`
: English operation title. Keep it action-oriented.

`i18n`
: Optional localized title and descriptions. English is the default language.

`intent.verbs`
: Action words users may type. Include English and Chinese synonyms when useful.

`intent.objects`
: Objects users may type. Include domain terms and common translations.

`intent.queries`
: Full natural queries worth matching exactly. Include likely user phrases.

`commands`
: Shell or command-mode text that can be copied and pasted.

`shortcuts`
: Human key hints. Shortcuts are copied as hints, not executed.

`notes`
: Short warnings or context.

## Command Rules

Every command entry has:

```yaml
- command: tmux new-session -s <session-name>
  preferredCommand: tmux new -s <session-name>
  description: Create and attach to a new named session
  pasteable: true
  risk: safe
```

Rules:

- `command` is the full canonical command.
- `preferredCommand` is the text CmdCue shows, copies, and pastes.
- Use `preferredCommand` for official aliases or clearer daily-use forms.
- Do not invent aliases. Verify them from official docs or command help.
- Template parameters must use angle brackets: `<session-name>`, `<new-name>`, `<file>`.
- Template commands should still be `pasteable: true`; placeholders help users edit after paste.
- Keep descriptions short and imperative.

## Parameter Templates

Commands should be copyable templates, not concrete examples. If the user must provide a value, put the value directly in the command with a lowercase kebab-case placeholder.

Good:

```yaml
- command: gh pr create --title "<title>" --body "<body>"
  description: Create PR with specified title and body
  pasteable: true
  risk: safe

- command: gh pr view <pr-number>
  description: View a specific PR by number
  pasteable: true
  risk: readonly

- command: gh repo clone <owner>/<repo>
  description: Clone a repository
  pasteable: true
  risk: safe
```

Bad:

```yaml
- command: gh pr create --title "Title" --body "Description"
- command: gh pr view 21
- command: gh repo clone owner/repo
```

Rules:

- Use `<parameter-name>` for required user input.
- Use lowercase kebab-case inside placeholders: `<pr-number>`, `<base-branch>`, `<owner>/<repo>`.
- Keep shell quoting around placeholders when the value may contain spaces: `--title "<title>"`, `--body "<body>"`.
- For repeated flags, repeat placeholders: `--label <label> --label <label>`.
- For pass-through arguments, keep the real separator and placeholder only the user input: `gh repo clone <owner>/<repo> -- --depth <depth>`.
- Literal enum values may stay literal when the operation is specifically about that value, such as `--state closed` or `--public`.
- Do not use fake example values such as `my-repo`, `owner/repo`, `21`, `main`, `bug`, or `"LGTM"` unless the literal value is truly what should be pasted.
- If a command contains any placeholder, set `pasteable: true`.
- If an official short alias exists, put the copied template in `preferredCommand` too.

Risk values:

- `safe`: creates, switches, views, or edits non-destructively.
- `readonly`: only reads or lists information.
- `destructive`: closes, kills, deletes, overwrites, or discards data.

## Shortcut Rules

```yaml
shortcuts:
  - keys: prefix + c
    description: Create a new window interactively
    i18n:
      zh:
        description: 交互式创建新的 window
```

Rules:

- Use `prefix` for tmux prefix shortcuts. CmdCue renders it as `ctrl + b`.
- Do not encode terminal control characters in commands.
- If a shortcut is only meaningful inside a mode, say so in description.
- Keep shortcuts as hints even when a command alternative exists.

## I18n Rules

English fields are the default:

- `title`
- `command.description`
- `shortcut.description`

Localized fields live under `i18n.<language>`:

```yaml
i18n:
  zh:
    title: 创建新的 tmux window
```

```yaml
description: Create a new window in the current session
i18n:
  zh:
    description: 在当前 session 中创建新的 window
```

Add localized descriptions when the English description is not enough for the target audience. Do not machine-translate blindly; keep technical terms recognizable.

## Search Quality Checklist

For each operation, include search terms for two user modes:

- User knows the category: `tmux session`, `tmux window`, `vim quit`.
- User knows the intent: `tmux 关掉 window`, `vim 不保存退出`, `docker 查看 logs`.

Add:

- English verbs.
- Chinese verbs when likely.
- Tool-native terms.
- Common mistaken terms if they help retrieval.

## Pack Completion Checklist

Before considering a category complete:

- Cover list/show operations.
- Cover create/open operations.
- Cover switch/select/navigation operations.
- Cover rename/edit operations when relevant.
- Cover close/delete/kill operations and mark destructive risk.
- Cover common shortcuts.
- Include parameter placeholders for commands that need values.
- Include at least one exact query for the category and one for each major intent.
- Verify commands and aliases against primary docs.
- Run:

```bash
npm run sync-packs
npm run build
npm run validate-packs
npm test
npm run typecheck
```

## Pack Validation

CmdCue includes a strict pack schema validator. It checks raw pack files before loader compatibility fixes are applied, so it catches mistakes that may otherwise be hidden at runtime.

Run it after editing or generating packs:

```bash
npm run build
npm run validate-packs
```

To validate a custom pack directory:

```bash
cmdcue validate-packs path/to/packs
```

The validator rejects common AI-generated mistakes, including:

- `queries` placed beside `intent` instead of under `intent.queries`.
- Placeholder syntax that is not `<lowercase-kebab-case>`.
- Template commands with placeholders where `pasteable` is not `true`.
- Missing required fields such as `id`, `tool`, `category`, `title`, `intent`, `commands`, or `shortcuts`.
- Non-array `intent.verbs`, `intent.objects`, or `intent.queries`.
- Invalid command `risk` values. Use only `safe`, `readonly`, or `destructive`.
- Command entries missing `command`, `description`, `pasteable`, or `risk`.
- Shortcut entries missing `keys` or `description`.
- Operation `tool` values that do not match `pack.yaml` `id`.

For AI-generated packs, treat validation failure as a required fix before handing the pack back.

## Prompt For AI Pack Generation

Use this prompt when asking an AI to generate or expand a pack:

```text
Read docs/pack-authoring.md first and follow it exactly.

Create or expand the CmdCue pack for <tool>.

Requirements:
- Use YAML files under packs/<tool>/.
- Group operations by user-facing category.
- Use primary documentation or command help as the source.
- Model user intents, not man-page sections.
- Put full query aliases under intent.queries, not at the top level of an operation.
- Include command, preferredCommand, description, pasteable, and risk.
- Commands must be copyable templates with placeholders for user input, not concrete examples.
- Use only these risk values: safe, readonly, destructive.
- Use <parameter-name> placeholders for required arguments.
- Include shortcuts when relevant.
- Add i18n.zh title and descriptions for common operations.
- Include English and Chinese search terms in intent fields.
- Do not invent aliases or shortcuts.
- Run npm run sync-packs, npm run build, npm run validate-packs, npm test, and npm run typecheck.
```
