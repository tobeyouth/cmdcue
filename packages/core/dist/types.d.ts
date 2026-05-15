export type RiskLevel = "safe" | "readonly" | "destructive";
export type CommandCue = {
    command: string;
    preferredCommand?: string;
    description: string;
    i18n?: Record<string, {
        description?: string;
    }>;
    pasteable: boolean;
    risk: RiskLevel;
};
export type ShortcutCue = {
    keys: string;
    description: string;
    i18n?: Record<string, {
        description?: string;
    }>;
};
export type Operation = {
    id: string;
    tool: string;
    category: string;
    title: string;
    zh?: string;
    i18n?: Record<string, {
        title?: string;
    }>;
    intent: {
        verbs: string[];
        objects: string[];
        queries: string[];
    };
    commands: CommandCue[];
    shortcuts: ShortcutCue[];
    notes?: string[];
    source?: string;
};
export type PackManifest = {
    id: string;
    name: string;
    aliases: string[];
    description: string;
};
export type OperationPack = {
    manifest: PackManifest;
    operations: Operation[];
};
export type SearchResult = {
    operation: Operation;
    score: number;
    reasons: string[];
};
