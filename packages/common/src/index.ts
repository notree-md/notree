export type Node = {
  id: string;
  title: string;
  totalDescendants: number;
  parentNodes: Node['id'][];
  childNodes: Node['id'][];
  parentLinks: Link['id'][];
  childLinks: Link['id'][];
};

export type Link = {
  id: string;
  source: string;
  target: string;
};

export type GraphDataPayload = {
  nodes: Record<string, Node>;
  links: Record<string, Link>;
};
