import { GraphData } from '@mindgraph/types';
import * as fs from 'fs';
import * as readline from 'node:readline';
import { HIDDEN_FILES_REGEX, extractLinksFromLine } from '../common';
import { Provider } from '../types';

export interface FileSystemProviderArgs {
  path: string;
}

export const FileSystem: Provider<FileSystemProviderArgs> = {
  async read({ path }) {
    return build_graph(path);
  },
};

async function build_graph(
  path: string,
  graph: GraphData = { nodes: [], links: [] },
): Promise<GraphData> {
  const dir = await fs.promises.opendir(path);

  for await (const dirent of dir) {
    await add_dirent_to_graph(path, dirent, graph);
  }

  return graph;
}

async function add_dirent_to_graph(
  path: string,
  dirent: fs.Dirent,
  graph: GraphData,
) {
  if (HIDDEN_FILES_REGEX.test(dirent.name)) return;

  const direntPath = `${path}/${dirent.name}`;

  if (dirent.isDirectory()) {
    await build_graph(direntPath, graph);
  } else if (dirent.isFile()) {
    const linkCount = await add_links_to_graph(direntPath, graph);

    graph.nodes.push({
      id: direntPath,
      name: dirent.name,
      linkCount,
    });
  }
}

async function add_links_to_graph(
  filePath: string,
  graph: GraphData,
): Promise<number> {
  let linkCount = 0;

  const fileStream = fs.createReadStream(filePath);
  const lines = readline.createInterface({ input: fileStream });

  for await (const line of lines) {
    const links = extractLinksFromLine(line, filePath);
    linkCount += links.length;

    for (const link of links) {
      graph.links.push(link);
    }
  }

  return linkCount;
}
