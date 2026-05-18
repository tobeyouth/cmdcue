#!/usr/bin/env node
import {
  askOpenAICompatible,
  buildGroundedAnswerPrompt,
  commandDescription,
  configPath,
  isAiConfigured,
  loadConfig,
  loadOperations,
  operationTitle,
  preferredCommandText,
  primaryCommand,
  saveConfig,
  searchOperations,
  shortcutDescription,
  shortcutKeys,
  updateConfig,
  validatePacks
} from "@cmdcue/core";
import { resolve } from "node:path";

function usage(): string {
  return [
    "CmdCue",
    "",
    "Usage:",
    "  cmdcue <query>",
    "  cmdcue search <query> [--json]",
    "  cmdcue ask <question>",
    "  cmdcue show <operation-id> [--json]",
    "  cmdcue config",
    "  cmdcue language",
    "  cmdcue language set <en|zh>",
    "  cmdcue ai",
    "  cmdcue ai set [--enabled true|false] [--base-url url] [--api-key key] [--model model] [--temperature n] [--max-tokens n]",
    "  cmdcue validate-packs [packs-dir]",
    "",
    "Examples:",
    "  cmdcue tmux window",
    "  cmdcue search tmux window --json",
    "  cmdcue tmux 关掉 window",
    "  cmdcue ask 如何关掉 vim",
    "  cmdcue show gh.pr.create",
    "  cmdcue language set zh",
    "  cmdcue validate-packs packages/core/packs"
  ].join("\n");
}

function stripFlag(args: string[], flag: string): { args: string[]; present: boolean } {
  let present = false;
  const next = args.filter((arg) => {
    if (arg === flag) {
      present = true;
      return false;
    }
    return true;
  });
  return { args: next, present };
}

function serializeSearch(query: string) {
  const config = loadConfig();
  const operations = loadOperations();
  const results = searchOperations(query, operations, 30);
  return results.map(({ operation, score }) => {
    const command = primaryCommand(operation, query);
    const shortcut = operation.shortcuts[0]?.keys;
    return {
      id: operation.id,
      title: operationTitle(operation, config.language),
      tool: operation.tool,
      category: operation.category,
      score,
      command: command ? preferredCommandText(command) : null,
      shortcut: shortcut ?? null
    };
  });
}

function formatSearch(query: string): string {
  const rows = serializeSearch(query);
  if (rows.length === 0) return `No local operation matched: ${query}`;
  return rows
    .map((row, index) => {
      const cues = [row.command ? `cmd: ${row.command}` : undefined, row.shortcut ? `keys: ${row.shortcut}` : undefined].filter(Boolean).join(" | ");
      return `${index + 1}. ${row.title} [${row.tool}/${row.category}] score=${row.score}\n   ${cues}`;
    })
    .join("\n");
}

async function serializeAsk(question: string): Promise<Record<string, unknown>> {
  const config = loadConfig();
  const operations = loadOperations();
  const results = searchOperations(question, operations, 6);
  if (results.length === 0) {
    const prompt = buildGroundedAnswerPrompt(question, [], config.language);
    if (!isAiConfigured(config.ai)) {
      return {
        matched: false,
        message: "No local operation matched.",
        aiConfigured: false,
        groundingPrompt: prompt
      };
    }
    return {
      matched: false,
      aiConfigured: true,
      answer: await askOpenAICompatible(prompt, config.ai),
      groundingPrompt: prompt
    };
  }

  const top = results[0].operation;
  return {
    matched: true,
    operation: {
      id: top.id,
      title: operationTitle(top, config.language),
      tool: top.tool,
      category: top.category
    },
    commands: top.commands.map((command) => ({
      command: preferredCommandText(command),
      description: commandDescription(command, config.language),
      risk: command.risk
    })),
    shortcuts: top.shortcuts.map((shortcut) => ({
      keys: shortcutKeys(shortcut.keys),
      description: shortcutDescription(shortcut, config.language)
    })),
    notes: top.notes ?? [],
    groundingPrompt: buildGroundedAnswerPrompt(question, results, config.language)
  };
}

