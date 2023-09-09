import { GraphDataPayload } from '@notree/common';
import * as fs from 'fs';
import * as readline from 'node:readline';
import {
  HIDDEN_FILES_REGEX,
  extractLinksFromLine,
  backfillGraph,
  newNode,
} from '../common';
import { Provider } from '../types';

export interface FileSystemProviderArgs {
  path: string;
}

export const FileSystem: Provider<FileSystemProviderArgs> = {
  async read({ path }) {
    const data = await gather_objects_from_directory(path);
    return backfillGraph(data);
  },
};

async function gather_objects_from_directory(
  path: string,
  data: GraphDataPayload = { nodes: {}, links: {} },
): Promise<GraphDataPayload> {
  const directory = await fs.promises.opendir(path);

  for await (const dirent of directory) {
    if (HIDDEN_FILES_REGEX.test(dirent.name)) continue;

    const direntPath = `${path}/${dirent.name}`;
    if (dirent.isDirectory()) {
      await gather_objects_from_directory(direntPath, data);
    } else if (dirent.isFile()) {
      await gather_links_from_file(direntPath, data);
      data.nodes[direntPath] = newNode({ id: direntPath, title: dirent.name });
    }
  }

  return data;
}

async function gather_links_from_file(
  filePath: string,
  data: GraphDataPayload,
): Promise<void> {
  const fileStream = fs.createReadStream(filePath);
  const lines = readline.createInterface({ input: fileStream });

  for await (const line of lines) {
    const links = extractLinksFromLine(line, filePath);
    for (const link of links) {
      if (data.links[link.id]) {
        link.id = link.id + '_';
      }

      data.links[link.id] = link;
    }
  }
}
