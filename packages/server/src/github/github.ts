import axios from 'axios';
import { GraphDataPayload } from '@notree/common';
import { Provider } from '../types';
import { Octokit } from 'octokit';
import {
  HIDDEN_FILES_REGEX,
  backfillGraph,
  extractLinksFromLine,
  newNode,
} from '../common';

const DEFAULT_BRANCH_NAME = 'main';
const DEFAULT_BASE_PATH = '';

export interface GitHubProviderArgs {
  token: string;
  owner: string;
  repo: string;
  branch?: string;
  basePath?: string;
}

export const GitHub: Provider<GitHubProviderArgs> = {
  async read({
    token,
    owner,
    repo,
    branch = DEFAULT_BRANCH_NAME,
    basePath = DEFAULT_BASE_PATH,
  }) {
    const octo = new Octokit({ auth: token });

    const {
      data: { ref },
    } = await octo.rest.git.getRef({
      owner,
      repo,
      ref: `heads/${branch}`,
    });

    const data = await build_graph(octo, { owner, repo, path: basePath, ref });
    return backfillGraph(data);
  },
};

type GitHubResult = {
  name: string;
  type: 'file' | 'dir';
  url: string;
  download_url: string | null;
};

type BuildGraphArgs = Pick<GitHubProviderArgs, 'owner' | 'repo'> & {
  path: string;
  ref: string;
};

type AddResultToGraphArgs = BuildGraphArgs & { result: GitHubResult };

async function build_graph(
  octo: Octokit,
  { owner, repo, path, ref }: BuildGraphArgs,
  graph: GraphDataPayload = { nodes: {}, links: {} },
) {
  const dir = await octo.rest.repos
    .getContent({
      owner,
      repo,
      path,
      ref,
    })
    .then((response) => response.data as GitHubResult[]);

  await Promise.all(
    dir.map((result) =>
      add_result_to_graph(
        octo,
        {
          owner,
          repo,
          path,
          ref,
          result,
        },
        graph,
      ),
    ),
  );

  return graph;
}

async function add_result_to_graph(
  octo: Octokit,
  { result, path, owner, repo, ref }: AddResultToGraphArgs,
  graph: GraphDataPayload,
) {
  if (HIDDEN_FILES_REGEX.test(result.name)) return;

  const resultPath = `${path}/${result.name}`;
  if (result.type === 'dir') {
    await build_graph(octo, { owner, repo, path: resultPath, ref }, graph);
  } else if (result.type === 'file') {
    await add_links_to_graph({ result, path: resultPath }, graph);
    graph.nodes[resultPath] = newNode({ id: resultPath, title: result.name });
  }
}

async function add_links_to_graph(
  { result, path }: Pick<AddResultToGraphArgs, 'result' | 'path'>,
  graph: GraphDataPayload,
): Promise<void> {
  if (!result.download_url) return;

  const lines = await axios
    .get<string>(result.download_url)
    .then((r) => r.data)
    .then((c) => c.split('\n'));

  for (const line of lines) {
    const links = extractLinksFromLine(line, path);

    for (const link of links) {
      if (graph.links[link.id]) {
        link.id = link.id + '_';
      }

      graph.links[link.id] = link;
    }
  }
}
