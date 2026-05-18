# Skill: Derive Pack From man

Use this as a reusable skill-style workflow for humans or AI agents when a tool is unfamiliar.

## Objective

Convert a `man` page (and optional `--help`) into a CmdCue pack that is intent-first, copy/paste friendly, and validated.

## Inputs

- Tool name: `<tool>`
- Primary source:
  - `man <tool>`
  - optional: `<tool> --help`
  - optional: official docs URL for version-specific behavior

## Workflow

1. Extract canonical facts from `man`.
   - Subcommands or major action groups.
   - Long/short flags.
   - Required parameters and value shapes.
   - Side effects for risk classification (`safe`, `readonly`, `destructive`).
2. Build an intent model.
   - Re-group facts by user intent, not by `man` section order.
   - Typical intent buckets: list/show, create/open, switch/select, edit/update, close/delete.
3. Draft operation files.
   - One operation per user intent.
   - Put natural queries under `intent.queries`.
   - Add bilingual verbs/objects when useful (`en` + `zh`).
4. Produce command templates.
   - Use `<placeholder>` for required user input.
   - Keep daily-use template first in `commands` so default paste is useful.
   - Keep lower-frequency combinations as secondary commands or notes.
5. Add shortcuts only when real.
   - Do not invent shortcuts.
   - For tmux-style prefixes, keep `prefix` and let CmdCue render `ctrl + b`.
6. Validate and fix.
   - `npm run sync-packs`
   - `npm run build`
   - `npm run validate-packs`
   - `npm test`
   - `npm run typecheck`

## Non-Goals

- Do not mirror the entire `man` output.
- Do not include every flag combination.
- Do not use concrete sample values where placeholders should be used.

## Prompt Template For Another Agent

```text
Read docs/pack-authoring.md first and follow it strictly.

Task: derive a CmdCue pack for <tool> from man/help sources.

Sources:
- man <tool>
- <tool> --help
- <optional official docs URL>

Requirements:
- Build intent-first operations, not man-section mirrors.
- Use YAML under packs/<tool>/pack.yaml and packs/<tool>/operations/*.yaml.
- Put full query aliases only under intent.queries.
- Use command templates with placeholders like <file>, <branch>, <pr-number>.
- Keep the best daily-use template as the first command in each operation.
- Use only risk values: safe, readonly, destructive.
- Do not invent aliases, flags, or shortcuts.
- If uncertain, mark with a note instead of guessing.
- Run npm run sync-packs, npm run build, npm run validate-packs, npm test, npm run typecheck.
```
