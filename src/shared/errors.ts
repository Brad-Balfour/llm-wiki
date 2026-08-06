/** Error inspection shared by every module that reports contract failures. */

export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export function errorCode(error: unknown): unknown {
  return typeof error === 'object' && error !== null && 'code' in error
    ? (error as { code?: unknown }).code
    : undefined;
}

export function isMissingFile(error: unknown): boolean {
  return errorCode(error) === 'ENOENT';
}

export function isExistingFile(error: unknown): boolean {
  return errorCode(error) === 'EEXIST';
}
