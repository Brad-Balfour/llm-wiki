import { execFile } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

export async function githubState(repository: string, pr: number): Promise<unknown> {
  const query = `query($owner:String!,$repo:String!,$number:Int!){repository(owner:$owner,name:$repo){pullRequest(number:$number){url headRefOid mergeable reviewDecision isDraft reviews(last:20){nodes{state author{login}}} reviewThreads(first:100){nodes{isResolved}} closingIssuesReferences(first:50){nodes{number title state url}} commits(last:1){nodes{commit{statusCheckRollup{contexts(first:100){nodes{__typename ... on CheckRun{name status conclusion detailsUrl}}}}}}}}}}`;
  const [owner, repo] = repository.split('/');
  if (!owner || !repo || !Number.isInteger(pr) || pr < 1)
    throw new Error('Use OWNER/REPO and a positive PR number');
  const { stdout } = await execFileAsync(
    'gh',
    [
      'api',
      'graphql',
      '-f',
      `query=${query}`,
      '-F',
      `owner=${owner}`,
      '-F',
      `repo=${repo}`,
      '-F',
      `number=${pr}`,
    ],
    { maxBuffer: 1024 * 1024 }
  );
  return JSON.parse(stdout) as unknown;
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))
) {
  const [repository, number] = process.argv.slice(2);
  const state = await githubState(repository ?? '', Number(number));
  process.stdout.write(`${JSON.stringify(state, null, 2)}\n`);
}
