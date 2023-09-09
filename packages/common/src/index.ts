export type ServerNode = {
  id: string;
  title: string;
  totalDescendants: number;
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
