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
export declare function validatePacks(packsDir: string): PackValidationResult;