async function formatAsk(question: string): Promise<string> {
  const payload = await serializeAsk(question);
  if (payload.matched === false && payload.aiConfigured === true && payload.answer) return String(payload.answer);
  if (payload.matched === false) {
    return [
      "No local operation matched.",
      "",
      "AI is not configured.",
      "",
      "Grounding prompt:",
      String(payload.groundingPrompt ?? "")
    ].join("\n");
  }
  const operation = payload.operation as { title: string } | undefined;
  const commands = (payload.commands as Array<{ command: string; description: string; risk: string }> | undefined) ?? [];
  const shortcuts = (payload.shortcuts as Array<{ keys: string; description: string }> | undefined) ?? [];
  const notes = (payload.notes as string[] | undefined) ?? [];
  const direct = [
    operation?.title ?? "",
    ...commands.map((command) => `command: ${command.command} (${command.description}, risk=${command.risk})`),
    ...shortcuts.map((shortcut) => `shortcut: ${shortcut.keys} (${shortcut.description})`),
    ...notes.map((note) => `note: ${note}`)
  ].join("\n");
  return [direct, "", "AI grounding prompt:", String(payload.groundingPrompt ?? "")].join("\n");
}

function formatOperation(operationId: string): string {
  const config = loadConfig();
  const operation = loadOperations().find((candidate) => candidate.id === operationId);
  if (!operation) {
    process.exitCode = 1;
    return `Operation not found: ${operationId}`;
  }
  const commands = operation.commands.length
    ? operation.commands.map((command) => `command: ${preferredCommandText(command)} (${commandDescription(command, config.language)}, risk=${command.risk})`)
    : ["command: <none>"];
  const shortcuts = operation.shortcuts.length
    ? operation.shortcuts.map((shortcut) => `shortcut: ${shortcutKeys(shortcut.keys)} (${shortcutDescription(shortcut, config.language)})`)
    : ["shortcut: <none>"];
  const notes = operation.notes?.length ? operation.notes.map((note) => `note: ${note}`) : ["note: <none>"];
  return [
    `${operationTitle(operation, config.language)} [${operation.id}]`,
    `tool: ${operation.tool}`,
    `category: ${operation.category}`,
    ...commands,
    ...shortcuts,
    ...notes
  ].join("\n");
}

function serializeOperation(operationId: string): Record<string, unknown> {
  const config = loadConfig();
  const operation = loadOperations().find((candidate) => candidate.id === operationId);
  if (!operation) {
    process.exitCode = 1;
    return { found: false, operationId };
  }
  return {
    found: true,
    id: operation.id,
    title: operationTitle(operation, config.language),
    tool: operation.tool,
    category: operation.category,
    intent: operation.intent,
    commands: operation.commands.map((command) => ({
      command: preferredCommandText(command),
      description: commandDescription(command, config.language),
      risk: command.risk
    })),
    shortcuts: operation.shortcuts.map((shortcut) => ({
      keys: shortcutKeys(shortcut.keys),
      description: shortcutDescription(shortcut, config.language)
    })),
    notes: operation.notes ?? []
  };
}

function parseOptions(args: string[]): Record<string, string> {
  const options: Record<string, string> = {};
  for (let index = 0; index < args.length; index += 1) {
    const key = args[index];
    if (!key.startsWith("--")) continue;
    const next = args[index + 1];
    options[key.slice(2)] = next && !next.startsWith("--") ? next : "true";
    if (next && !next.startsWith("--")) index += 1;
  }
  return options;
}

function formatConfig(): string {
  const config = loadConfig();
  return [
    `Config: ${configPath()}`,
    `language: ${config.language}`,
    "ai:",
    `  enabled: ${config.ai.enabled}`,
    `  baseUrl: ${config.ai.baseUrl}`,
    `  apiKey: ${config.ai.apiKey ? "<set>" : "<empty>"}`,
    `  model: ${config.ai.model}`,
    `  temperature: ${config.ai.temperature}`,
    `  maxTokens: ${config.ai.maxTokens}`
  ].join("\n");
}

function setLanguage(language: string): string {
  if (!["en", "zh"].includes(language)) throw new Error("Language must be one of: en, zh");
  updateConfig((config) => ({ ...config, language }));
  return `Language set to ${language}`;
}

