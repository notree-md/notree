import type { Node } from '@notree/common';
import { SimulationNodeDatum } from 'd3-force';

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
