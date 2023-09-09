import { GraphData, Node, Link } from '@notree/common';
import * as fs from 'fs';
import * as readline from 'node:readline';
import { HIDDEN_FILES_REGEX, extractLinksFromLine, newNode } from '../common';
import { Provider } from '../types';

type Objects = Record<string, Node | Link>;

export interface FileSystemProviderArgs {
  path: string;
}

export const FileSystem: Provider<FileSystemProviderArgs> = {
  async read({ path }) {
    const objects = await gather_objects_from_directory(path);

    const graphData: GraphData = { nodes: [], links: [] };

    for (const [, item] of Object.entries(objects)) {
      if (!isNode(item)) {
        item.source.childLinks.push(item);
        item.source.childNodes.push(item.target);
        item.target.parentLinks.push(item);
        item.target.parentNodes.push(item.source);

        graphData.links.push(item);
      } else {
        graphData.nodes.push(item);
      }
    }

    return graphData;
  },
};

async function gather_objects_from_directory(
  path: string,
  objects: Objects = {},
): Promise<Objects> {
  const directory = await fs.promises.opendir(path);

  for await (const dirent of directory) {
    if (HIDDEN_FILES_REGEX.test(dirent.name)) continue;

    const direntPath = `${path}/${dirent.name}`;
    if (dirent.isDirectory()) {
      await gather_objects_from_directory(direntPath, objects);
    } else if (dirent.isFile()) {
      objects[direntPath] = newNode({ id: direntPath, title: dirent.name });
    }
  }

  const allNodeIds = Object.keys(objects);

  for (const id of allNodeIds) {
    const item = objects[id];
    if (isNode(item)) {
      await gather_links_from_file(item.id, objects);
    }
  }

  return objects;
}

async function gather_links_from_file(filePath: string, objects: Objects) {
  const fileStream = fs.createReadStream(filePath);
  const lines = readline.createInterface({ input: fileStream });

  for await (const line of lines) {
    const links = extractLinksFromLine(line, filePath);
    for (const link of links) {
      objects[link.source + link.target] = {
        source: objects[link.source] as Node,
        target: objects[link.target] as Node,
      };
    }
  }
}

function isNode(item: Node | Link): item is Node {
  return (item as Node).id !== undefined;
}
