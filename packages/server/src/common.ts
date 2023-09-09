import { GraphDataPayload, ServerLink, ServerNode } from '@notree/common';

export const MARKDOWN_EXTENSION = '.md';
export const HIDDEN_FILES_REGEX = /^\./;
export const LINK_CONTENT_REGEX = /\]\((.*?)\)/g;
export const PROTOCOL_DELIMITER = '://';

export function extractLinksFromLine(
  line: string,
  filePath: string,
): ServerLink[] {
  const formattedLinks = [];
  const links = line.matchAll(LINK_CONTENT_REGEX) || [];

  for (const link of links) {
    const path = link.at(1);

    if (is_valid_link_path(path)) {
      const linkPathParts = path.split('/');
      const pathToTargetFile = filePath.split('/');

      pathToTargetFile.pop();

      for (const part of linkPathParts) {
        switch (part) {
          case '.':
            break;
          case '..':
            pathToTargetFile.pop();
            break;
          default:
            pathToTargetFile.push(part);
        }
      }

      formattedLinks.push(
        new_link({
          source: filePath,
          target: pathToTargetFile.join('/'),
        }),
      );
    }
  }

  return formattedLinks;
}

export function formatGraphForTestSnapshot(data: GraphDataPayload) {
  return {
    nodes: Object.values(data.nodes)
      .map((n) => ({
        title: n.title,
        parentNodes: n.parentNodes.map(truncate_path_for_test_snapshot),
        parentLinks: n.parentLinks.map(truncate_path_for_test_snapshot),
        childNodes: n.childNodes.map(truncate_path_for_test_snapshot),
        childLinks: n.childLinks.map(truncate_path_for_test_snapshot),
      }))
      .sort((a, b) => (a.title > b.title ? 1 : -1)),
    links: Object.values(data.links)
      .map((l) => ({
        source: truncate_path_for_test_snapshot(l.source),
        target: truncate_path_for_test_snapshot(l.target),
      }))
      .sort((a, b) => (a.source > b.source ? 1 : -1)),
  };
}

export function newNode({
  id,
  title,
}: Pick<ServerNode, 'id' | 'title'>): ServerNode {
  return {
    id,
    title,
    parentLinks: [],
    parentNodes: [],
    childLinks: [],
    childNodes: [],
  };
}

export function new_link({
  source,
  target,
}: Pick<ServerLink, 'source' | 'target'>) {
  return {
    source,
    target,
    id: link_id({ source, target }),
  };
}

function link_id({ source, target }: Pick<ServerLink, 'source' | 'target'>) {
  return `${source}:${target}`;
}

function truncate_path_for_test_snapshot(path: string) {
  return path.split('/').at(-1) || 'none';
}

function is_valid_link_path(path: string | undefined): path is string {
  return !!(
    path &&
    !path.includes(PROTOCOL_DELIMITER) &&
    path.includes(MARKDOWN_EXTENSION)
  );
}
