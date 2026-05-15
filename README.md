# CmdCue

CmdCue is a local-first developer operation lookup tool. Instead of mirroring raw docs, it indexes operations by user intent, so queries like `tmux session`, `tmux 关掉 window`, or `如何关掉 vim` resolve to practical commands and shortcuts quickly.

CmdCue is CLI-first. Raycast is a UI adapter on top of the same core and config.

## Prerequisites

- `Node.js` 20+ (22+ recommended)
- `npm` 10+
- `Raycast` (only required if you use the Raycast extension)

## Monorepo Layout

```text
cmdcue/
  packages/
    core/
      src/              # Search, config, i18n, AI client, pack loader
      packs/            # Editable source packs
      tests/
    cli/
      src/cli.ts        # cmdcue terminal entrypoint
    raycast/
      src/              # Raycast commands
      assets/packs/     # Synced pack copy for Raycast runtime
  docs/
    pack-authoring.md
```

## Quick Start

```bash
npm install --cache .npm-cache
npm run sync-packs
npm run build
```

Run CLI directly:

```bash
node packages/cli/dist/cli.js tmux session
node packages/cli/dist/cli.js ask 如何关掉 vim
node packages/cli/dist/cli.js config
```

Link CLI globally on your machine:

```bash
npm link -w @cmdcue/cli
cmdcue tmux session
cmdcue language
```

Run Raycast extension in dev mode:

```bash
npm run dev
```

## Shared Config

CLI and Raycast both use the same file:

```text
~/.config/cmdcue/config.yaml
```

Override config path:

```bash
CMDCUE_CONFIG=/path/to/config.yaml cmdcue config
```

## CLI Commands

```bash
cmdcue <query>
cmdcue ask <question>
cmdcue config
cmdcue language
cmdcue language set <en|zh>
cmdcue ai
cmdcue ai set --enabled true|false --base-url <url> --api-key <key> --model <model> --temperature <n> --max-tokens <n>
cmdcue validate-packs [packs-dir]
```

Examples:

```bash
cmdcue tmux window
cmdcue tmux 关掉 session
cmdcue ask tmux 新建 window
cmdcue language set zh
cmdcue ai set --enabled true --base-url https://api.openai.com/v1 --api-key <key> --model gpt-4o-mini
cmdcue validate-packs packages/core/packs
```

## Raycast Commands

- `Search Operations`: search local operations, then paste/copy primary command or shortcut hints.
- `Ask Operations`: local-first answer view with optional AI fallback.
- `Settings`: two branches:
- `Language`: switch default display language.
- `AI Provider`: configure optional OpenAI-compatible provider.

AI is optional. If not configured, Ask still works with local results and a grounding prompt.

## Pack Workflow

Editable packs live under `packages/core/packs/`.

After pack edits:

```bash
npm run sync-packs
npm run build
npm run validate-packs
```

This syncs into `packages/raycast/assets/packs/` for Raycast runtime.

Each tool uses:

```text
packages/core/packs/<tool>/pack.yaml
packages/core/packs/<tool>/operations/*.yaml
```

`npm run validate-packs` checks raw YAML structure and catches common schema mistakes before Raycast or the CLI load the data.

For full schema, validation rules, and AI-agent pack generation guidance, see [docs/pack-authoring.md](docs/pack-authoring.md).

## Development

```bash
npm test
npm run typecheck
npm run build
npm run lint
```

Current built-in packs include `tmux` and `vim`. Extend by adding new tool directories under `packages/core/packs/`.

## Notes For Store Readiness

- Replace `author` in `packages/raycast/package.json` with your Raycast username.
- Keep `publish` script out for now (intentionally deferred).
