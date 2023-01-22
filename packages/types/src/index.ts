export type Node = {
  id: string;
  name: string;
  linkCount: number;
};

export type Link = {
  source: string;
  target: string;
};

export type GraphData = {
  nodes: Node[];
  links: Link[];
};
