import { describe, expect, it } from 'vitest';
import { extractLinksFromLine } from './common';

describe('Read package common functions', () => {
  it('a line with no links returns 0 links', async () => {
    const links = extractLinksFromLine('hello, world!', '');
    expect(links.length).eq(0);
  });

  it('a line with a single link returns the links', async () => {
    const links = extractLinksFromLine(
      '[next](./next.md)',
      'path/to/notes/currentfile.md',
    );
    expect(links).toStrictEqual([
      {
        source: 'path/to/notes/currentfile.md',
        target: 'path/to/notes/next.md',
      },
    ]);
  });

  it('a line with multiple links correctly handles the links', async () => {
    const links = extractLinksFromLine(
      '[firstlink](./firstlink.md) [secondlink](./secondlink.md)',
      'path/to/notes/currentfile.md',
    );
    expect(links).toStrictEqual([
      {
        source: 'path/to/notes/currentfile.md',
        target: 'path/to/notes/firstlink.md',
      },
      {
        source: 'path/to/notes/currentfile.md',
        target: 'path/to/notes/secondlink.md',
      },
    ]);
  });

  it("relative paths with too many parent references doesn't break", async () => {
    const links = extractLinksFromLine(
      '[link](../../../../../../link.md)',
      'path/to/notes/current.md',
    );
    expect(links).toStrictEqual([
      {
        source: 'path/to/notes/current.md',
        target: 'link.md',
      },
    ]);
  });
});
