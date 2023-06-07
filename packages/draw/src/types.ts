import type { GraphData } from '@mindgraph/types';
import { SimulationNodeDatum } from 'd3-force';

export type SimulationNode = SimulationNodeDatum & GraphData['nodes'][0];

export type NodeClickCallback<TReturn = void> = (
  node: SimulationNode,
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
  minimumNodeSize: number;
  nodeScaleFactor: number;
};

export type GraphSimulationConfig = {
  minZoom: number;
  maxZoom: number;
  chargeStrength: number;
  centerStrength: number;
  linkStrength: number;
  alpha: number;
  alphaDecay: number;
  initialClusterStrength: number;
  randomizeStartingPoints?: boolean;
};

export interface MindGraphConfig {
  data: GraphData;
  style?: Partial<GraphStyleConfig>;
  simulationConfig?: Partial<GraphSimulationConfig>;
  canvas: HTMLCanvasElement;
}
