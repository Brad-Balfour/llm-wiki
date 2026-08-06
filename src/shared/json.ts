import { errorMessage } from './errors.js';
import { requireRecord } from './validate.js';

/**
 * Model surfaces hand back JSON wrapped in a Markdown fence often enough that
 * every parser has to tolerate it. Strip one fence, never more.
 */
export function stripMarkdownFence(text: string): string {
  const match = /^```(?:json)?\s*([\s\S]*?)\s*```$/i.exec(text);
  return match?.[1] ?? text;
}

/** Parse fenced-or-bare JSON text into an object, naming the artifact on failure. */
export function parseJsonObject(text: string, field: string): Record<string, unknown> {
  let candidate: unknown;
  try {
    candidate = JSON.parse(stripMarkdownFence(text.trim()));
  } catch (error) {
    throw new Error(`${field} is not valid JSON: ${errorMessage(error)}`);
  }
  return requireRecord(candidate, field);
}
