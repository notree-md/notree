export type NodeBase = {
  id: string;
  name: string;
  linkCount: number;
};

export type Link = {
  source: string;
  target: string;
};

export type GraphData<TNode extends NodeBase = NodeBase> = {
  nodes: TNode[];
  links: Link[];
};
