import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { parse as parseYaml } from "yaml";

const riskLevels = new Set(["safe", "readonly", "destructive"]);

export type PackValidationIssue = {
  file: string;
  path: string;
  message: string;
};

export type PackValidationResult = {
  ok: boolean;
  errors: PackValidationIssue[];
  warnings: PackValidationIssue[];
};

function issue(file: string, path: string, message: string): PackValidationIssue {
  return { file, path, message };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseDataFile(path: string, errors: PackValidationIssue[]): unknown {
  try {
    const content = readFileSync(path, "utf8");
    if (path.endsWith(".json")) return JSON.parse(content);
    return parseYaml(content);
  } catch (error) {
    errors.push(issue(path, "$", error instanceof Error ? error.message : String(error)));
    return undefined;
  }
}

function validateString(value: unknown, file: string, path: string, errors: PackValidationIssue[]): value is string {
  if (typeof value === "string" && value.trim().length > 0) return true;
  errors.push(issue(file, path, "Expected a non-empty string"));
  return false;
}

function validateStringArray(value: unknown, file: string, path: string, errors: PackValidationIssue[]): value is string[] {
  if (Array.isArray(value) && value.every((item) => typeof item === "string" && item.trim().length > 0)) return true;
  errors.push(issue(file, path, "Expected an array of non-empty strings"));
  return false;
}

function findDataFile(directory: string, basename: string): string | undefined {
  return [`${basename}.yaml`, `${basename}.yml`, `${basename}.json`].map((file) => join(directory, file)).find((path) => existsSync(path));
}

function validateI18n(value: unknown, file: string, path: string, errors: PackValidationIssue[]): void {
  if (value === undefined) return;
  if (!isRecord(value)) {
    errors.push(issue(file, path, "Expected an object keyed by language code"));
    return;
  }

  for (const [language, entry] of Object.entries(value)) {
    if (!isRecord(entry)) {
      errors.push(issue(file, `${path}.${language}`, "Expected an object"));
      continue;
    }
    for (const [key, translated] of Object.entries(entry)) {
      if (typeof translated !== "string" || translated.trim().length === 0) {
        errors.push(issue(file, `${path}.${language}.${key}`, "Expected a non-empty string"));
      }
    }
  }
}

function validateCommands(value: unknown, file: string, operationPath: string, errors: PackValidationIssue[]): void {
  if (!Array.isArray(value)) {
    errors.push(issue(file, `${operationPath}.commands`, "Expected an array"));
    return;
  }

  value.forEach((command, index) => {
    const path = `${operationPath}.commands[${index}]`;
    if (!isRecord(command)) {
      errors.push(issue(file, path, "Expected an object"));
      return;
    }
    if (validateString(command.command, file, `${path}.command`, errors)) {
      if (command.command.includes("<<") || command.command.includes(">>")) {
        errors.push(issue(file, `${path}.command`, "Invalid placeholder syntax; use <parameter-name>"));
      }
      for (const placeholder of command.command.match(/<[^>\s]+>/g) ?? []) {
        if (!/^<[a-z0-9][a-z0-9-]*>$/.test(placeholder)) {
          errors.push(issue(file, `${path}.command`, `Invalid placeholder ${placeholder}; use lowercase kebab-case`));
        }
      }
      if (command.command.includes("<") && command.pasteable === false) {
        errors.push(issue(file, `${path}.pasteable`, "Template commands with placeholders must be pasteable"));
      }
    }
    if (command.preferredCommand !== undefined && typeof command.preferredCommand !== "string") {
      errors.push(issue(file, `${path}.preferredCommand`, "Expected a string"));
    }
    validateString(command.description, file, `${path}.description`, errors);
    if (typeof command.pasteable !== "boolean") {
      errors.push(issue(file, `${path}.pasteable`, "Expected a boolean"));
    }
    if (typeof command.risk !== "string" || !riskLevels.has(command.risk)) {
      errors.push(issue(file, `${path}.risk`, "Expected one of: safe, readonly, destructive"));
    }
    validateI18n(command.i18n, file, `${path}.i18n`, errors);
  });
}

function validateShortcuts(value: unknown, file: string, operationPath: string, errors: PackValidationIssue[]): void {
  if (!Array.isArray(value)) {
    errors.push(issue(file, `${operationPath}.shortcuts`, "Expected an array"));
    return;
  }

  value.forEach((shortcut, index) => {
    const path = `${operationPath}.shortcuts[${index}]`;
    if (!isRecord(shortcut)) {
      errors.push(issue(file, path, "Expected an object"));
      return;
    }
    validateString(shortcut.keys, file, `${path}.keys`, errors);
    validateString(shortcut.description, file, `${path}.description`, errors);
    validateI18n(shortcut.i18n, file, `${path}.i18n`, errors);
  });
}

function validateOperation(
  operation: unknown,
  file: string,
  index: number,
  packId: string,
  ids: Set<string>,
  errors: PackValidationIssue[],
  warnings: PackValidationIssue[]
): void {
  const operationPath = `$[${index}]`;
  if (!isRecord(operation)) {
    errors.push(issue(file, operationPath, "Expected an operation object"));
    return;
  }

  if ("queries" in operation) {
    errors.push(issue(file, `${operationPath}.queries`, "Move queries under intent.queries"));
  }

  if (validateString(operation.id, file, `${operationPath}.id`, errors)) {
    if (ids.has(operation.id)) errors.push(issue(file, `${operationPath}.id`, `Duplicate operation id: ${operation.id}`));
    ids.add(operation.id);
  }

  if (validateString(operation.tool, file, `${operationPath}.tool`, errors) && operation.tool !== packId) {
    errors.push(issue(file, `${operationPath}.tool`, `Expected tool to match pack id: ${packId}`));
  }

  validateString(operation.category, file, `${operationPath}.category`, errors);
  validateString(operation.title, file, `${operationPath}.title`, errors);
  validateI18n(operation.i18n, file, `${operationPath}.i18n`, errors);

  if (!isRecord(operation.intent)) {
    errors.push(issue(file, `${operationPath}.intent`, "Expected an object"));
  } else {
    validateStringArray(operation.intent.verbs, file, `${operationPath}.intent.verbs`, errors);
    validateStringArray(operation.intent.objects, file, `${operationPath}.intent.objects`, errors);
    validateStringArray(operation.intent.queries, file, `${operationPath}.intent.queries`, errors);
  }

  validateCommands(operation.commands, file, operationPath, errors);
  validateShortcuts(operation.shortcuts, file, operationPath, errors);

  if (Array.isArray(operation.commands) && Array.isArray(operation.shortcuts) && operation.commands.length === 0 && operation.shortcuts.length === 0) {
    warnings.push(issue(file, operationPath, "Operation has neither commands nor shortcuts"));
  }
  if (operation.notes !== undefined) validateStringArray(operation.notes, file, `${operationPath}.notes`, errors);
  if (operation.source !== undefined && typeof operation.source !== "string") {
    errors.push(issue(file, `${operationPath}.source`, "Expected a string"));
  }
}

function validatePackDirectory(packDir: string, errors: PackValidationIssue[], warnings: PackValidationIssue[]): void {
  const manifestFile = findDataFile(packDir, "pack");
  if (!manifestFile) {
    errors.push(issue(packDir, "pack", "Missing pack.yaml, pack.yml, or pack.json"));
    return;
  }

  const manifest = parseDataFile(manifestFile, errors);
  if (!isRecord(manifest)) {
    errors.push(issue(manifestFile, "$", "Expected a pack manifest object"));
    return;
  }

  const packId = typeof manifest.id === "string" ? manifest.id : "";
  validateString(manifest.id, manifestFile, "$.id", errors);
  validateString(manifest.name, manifestFile, "$.name", errors);
  validateStringArray(manifest.aliases, manifestFile, "$.aliases", errors);
  validateString(manifest.description, manifestFile, "$.description", errors);

  const operationsDir = join(packDir, "operations");
  if (!existsSync(operationsDir) || !statSync(operationsDir).isDirectory()) {
    errors.push(issue(operationsDir, "$", "Missing operations directory"));
    return;
  }

  const operationFiles = readdirSync(operationsDir)
    .filter((file) => file.endsWith(".json") || file.endsWith(".yaml") || file.endsWith(".yml"))
    .map((file) => join(operationsDir, file));

  if (operationFiles.length === 0) {
    errors.push(issue(operationsDir, "$", "Expected at least one operation data file"));
    return;
  }

  const ids = new Set<string>();
  for (const operationFile of operationFiles) {
    const operations = parseDataFile(operationFile, errors);
    if (!Array.isArray(operations)) {
      errors.push(issue(operationFile, "$", "Expected an array of operations"));
      continue;
    }
    operations.forEach((operation, index) => validateOperation(operation, operationFile, index, packId, ids, errors, warnings));
  }
}

export function validatePacks(packsDir: string): PackValidationResult {
  const errors: PackValidationIssue[] = [];
  const warnings: PackValidationIssue[] = [];

  if (!existsSync(packsDir) || !statSync(packsDir).isDirectory()) {
    errors.push(issue(packsDir, "$", "Packs directory does not exist"));
    return { ok: false, errors, warnings };
  }

  const packDirs = readdirSync(packsDir)
    .map((entry) => join(packsDir, entry))
    .filter((path) => statSync(path).isDirectory());

  if (packDirs.length === 0) errors.push(issue(packsDir, "$", "Expected at least one pack directory"));
  packDirs.forEach((packDir) => validatePackDirectory(packDir, errors, warnings));

  return { ok: errors.length === 0, errors, warnings };
}
