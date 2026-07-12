import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { ingestTldrText } from './ingestion.js';
import type { TldrIngestionResult, TldrInputSource } from './ingestion.js';

interface CliOptions {
  input?: string;
  output?: string;
  reviewOutput?: string;
  source: TldrInputSource;
  sourceMessageId?: string;
  extractedAt?: string;
  pretty: boolean;
  help: boolean;
}

const USAGE = `Usage: node dist/src/tldr/ingest-file.js --input <body.txt|-> --output <items.json> [options]

Options:
  --input <path|->             Text file containing a pasted/exported TLDR email body, or - for stdin.
  --output <path>              JSON output path for sanitized parsed items.
  --review-output <path>       JSON output path for parse review records.
  --source <text-file|gmail-manual>
                               Input source label. Defaults to text-file.
  --source-message-id <id>     Optional Gmail message id from a manual connector workflow.
  --extracted-at <iso>         Override extraction timestamp for repeatable tests.
  --compact                    Write compact JSON instead of pretty JSON.
  --help                       Show this help text.
`;

export async function runTldrIngestFileCommand(argv: string[]): Promise<number> {
  const options = parseArgs(argv);

  if (options.help) {
    console.log(USAGE);
    return 0;
  }

  if (options.input === undefined || options.output === undefined) {
    console.error(USAGE);
    return 1;
  }

  const body =
    options.input === '-' ? await readStdin() : await readFile(resolve(options.input), 'utf8');
  const ingestOptions: Parameters<typeof ingestTldrText>[1] = {
    source: options.source,
  };

  if (options.extractedAt !== undefined) {
    ingestOptions.extractedAt = options.extractedAt;
  }

  if (options.sourceMessageId !== undefined) {
    ingestOptions.sourceMessageId = options.sourceMessageId;
  }

  const result = ingestTldrText(body, ingestOptions);

  await writeJsonFile(resolve(options.output), result, options.pretty);

  if (options.reviewOutput !== undefined) {
    await writeJsonFile(resolve(options.reviewOutput), result.review, options.pretty);
  }

  if (result.review.length > 0) {
    console.error(
      `TLDR ingestion completed with ${result.review.length} review record(s); parsed ${result.items.length} item(s).`
    );
    return 2;
  }

  console.log(`TLDR ingestion parsed ${result.items.length} item(s).`);
  return 0;
}

function parseArgs(argv: string[]): CliOptions {
  const options: CliOptions = {
    source: 'text-file',
    pretty: true,
    help: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    switch (arg) {
      case '--input':
        options.input = readValue(argv, index, arg);
        index += 1;
        break;
      case '--output':
        options.output = readValue(argv, index, arg);
        index += 1;
        break;
      case '--review-output':
        options.reviewOutput = readValue(argv, index, arg);
        index += 1;
        break;
      case '--source': {
        const value = readValue(argv, index, arg);

        if (value !== 'text-file' && value !== 'gmail-manual') {
          throw new Error(`Unsupported --source value: ${value}`);
        }

        options.source = value;
        index += 1;
        break;
      }
      case '--source-message-id':
        options.sourceMessageId = readValue(argv, index, arg);
        index += 1;
        break;
      case '--extracted-at':
        options.extractedAt = readValue(argv, index, arg);
        index += 1;
        break;
      case '--compact':
        options.pretty = false;
        break;
      case '--help':
        options.help = true;
        break;
      default:
        throw new Error(`Unknown argument: ${arg}`);
    }
  }

  return options;
}

function readValue(argv: string[], index: number, arg: string): string {
  const value = argv[index + 1];

  if (value === undefined || value.startsWith('--')) {
    throw new Error(`Missing value for ${arg}`);
  }

  return value;
}

async function writeJsonFile(
  path: string,
  value: TldrIngestionResult | TldrIngestionResult['review'],
  pretty: boolean
) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${JSON.stringify(value, null, pretty ? 2 : 0)}\n`, 'utf8');
}

async function readStdin(): Promise<string> {
  const chunks: Buffer[] = [];

  for await (const chunk of process.stdin) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }

  return Buffer.concat(chunks).toString('utf8');
}

const executedPath = process.argv[1] === undefined ? null : resolve(process.argv[1]);
const modulePath = fileURLToPath(import.meta.url);

if (executedPath === modulePath) {
  runTldrIngestFileCommand(process.argv.slice(2))
    .then((exitCode) => {
      process.exitCode = exitCode;
    })
    .catch((error: unknown) => {
      console.error(error instanceof Error ? error.message : String(error));
      process.exitCode = 1;
    });
}
