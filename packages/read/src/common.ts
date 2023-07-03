import { GraphData } from '@mindgraph/types';

export const MARKDOWN_EXTENSION = '.md';
export const HIDDEN_FILES_REGEX = /^\./;
export const LINK_CONTENT_REGEX = /\]\((.*?)\)/g;

export function formatGraphForTestSnapshot(data: GraphData) {
  return {
    nodes: data.nodes
      .map((n) => ({ name: n.name, linkCount: n.linkCount }))
      .sort((a, b) => (a.name > b.name ? 1 : -1)),
    links: data.links
      .map((l) => ({
        source: l.source.split('/').at(-1)!,
        target: l.target.split('/').at(-1),
      }))
      .sort((a, b) => (a.source > b.source ? 1 : -1)),
  };
}

export function extractLinksFromLine(
  line: string,
  filePath: string,
): GraphData['links'] {
  const formattedLinks = [];
  const links = line.matchAll(LINK_CONTENT_REGEX) || [];

  for (const link of links) {
    const path = link.at(1);

    if (is_valid_link_path(path)) {
      const linkDirections = path.split('/');
      const pathToTargetFile = filePath.split('/');

      pathToTargetFile.pop();

      for (const direction of linkDirections) {
        switch (direction) {
          case '.':
            break;
          case '..':
            pathToTargetFile.pop();
            break;
          default:
            pathToTargetFile.push(direction);
        }
      }

      formattedLinks.push({
        source: filePath,
        target: pathToTargetFile.join('/'),
      });
    }
  }

  return formattedLinks;
}

function is_valid_link_path(path: string | undefined): path is string {
  return !!(path && !path.includes('://') && path.includes(MARKDOWN_EXTENSION));
}
