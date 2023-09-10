import { SimulationNodeDatum } from 'd3-force';
import { Renderable } from './canvas';

export type Node = {
  id: string;
  title: string;
  totalDescendants: number;
  parentNodes: Node[];
  childNodes: Node[];
  parentLinks: Link[];
  childLinks: Link[];
  renderable: Renderable;
  converted?: true;
} & SimulationNodeDatum;

export type Link = {
  source: Node;
  target: Node;
  renderable: Renderable;
  converted?: true;
} & SimulationNodeDatum;

export type GraphData = {
  nodes: Node[];
  links: Link[];
};

export type Focus = 'active' | 'neutral' | 'inactive';

export type Circle = {
  x?: number;
  y?: number;
  radius: number;
};

export type Line = {
  source: {
    x?: number;
    y?: number;
  };
  target: {
    x?: number;
    y?: number;
  };
};

export type NodeClickEvent = { offsetX: number; offsetY: number };
export type NodeClickCallback = (node: Node) => void;

export type GraphStyleConfig = {
  nodeColor: string;
  activeNodeColor: string;
  hoverAnimationDuration: number;
  linkColor: string;
  activeLinkColor: string;
  titleColor: string;
  nodeTitlePadding: number;
  activeNodeTitlePadding: number;
  activeNodeRadiusPadding: number;
  minimumNodeSize: number;
  nodeScaleFactor: number;
  minZoom: number;
  maxZoom: number;
  dimmedLayerOpacity: number;
  dimmingLayerDuration: number;
};

export type GraphSimulationConfig = {
  chargeStrength: number;
  centerStrength: number;
  linkStrength: number;
  alpha: number;
  alphaDecay: number;
  initialClusterStrength: number;
  randomizeStartingPoints?: boolean;
};
