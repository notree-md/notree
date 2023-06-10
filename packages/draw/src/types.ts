import type { Node } from '@mindgraph/types';
import { SimulationNodeDatum } from 'd3-force';

export type RenderableNode = {
  x?: number;
  y?: number;
  radius: number;
  id: string;
  text: string;
};

export type RenderableLink = {
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

export type NodeClickCallback<TReturn = void> = (
  node: RenderableNode,
) => TReturn;

export type MindGraphEvent = 'nodeClick';

export type NodeClickEvent = { layerX: number; layerY: number };

export type GraphStyleConfig = {
  nodeColor: string;
  activeNodeColor: string;
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

export interface MindGraphConfig {
  style?: Partial<GraphStyleConfig>;
  canvas: HTMLCanvasElement;
}
