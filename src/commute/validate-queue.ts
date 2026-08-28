import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { validateTldrCommuteQueue } from './session-bundle.js';

async function main(): Promise<void> {
  const input = process.argv[2];
  if (!input || process.argv.length !== 3) {
    throw new Error('Usage: validate:commute-queue -- <queue.txt>');
  }
  const queue = JSON.parse(await readFile(input, 'utf8')) as unknown;
  const validated = validateTldrCommuteQueue(queue);
  const itemCount = (validated.items as unknown[]).length;
  const version = String(validated.queue_version).replace('tldr-commute-queue.', '');
  process.stdout.write(
    `Valid ${version} commute queue: ${path.basename(input)} (${itemCount} item(s))\n`
  );
}

await main();
