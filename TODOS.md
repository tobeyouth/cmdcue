# CmdCue TODOs

CmdCue is already past the MVP shape: it has a CLI-first architecture, shared config, Raycast entrypoints, YAML packs, pack validation, i18n, and optional AI fallback. The next work should focus on making the product dependable enough for daily use and easy enough for other people or agents to extend.

## P0: Make Pack Output Trustworthy

- Expand and verify the `gh` pack against official `gh help` / GitHub CLI manual.
  - Prioritize `gh pr create`, `gh pr list`, `gh pr view`, `gh pr checkout`, `gh pr merge`, `gh repo create`, `gh repo clone`, and `gh auth`.
  - Add common option templates such as `--base <base-branch>`, `--head <head-branch>`, `--reviewer <user-or-team>`, `--assignee <user>`, `--label <label>`, `--project "<project-title>"`, and `--web`.
  - Keep the first command in each operation as the best default paste template.
  - Keep less common flags in secondary commands or notes, not in the primary list row.
- Add a pack quality checklist test for primary command selection.
  - Operations with a clearly parameterized daily-use form should not put a bare interactive command first.
  - Commands with placeholders must remain `pasteable: true`.
  - Placeholder names should stay lowercase kebab-case.
- Add source references per operation or per category.
  - Keep a `source` field or comments pointing to official docs/man/help output.
  - Make AI-generated packs auditable instead of opaque.
- Fill out high-value built-in packs.
  - `git`: branch, commit, stash, remote, rebase, log, diff.
  - `docker`: container, image, compose, logs, exec, cleanup.
  - `kubectl`: context, pods, logs, exec, rollout, scale, describe.
  - `npm` / `pnpm`: install, run, workspace, outdated, publish checks.
  - `ssh` / `rsync`: common connection, port, identity, copy templates.

## P0: Improve Search Quality

- Improve ranking for intent queries.
  - Exact `intent.queries` matches should strongly beat generic text matches.
  - Queries with explicit tool and category, such as `gh pr create base`, should surface the most relevant option-bearing operation first.
- Add option-aware matching.
  - Index command flags such as `--base`, `-B`, `--head`, `--reviewer`.
  - Let natural language like `target branch`, `base branch`, `reviewer`, or `draft` match commands that contain the relevant options.
- Add query regression tests for real workflows.
  - `gh pr create base branch`
  - `gh pr create reviewer`
  - `tmux kill session`
  - `vim quit without saving`
  - `docker logs follow`
- Consider separating operation ranking from command ranking.
  - First choose the best operation.
  - Then choose the best command within that operation based on query terms.
  - This would fix cases where the operation is correct but the primary command is not specific enough.

## P1: Make Command Options First-Class

- Consider adding an optional `options` field to the pack schema.
  - Example fields: `flag`, `alias`, `placeholder`, `description`, `i18n`, `risk`, `repeatable`.
  - This can support richer detail views without bloating search rows.
- Generate command templates from selected options in the future.
  - Raycast could let users pick common flags and paste the assembled command.
  - CLI could support an interactive mode later.
- Keep the current `commands` array as the stable baseline.
  - Do not block pack authoring on a more complex schema.
  - Use `commands + notes` until option composition has a clear UX.

## P1: Raycast Experience

- Improve the search result detail view.
  - Show primary command, secondary command templates, shortcuts, notes, risk, and source.
  - Make it obvious which command will be pasted by the default action.
- Add actions for secondary commands.
  - Paste/copy any command in an operation, not only the primary command.
  - Keep the list row compact, but make the detail/actions complete.
- Add a source/open-doc action when `source` is available.
- Improve empty states.
  - If local search has no result and AI is not configured, offer links/actions to Settings and pack authoring docs.
  - Keep AI optional; do not make the user feel blocked.
- Add a "Copy Query Prompt" action in Ask mode.
  - Useful when AI is not configured locally but the user wants to paste the grounded prompt elsewhere.

## P1: CLI Experience

- Add structured output modes.
  - `cmdcue search <query> --json`
  - `cmdcue ask <question> --json`
  - Useful for scripts and future integrations.
- Add a `cmdcue doctor` command.
  - Check config path, pack path, pack validation, Raycast asset sync, Node version, and CLI build state.
- Add a command-specific detail view.
  - Example: `cmdcue show gh.pr.create`
  - Print all command templates, shortcuts, notes, and source for one operation.
- Add shell completion.
  - Complete command groups such as `ask`, `config`, `language`, `ai`, `validate-packs`.
  - Later complete known tool/category names from packs.

## P1: AI Fallback

- Keep AI local-search-first.
  - AI should receive grounded local results first.
  - Only fall back to general model knowledge when local search has no match and AI is configured.
- Make AI answers cite local operations.
  - Include operation ids and command templates in the response.
  - Avoid ungrounded command invention when local results exist.
- Add AI provider test fixtures.
  - Mock OpenAI-compatible responses.
  - Verify error handling for missing key, bad base URL, non-200 response, and malformed response.
- Consider a "strict local only" setting.
  - Some users may want Ask mode to never ask the model without local grounding.

## P2: Pack Authoring Tooling

- Add `cmdcue new-pack <tool>` scaffolding.
  - Create `pack.yaml`, `operations/general.yaml`, and a short local README.
- Add `cmdcue validate-pack-file <file>` for faster agent loops.
- Add optional format/lint command for packs.
  - Stable YAML ordering.
  - Quote values that YAML might coerce, such as `0`, `<`, `>`, `~`, or strings containing `:`.
- Add pack authoring examples for multiple domains.
  - CLI tool with subcommands: `gh`.
  - Shortcut-heavy TUI: `vim`.
  - Mixed CLI/shortcut tool: `tmux`.
- Add a pack contribution checklist to README or `CONTRIBUTING.md`.

## P2: Architecture And Distribution

- Decide package boundaries before publishing.
  - Keep monorepo: `@cmdcue/core`, `@cmdcue/cli`, `cmdcue` Raycast extension.
  - Publish CLI first, then make Raycast depend on a stable CLI/core release.
- Add release scripts later, but keep them out until the product stabilizes.
  - Version packages together.
  - Generate changelog.
  - Validate packs before release.
- Prepare Raycast Store readiness.
  - Replace placeholder author.
  - Confirm icon, screenshots, command descriptions, and extension metadata.
  - Document Node/CLI expectations clearly for Raycast users.
- Consider whether Raycast should bundle packs only, or call the CLI directly.
  - Bundled packs improve store usability.
  - CLI execution keeps CLI as the true core but adds installation complexity.

## P2: Metrics And Quality Gates

- Add a query benchmark suite.
  - Store common queries and expected top operation ids.
  - Run it in CI to prevent ranking regressions.
- Add pack coverage reports.
  - Count operations by tool/category.
  - Count commands with placeholders.
  - Count operations missing zh i18n or source references.
- Add CI once the repo is ready.
  - `npm run validate-packs`
  - `npm test`
  - `npm run typecheck`
  - `npm run build`

## Parking Lot

- Interactive command builder UI for Raycast.
- User-defined private packs outside the repo.
- Pack registry or install command.
- Team-shared pack collections.
- Importers from `tldr`, man pages, or `--help` output as draft generators.
- Embeddings or local vector search if lexical search stops being good enough.
