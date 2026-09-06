import { readFile } from 'node:fs/promises';
import path from 'node:path';

import {
  createQueueV4Snapshot,
  validateTldrCommuteDailyPairs,
  validateTldrCommuteQueue,
} from './session-bundle.js';

interface PairPath {
  input: string;
  reference: string;
}

async function main(): Promise<void> {
  const { input, reference, additionalPairs } = parseOptions(process.argv.slice(2));
  const candidate = JSON.parse(await readFile(input, 'utf8')) as unknown;
  if (reference !== undefined) {
    const referenceCandidate = JSON.parse(await readFile(reference, 'utf8')) as unknown;
    if (additionalPairs.length > 0) {
      const candidates = [{ input, reference }, ...additionalPairs];
      const loaded = await Promise.all(
        candidates.map(async (pair) => ({
          mainFilename: path.basename(pair.input),
          referenceFilename: path.basename(pair.reference),
          playbackFile: JSON.parse(await readFile(pair.input, 'utf8')) as unknown,
          referenceFile: JSON.parse(await readFile(pair.reference, 'utf8')) as unknown,
        }))
      );
      const validated = validateTldrCommuteDailyPairs(loaded);
      process.stdout.write(`Valid daily v4 commute queue set: ${validated.length} pair(s)\n`);
      return;
    }
    const validated = createQueueV4Snapshot(
      candidate,
      referenceCandidate,
      path.basename(input),
      path.basename(reference)
    );
    const pairReference = validated.reference_file as Record<string, unknown>;
    process.stdout.write(
      `Valid v4 commute queue pair: ${path.basename(input)} + ${path.basename(reference)} (${String(pairReference.total_items)} item(s))\n`
    );
    return;
  }
  const validated = validateTldrCommuteQueue(candidate);
  const itemCount = (validated.items as unknown[]).length;
  const version = String(validated.queue_version).replace('tldr-commute-queue.', '');
  process.stdout.write(
    `Valid ${version} commute queue: ${path.basename(input)} (${itemCount} item(s))\n`
  );
}

function parseOptions(args: string[]): {
  input: string;
  reference?: string;
  additionalPairs: PairPath[];
} {
  const input = args[0];
  if (!input) {
    throw new Error(usage());
  }
  if (args.length === 1) return { input, additionalPairs: [] };
  if (args[1] !== '--reference' || !args[2]) throw new Error(usage());
  const reference = args[2];
  const additionalPairs: PairPath[] = [];
  for (let index = 3; index < args.length; index += 4) {
    const pairInput = args[index + 1];
    const pairReference = args[index + 3];
    if (
      args[index] !== '--pair' ||
      !pairInput ||
      args[index + 2] !== '--reference' ||
      !pairReference
    ) {
      throw new Error(usage());
    }
    additionalPairs.push({ input: pairInput, reference: pairReference });
  }
  return { input, reference, additionalPairs };
}

function usage(): string {
  return 'Usage: validate:commute-queue -- <queue.txt> [--reference <reference.txt> [--pair <queue.txt> --reference <reference.txt>]...]';
}

await main();
