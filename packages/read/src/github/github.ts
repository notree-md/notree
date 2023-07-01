import { Axios } from 'axios';
import { Provider } from '../types';

const GITHUB_API_VERSION = '2022-11-28';
const GITHUB_BASE_URL = 'https://api.github.com';
const DEFAULT_BRANCH_NAME = 'main';

interface GitHubProviderArgs {
  token: string;
  owner: string;
  repo: string;
  branch?: string;
}

interface RefResponse {
  ref: string;
  node_id: string;
  url: string;
  object: {
    type: string;
    sha: string;
    url: string;
  };
}

interface TreeResponse {
  sha: string;
  url: string;
  truncated: boolean;
  tree: {
    path: string;
    mode: string;
    type: string;
    size: string;
    sha: string;
    url: string;
  }[];
}

export const GitHub: Provider<GitHubProviderArgs> = {
  async read({ token, owner, repo, branch = DEFAULT_BRANCH_NAME }) {
    const instance = new GitHubApi(token);
    const {
      data: {
        object: { sha: treeSha },
      },
    } = await instance.getReference({ repo, owner, branch });
    const { data } = await instance.getTree({ repo, owner, treeSha });
    return {};
  },
};

class GitHubApi {
  constructor(token: string) {
    this.instance = authenticated_instance(token);
  }

  /** https://docs.github.com/en/rest/git/refs?apiVersion=2022-11-28#get-a-reference */
  public async getReference({
    repo,
    owner,
    branch,
  }: Pick<GitHubProviderArgs, 'repo' | 'owner' | 'branch'>) {
    return this.instance.get<RefResponse>(
      `/repos/${owner}/${repo}/git/ref/${branch}`,
    );
  }

  /** https://docs.github.com/en/rest/git/trees?apiVersion=2022-11-28#get-a-tree */
  public async getTree({
    repo,
    owner,
    treeSha,
  }: Pick<GitHubProviderArgs, 'repo' | 'owner'> & { treeSha: string }) {
    return this.instance.get<TreeResponse>(
      `/repos/${owner}/${repo}/git/trees/${treeSha}`,
    );
  }

  private instance: Axios;
}

function authenticated_instance(token: string) {
  return new Axios({
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': GITHUB_API_VERSION,
    },
    baseURL: GITHUB_BASE_URL,
  });
}
