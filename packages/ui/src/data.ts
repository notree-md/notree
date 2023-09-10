import { GraphDataPayload, ServerLink, ServerNode } from '@notree/common';
import { RenderableLink, RenderableNode } from './renderables';
import { GraphData, Link, Node } from './types';
import { Styles } from './style';

export function convertInPlace({
  data: { nodes, links },
  styles,
}: {
  data: GraphDataPayload;
  styles: Styles;
}): GraphData {
  const convert_link = (link: ServerLink | Link) => {
    if (link_converted(link)) return link;

    const convertedLink = link as unknown as Link;
    convertedLink.converted = true;

    convertedLink.source = convert_node(nodes[link.source]);
    convertedLink.target = convert_node(nodes[link.target]);

    for (const [key, value] of Object.entries(empty_node_datum)) {
      convertedLink[key as keyof typeof empty_node_datum] = value;
    }

    convertedLink.renderable = new RenderableLink(convertedLink, styles);

    return convertedLink;
  };

  const convert_node = (node: ServerNode | Node) => {
    if (node_converted(node)) return node;

    const convertedNode = node as unknown as Node;
    convertedNode.converted = true;

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

    for (const [key, value] of Object.entries(empty_node_datum)) {
      convertedNode[key as keyof typeof empty_node_datum] = value;
    }

    convertedNode.renderable = new RenderableNode(convertedNode, styles);

    return convertedNode;
  };

  for (const node of Object.values(nodes)) {
    convert_node(node);
  }

  return {
    nodes: Object.values(nodes) as unknown as Node[],
    links: Object.values(links) as unknown as Link[],
  };
}

function node_converted(node: ServerNode | Node): node is Node {
  return !!(node as Node).converted;
}

function link_converted(link: ServerLink | Link): link is Link {
  return !!(link as Link).converted;
}

const empty_node_datum = {
  index: undefined,
  x: undefined,
  y: undefined,
  vx: undefined,
  vy: undefined,
  fx: undefined,
  fy: undefined,
};
