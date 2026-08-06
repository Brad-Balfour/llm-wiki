import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { isMissingFile } from './errors.js';

/** Read a file, treating absence as a value rather than an error. */
export async function readOptionalFile(filePath: string): Promise<string | undefined> {
  try {
    return await readFile(filePath, 'utf8');
  } catch (error) {
    if (isMissingFile(error)) return undefined;
    throw error;
  }
}

/**
 * Serialize a record the way every generated artifact in this project is
 * written. `indent` exists for the one CLI that offers compact output.
 */
export function formatJsonRecord(value: unknown, indent = 2): string {
  return `${JSON.stringify(value, null, indent)}\n`;
}

/**
 * Write a generated record, refusing to overwrite an existing one.
 *
 * Exclusive creation is the default for import and retrieval outputs: a
 * silently clobbered private record loses provenance with no signal.
 */
export async function writeNewJsonFile(filePath: string, value: unknown): Promise<void> {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, formatJsonRecord(value), { flag: 'wx' });
}

/** Write a record that is expected to already exist and be replaced. */
export async function writeJsonFile(filePath: string, value: unknown, indent = 2): Promise<void> {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, formatJsonRecord(value, indent), 'utf8');
}

/**
 * Replace a file atomically through a temporary sibling, so an interrupted
 * write cannot leave compiler state half-written.
 */
export async function writeFileAtomic(filePath: string, contents: string): Promise<void> {
  const temporaryPath = `${filePath}.tmp-${process.pid}`;
  await writeFile(temporaryPath, contents, 'utf8');
  await rename(temporaryPath, filePath);
}

/** Read all of stdin as UTF-8 text. */
export async function readStdin(): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks).toString('utf8');
}