function formatLanguage(): string {
  return loadConfig().language;
}

function formatAi(): string {
  const ai = loadConfig().ai;
  return [
    `enabled: ${ai.enabled}`,
    `baseUrl: ${ai.baseUrl}`,
    `apiKey: ${ai.apiKey ? "<set>" : "<empty>"}`,
    `model: ${ai.model}`,
    `temperature: ${ai.temperature}`,
    `maxTokens: ${ai.maxTokens}`
  ].join("\n");
}

function setAi(args: string[]): string {
  const options = parseOptions(args);
  const config = loadConfig();
  saveConfig({
    ...config,
    ai: {
      ...config.ai,
      enabled: options.enabled === undefined ? config.ai.enabled : options.enabled === "true",
      baseUrl: options["base-url"] ?? config.ai.baseUrl,
      apiKey: options["api-key"] ?? config.ai.apiKey,
      model: options.model ?? config.ai.model,
      temperature: options.temperature === undefined ? config.ai.temperature : Number(options.temperature),
      maxTokens: options["max-tokens"] === undefined ? config.ai.maxTokens : Number(options["max-tokens"])
    }
  });
  return "AI settings saved";
}

function formatPackValidation(packsDirArg?: string): string {
  const packsDir = resolve(packsDirArg ?? "packages/core/packs");
  const result = validatePacks(packsDir);
  const lines = [`Validating packs: ${packsDir}`];

  for (const warning of result.warnings) {
    lines.push(`warning ${warning.file} ${warning.path}: ${warning.message}`);
  }
  for (const error of result.errors) {
    lines.push(`error ${error.file} ${error.path}: ${error.message}`);
  }

  if (result.ok) {
    lines.push(`OK: ${result.warnings.length} warning(s)`);
    return lines.join("\n");
  }

  process.exitCode = 1;
  lines.push(`Failed: ${result.errors.length} error(s), ${result.warnings.length} warning(s)`);
  return lines.join("\n");
}

async function main(argv: string[]): Promise<void> {
  const args = argv.slice(2);
  if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
    console.log(usage());
    return;
  }

  const [command, ...rest] = args;
  if (command === "search") {
    const parsed = stripFlag(rest, "--json");
    const query = parsed.args.join(" ");
    if (parsed.present) {
      console.log(JSON.stringify({ query, results: serializeSearch(query) }, null, 2));
      return;
    }
    console.log(formatSearch(query));
    return;
  }
  if (command === "ask") {
    const parsed = stripFlag(rest, "--json");
    const question = parsed.args.join(" ");
    if (parsed.present) {
      console.log(JSON.stringify(await serializeAsk(question), null, 2));
      return;
    }
    console.log(await formatAsk(question));
    return;
  }
  if (command === "show") {
    const parsed = stripFlag(rest, "--json");
    const operationId = parsed.args[0] ?? "";
    if (!operationId) {
      process.exitCode = 1;
      console.log("Usage: cmdcue show <operation-id> [--json]");
      return;
    }
    if (parsed.present) {
      console.log(JSON.stringify(serializeOperation(operationId), null, 2));
      return;
    }
    console.log(formatOperation(operationId));
    return;
  }
  if (command === "config" || command === "settings") {
    console.log(formatConfig());
    return;
  }
  if (command === "language" && rest[0] === "set") {
    console.log(setLanguage(rest[1]));
    return;
  }
  if (command === "language") {
    console.log(formatLanguage());
    return;
  }
  if (command === "ai" && rest[0] === "set") {
    console.log(setAi(rest.slice(1)));
    return;
  }
  if (command === "ai") {
    console.log(formatAi());
    return;
  }
  if (command === "validate-packs") {
    console.log(formatPackValidation(rest[0]));
    return;
  }

  const parsed = stripFlag(args, "--json");
  const query = parsed.args.join(" ");
  if (parsed.present) {
    console.log(JSON.stringify({ query, results: serializeSearch(query) }, null, 2));
    return;
  }
  console.log(formatSearch(query));
}

main(process.argv).catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
