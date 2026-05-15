const SYNONYMS: Record<string, string[]> = {
  close: ["close", "kill", "delete", "remove", "quit", "exit", "关掉", "关闭", "删除", "退出"],
  window: ["window", "窗口"],
  pane: ["pane", "panel", "split", "分屏", "面板"],
  session: ["session", "会话"],
  save: ["save", "write", "保存"],
  force: ["force", "without saving", "不保存", "强制"],
  copy: ["copy", "yank", "复制"],
  search: ["search", "find", "查找", "搜索"]
};

export function normalizeToken(token: string): string {
  const lowered = token.toLowerCase().trim();
  for (const [canonical, aliases] of Object.entries(SYNONYMS)) {
    if (aliases.includes(lowered)) return canonical;
  }
  return lowered;
}

export function tokenize(input: string): string[] {
  return input
    .toLowerCase()
    .replace(/[^\p{L}\p{N}:!&+.-]+/gu, " ")
    .split(/\s+/)
    .map((token) => token.trim())
    .filter(Boolean);
}

export function expandQuery(input: string): string[] {
  const tokens = tokenize(input);
  return [...new Set([...tokens, ...tokens.map(normalizeToken)])];
}
