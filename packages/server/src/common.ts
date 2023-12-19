import { GraphDataPayload, Link, Node } from '@notree/common';

export const MARKDOWN_EXTENSION = '.md';
export const HIDDEN_FILES_REGEX = /^\./;
export const LINK_CONTENT_REGEX = /\]\((.*?)\)/g;
export const PROTOCOL_DELIMITER = '://';

export function extractLinksFromLine(line: string, filePath: string): Link[] {
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
        childNodes: n.childNodes.map(truncate_path_for_test_snapshot),
        totalDescendants: n.totalDescendants,
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

export function newNode({ id, title }: Pick<Node, 'id' | 'title'>): Node {
  return {
    id,
    title,
    totalDescendants: 0,
    parentLinks: [],
    parentNodes: [],
    childLinks: [],
    childNodes: [],
  };
}

export function backfillGraph(data: GraphDataPayload): GraphDataPayload {
  for (const link of Object.values(data.links)) {
    data.nodes[link.source].childLinks.push(link.id);
    data.nodes[link.source].childNodes.push(link.target);
    data.nodes[link.target].parentLinks.push(link.id);
    data.nodes[link.target].parentNodes.push(link.source);
  }

  for (const node of Object.values(data.nodes)) {
    node.totalDescendants = count_children(node, data);
  }

  return data;
}

function count_children(
  node: Node,
  data: GraphDataPayload,
  seen: Record<string, boolean> = {},
) {
  let count = node.childNodes.length;
  if (!count) return count;

  for (const child of node.childNodes) {
    if (!seen[child]) {
      seen[child] = true;
      count += count_children(data.nodes[child], data, seen);
    }
  }

  return count;
}

function new_link({ source, target }: Pick<Link, 'source' | 'target'>) {
  return {
    source,
    target,
    id: link_id({ source, target }),
  };
}

function link_id({ source, target }: Pick<Link, 'source' | 'target'>) {
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
