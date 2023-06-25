import type { Node } from '@mindgraph/types';
import { SimulationNodeDatum } from 'd3-force';

export interface MindGraphConfig {
  style?: Partial<GraphStyleConfig>;
  canvas: HTMLCanvasElement;
}

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

export type SimulationNode = SimulationNodeDatum & Node;

export type SimulationLink = SimulationNodeDatum & {
  source: SimulationNode;
  target: SimulationNode;
};

export type NodeClickEvent = { layerX: number; layerY: number };

export type NodeClickCallback = (node: SimulationNode) => void;

export type GraphStyleConfig = {
  nodeColor: string;
  activeNodeColor: string;
  dimmedNodeColor: string;
  hoverAnimationDuration: number;
  linkColor: string;
  activeLinkColor: string;
  dimmedLinkColor: string;
  titleColor: string;
  nodeTitlePadding: number;
  activeNodeTitlePadding: number;
  activeNodeRadiusPadding: number;
  minimumNodeSize: number;
  nodeScaleFactor: number;
  minZoom: number;
  maxZoom: number;
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
