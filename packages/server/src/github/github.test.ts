import { config } from 'dotenv';
import { assert, describe, expect, it } from 'vitest';
import { GitHub } from './github';
import { formatGraphForTestSnapshot } from '../common';
import path from 'path';

config({ path: path.join(__dirname, '../../../../.env') });

describe('GitHub provider', () => {
  it('should produce the expected graph', async () => {
    const token = process.env.GITHUB_TOKEN;
    assert(token && token.length > 1, 'No GitHub token found! 😱');

    const branch = process.env.GITHUB_HEAD_REF || 'main';
    console.info(`Using test data from ref: ${branch} 😎`);

    const graph = await GitHub.read({
      owner: 'notree-md',
      repo: 'notree',
      basePath: 'packages/ui/example/notes',
      branch,
      token,
    });

    expect(formatGraphForTestSnapshot(graph)).toMatchFileSnapshot(
      '../__snapshots__/out.json',
    );
  });
});
