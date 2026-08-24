import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

export async function githubState(repository: string, pr: number): Promise<unknown> {
  const query = `query($owner:String!,$repo:String!,$number:Int!){repository(owner:$owner,name:$repo){pullRequest(number:$number){number url headRefOid state mergedAt mergeable reviewDecision isDraft reviews(last:20){nodes{state author{login}}} reviewThreads(first:100){nodes{isResolved}} closingIssuesReferences(first:50){nodes{number title state url}} commits(last:1){nodes{commit{statusCheckRollup{contexts(first:100){nodes{__typename ... on CheckRun{name status conclusion detailsUrl}}}}}}}}}}`;
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
    { maxBuffer: 1024 * 1024, timeout: 30_000 }
  );
  return JSON.parse(stdout) as unknown;
}

export async function watchGithubState(
  repository: string,
  pr: number,
  timeoutMs: number,
  intervalMs = 5_000,
  sleep: (milliseconds: number) => Promise<void> = (milliseconds) =>
    new Promise((resolve) => setTimeout(resolve, milliseconds))
): Promise<{ outcome: 'state_changed' | 'timeout'; state: unknown; observations: number }> {
  const initial = await githubState(repository, pr);
  const initialFingerprint = JSON.stringify(initial);
  const deadline = Date.now() + timeoutMs;
  let observations = 1;
  let latest = initial;
  while (Date.now() < deadline) {
    await sleep(Math.min(intervalMs, Math.max(0, deadline - Date.now())));
    latest = await githubState(repository, pr);
    observations += 1;
    if (JSON.stringify(latest) !== initialFingerprint)
      return { outcome: 'state_changed', state: latest, observations };
  }
  return { outcome: 'timeout', state: latest, observations };
}
