import { describe, expect, it } from 'vitest';
import { FileSystem } from './file-system';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

describe('FileSystem Provider', () => {
  it('should produce the expected graph', async () => {
    const graph = await FileSystem.read({
      path: path.resolve(__dirname, '../../../../', 'draw', 'example', 'notes'),
    });

    expect(graph).toMatchSnapshot();
  });
});
