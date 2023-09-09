import { GraphDataPayload, ServerLink, ServerNode } from '@notree/common';

export type Node = {
  id: string;
  title: string;
  totalDescendants: number;
  parentNodes: Node[];
  childNodes: Node[];
  parentLinks: Link[];
  childLinks: Link[];
  seen?: true;
};

export type Link = {
  source: Node;
  target: Node;
  seen?: true;
};

export class GraphData {
  public readonly nodes: Node[];
  public readonly links: Link[];
  constructor({ nodes, links }: GraphDataPayload) {
    const convert_link = (link: ServerLink | Link) => {
      if (link_converted(link)) return link;

      const convertedLink = link as unknown as Link;
      convertedLink.seen = true;

      convertedLink.source = convert_node(nodes[link.source]);
      convertedLink.target = convert_node(nodes[link.target]);

      return convertedLink;
    };

    const convert_node = (node: ServerNode | Node) => {
      if (node_converted(node)) return node;

      const convertedNode = node as unknown as Node;
      convertedNode.seen = true;

      convertedNode.childNodes = node.childNodes.map((id) =>
        convert_node(nodes[id]),
      );
      convertedNode.parentNodes = node.parentNodes.map((id) =>
        convert_node(nodes[id]),
      );
      convertedNode.parentLinks = node.parentLinks.map((id) =>
        convert_link(links[id]),
      );
      convertedNode.childLinks = node.childLinks.map((id) =>
        convert_link(links[id]),
      );

      return convertedNode;
    };

    for (const node of Object.values(nodes)) {
      convert_node(node);
    }

    for (const link of Object.values(links)) {
      convert_link(link);
    }

    this.nodes = Object.values(nodes) as unknown as Node[];
    this.links = Object.values(links) as unknown as Link[];
    this.cleanup();
  }

  private cleanup() {
    for (const node of this.nodes) {
      delete node.seen;
    }

    for (const link of this.links) {
      delete link.seen;
    }
  }
}

function node_converted(node: ServerNode | Node): node is Node {
  return !!(node as Node).seen;
}

function link_converted(link: ServerLink | Link): link is Link {
  return !!(link as Link).seen;
}
