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
    "  cmdcue ask <question>",
    "  cmdcue config",
    "  cmdcue language",
    "  cmdcue language set <en|zh>",
    "  cmdcue ai",
    "  cmdcue ai set [--enabled true|false] [--base-url url] [--api-key key] [--model model] [--temperature n] [--max-tokens n]",
    "  cmdcue validate-packs [packs-dir]",
    "",
    "Examples:",
    "  cmdcue tmux window",
    "  cmdcue tmux 关掉 window",
    "  cmdcue ask 如何关掉 vim",
    "  cmdcue language set zh",
    "  cmdcue validate-packs packages/core/packs"
  ].join("\n");
}

function formatSearch(query: string): string {
  const config = loadConfig();
  const operations = loadOperations();
  const results = searchOperations(query, operations, 30);
  if (results.length === 0) return `No local operation matched: ${query}`;

  return results
    .map(({ operation, score }, index) => {
      const command = primaryCommand(operation);
      const shortcut = operation.shortcuts[0]?.keys;
      const cues = [command ? `cmd: ${preferredCommandText(command)}` : undefined, shortcut ? `keys: ${shortcut}` : undefined].filter(Boolean).join(" | ");
      return `${index + 1}. ${operationTitle(operation, config.language)} [${operation.tool}/${operation.category}] score=${score}\n   ${cues}`;
    })
    .join("\n");
}

async function formatAsk(question: string): Promise<string> {
  const config = loadConfig();
  const operations = loadOperations();
  const results = searchOperations(question, operations, 6);
  if (results.length === 0) {
    const prompt = buildGroundedAnswerPrompt(question, [], config.language);
    if (!isAiConfigured(config.ai)) return ["No local operation matched.", "", "AI is not configured.", "", "Grounding prompt:", prompt].join("\n");
    return askOpenAICompatible(prompt, config.ai);
  }

  const top = results[0].operation;
  const direct = [
    operationTitle(top, config.language),
    ...top.commands.map((command) => `command: ${preferredCommandText(command)} (${commandDescription(command, config.language)}, risk=${command.risk})`),
    ...top.shortcuts.map((shortcut) => `shortcut: ${shortcutKeys(shortcut.keys)} (${shortcutDescription(shortcut, config.language)})`),
    ...(top.notes ?? []).map((note) => `note: ${note}`)
  ].join("\n");

  return [direct, "", "AI grounding prompt:", buildGroundedAnswerPrompt(question, results, config.language)].join("\n");
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
  if (command === "ask") {
    console.log(await formatAsk(rest.join(" ")));
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

  console.log(formatSearch(args.join(" ")));
}

main(process.argv).catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
