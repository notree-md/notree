import type { GraphData } from '@mindgraph/types';
import { SimulationNodeDatum } from 'd3-force';

export type SimulationNode = SimulationNodeDatum & GraphData['nodes'][0];

export type NodeClickCallback<TReturn = void> = (
  node: SimulationNode,
) => TReturn;

export type NodeClickEvent = { layerX: number; layerY: number };

export type GraphStyleConfig = {
  nodeColor: string;
  linkColor: string;
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
};

export interface MindGraphConfig {
  data: GraphData;
  canvasElement: HTMLCanvasElement;
  onNodeClick?: NodeClickCallback;
  style?: Partial<GraphStyleConfig>;
  simulationConfig?: Partial<GraphSimulationConfig>;
}
