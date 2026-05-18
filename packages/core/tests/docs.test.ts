import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";

describe("pack authoring guide", () => {
  test("documents the fields required for AI-generated packs", () => {
    const guide = readFileSync(join(process.cwd(), "..", "..", "docs", "pack-authoring.md"), "utf8");
    expect(guide).toContain("preferredCommand");
    expect(guide).toContain("<session-name>");
    expect(guide).toContain("i18n");
    expect(guide).toContain("risk");
    expect(guide).toContain("Do not invent aliases");
    expect(guide).toContain("Parameter Templates");
    expect(guide).toContain('gh pr create --title "<title>" --body "<body>"');
    expect(guide).toContain("Skill: Derive Pack From man");
    expect(guide).toContain("./skills/derive-pack-from-man.md");
    expect(guide).toContain("npm run validate-packs");
    expect(guide).toContain("intent.queries");
  });

  test("documents the unified Settings entry", () => {
    const readme = readFileSync(join(process.cwd(), "..", "..", "README.md"), "utf8");
    expect(readme).toContain("`Settings`");
    expect(readme).toContain("`Language`");
    expect(readme).toContain("`AI Provider`");
  });
});
