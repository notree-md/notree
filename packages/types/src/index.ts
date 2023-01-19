export type NodeBase = {
  id: string;
  name: string;
  linkCount: number;
};

export type LinkBase = {
  source: string;
  target: string;
};

export type GraphData<
  TNode extends NodeBase = NodeBase,
  TLink extends LinkBase = LinkBase,
> = {
  nodes: TNode[];
  links: TLink[];
};
