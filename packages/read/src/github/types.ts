export interface RefResponse {
  ref: string;
  node_id: string;
  url: string;
  object: {
    type: string;
    sha: string;
    url: string;
  };
}

export interface TreeResponse {
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
