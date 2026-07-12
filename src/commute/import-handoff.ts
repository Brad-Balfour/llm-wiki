import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { parseCommuteHandoffText } from './handoff.js';

interface Options {
  input: string;
  outputDir: string;
}

async function main(): Promise<void> {
  const options = parseOptions(process.argv.slice(2));
  const input = await readFile(options.input, 'utf8');
  const handoff = parseCommuteHandoffText(input);
  const safeSessionId = handoff.session_id.replace(/[^a-zA-Z0-9._-]+/g, '-');
  const outputPath = path.join(options.outputDir, `${safeSessionId}.json`);

  await mkdir(options.outputDir, { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(handoff, null, 2)}\n`, { flag: 'wx' });

  process.stdout.write(
    `${outputPath}\n${handoff.feedback.length} feedback item(s), ${handoff.review_notes.length} review note(s)\n`
  );
}

function parseOptions(args: string[]): Options {
  let input: string | undefined;
  let outputDir = '.private/commute-handoffs';

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === '--input') {
      input = args[index + 1];
      index += 1;
    } else if (arg === '--output-dir') {
      outputDir = args[index + 1] ?? outputDir;
      index += 1;
    } else {
      throw new Error(`Unknown argument: ${arg ?? ''}`);
    }
  }

  if (!input) {
    throw new Error('Usage: import:commute-handoff -- --input <file.txt> [--output-dir <dir>]');
  }

  return { input, outputDir };
}

await main();
