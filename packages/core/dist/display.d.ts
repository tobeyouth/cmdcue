import type { CommandCue, Operation } from "./types";
export declare function primaryCommand(operation: Operation): CommandCue | undefined;
export declare function preferredCommandText(command: CommandCue | undefined): string;
export declare function keywordLabel(operation: Operation, maxItems?: number): string;
