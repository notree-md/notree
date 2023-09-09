export type ServerNode = {
  id: string;
  title: string;
  parentNodes: ServerNode['id'][];
  childNodes: ServerNode['id'][];
  parentLinks: ServerLink['id'][];
  childLinks: ServerLink['id'][];
};

export type ServerLink = {
  id: string;
  source: string;
  target: string;
};

export type GraphDataPayload = {
  nodes: Record<string, ServerNode>;
  links: Record<string, ServerLink>;
};

export type Node = {
  id: string;
  title: string;
  childNodes: Node[];
  childLinks: Link[];
  parentNodes: Node[];
  parentLinks: Link[];
};

export type Link = {
  source: Node;
  target: Node;
};

export type GraphData = {
  nodes: Node[];
  links: Link[];
};
