import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { createQueueV4Snapshot, validateTldrCommuteQueue } from './session-bundle.js';

async function main(): Promise<void> {
  const { input, reference } = parseOptions(process.argv.slice(2));
  const candidate = JSON.parse(await readFile(input, 'utf8')) as unknown;
  if (reference !== undefined) {
    const referenceCandidate = JSON.parse(await readFile(reference, 'utf8')) as unknown;
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

function parseOptions(args: string[]): { input: string; reference?: string } {
  const input = args[0];
  if (!input) {
    throw new Error('Usage: validate:commute-queue -- <queue.txt> [--reference <reference.txt>]');
  }
  if (args.length === 1) return { input };
  if (args.length === 3 && args[1] === '--reference' && args[2]) {
    return { input, reference: args[2] };
  }
  throw new Error('Usage: validate:commute-queue -- <queue.txt> [--reference <reference.txt>]');
}

await main();
