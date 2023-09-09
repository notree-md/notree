export type Node = {
  id: string;
  title: string;
  childNodes: Node[];
  childLinks: Link[];
  parentNodes: Node[];
  parentLinks: Link[];
};

export type Link = {
  source: Node['id'];
  target: Node['id'];
};

export type GraphData = {
  nodes: Node[];
  links: Link[];
};
