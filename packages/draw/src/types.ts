import type { GraphData } from '@mindgraph/types';
import { SimulationNodeDatum } from 'd3-force';
import { ZoomTransform } from 'd3-zoom';

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
};

export interface MindGraphConfig {
  data: GraphData;
  canvasElement: HTMLCanvasElement;
  onNodeClick?: NodeClickCallback;
  style?: Partial<GraphStyleConfig>;
  zoomTransform?: ZoomTransform;
}
