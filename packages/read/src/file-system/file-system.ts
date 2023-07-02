import { GraphData } from '@mindgraph/types';
import * as fs from 'fs';
import * as readline from 'node:readline';
import {
  HIDDEN_FILES_REGEX,
  LINK_CONTENT_REGEX,
  MARKDOWN_EXTENSION,
} from '../constants';
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
    const links = line.match(LINK_CONTENT_REGEX) || [];

    for (const link of links) {
      const path = LINK_CONTENT_REGEX.exec(link)?.at(1);

      if (is_valid_link_path(path)) {
        linkCount++;

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

        graph.links.push({
          source: filePath,
          target: pathToTargetFile.join('/'),
        });
      }
    }
  }

  return linkCount;
}

function is_valid_link_path(path: string | undefined): path is string {
  return !!(path && !path.includes('://') && path.includes(MARKDOWN_EXTENSION));
}
