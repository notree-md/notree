import axios from 'axios';
import { GraphData } from '@mindgraph/types';
import { Provider } from '../types';
import { Octokit } from 'octokit';
import { HIDDEN_FILES_REGEX, extractLinksFromLine } from '../common';

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

    return build_graph(octo, { owner, repo, path: basePath, ref });
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
  graph: GraphData = { nodes: [], links: [] },
) {
  const dir = await octo.rest.repos
    .getContent({
      owner,
      repo,
      path,
      ref,
    })
    .then((response) => response.data as GitHubResult[]);

  for (const result of dir) {
    await add_result_to_graph(
      octo,
      {
        owner,
        repo,
        path,
        ref,
        result,
      },
      graph,
    );
  }

  return graph;
}

async function add_result_to_graph(
  octo: Octokit,
  { result, path, owner, repo, ref }: AddResultToGraphArgs,
  graph: GraphData,
) {
  if (HIDDEN_FILES_REGEX.test(result.name)) return;

  const resultPath = `${path}/${result.name}`;

  if (result.type === 'dir') {
    await build_graph(octo, { owner, repo, path: resultPath, ref }, graph);
  } else if (result.type === 'file') {
    const linkCount = await add_links_to_graph(
      { result, path: resultPath },
      graph,
    );

    graph.nodes.push({
      id: resultPath,
      name: result.name,
      linkCount,
    });
  }
}

async function add_links_to_graph(
  { result, path }: Pick<AddResultToGraphArgs, 'result' | 'path'>,
  graph: GraphData,
): Promise<number> {
  if (!result.download_url) return 0;

  let linkCount = 0;

  const lines = await axios
    .get<string>(result.download_url)
    .then((r) => r.data)
    .then((c) => c.split('\n'));

  for (const line of lines) {
    const links = extractLinksFromLine(line, path);
    linkCount += links.length;

    for (const link of links) {
      graph.links.push(link);
    }
  }

  return linkCount;
}
