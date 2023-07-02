import 'dotenv/config';
import { describe, it } from 'vitest';
import { GitHub } from './github';

describe('github', () => {
  it('should run a test', async () => {
    const data = await GitHub.read({
      token: process.env.GITHUB_API_TOKEN || '',
      owner: 'jollyjerr',
      repo: 'mindgraph',
      basePath: 'packages/draw/example/notes',
    });

    console.log(data);
  });
});
