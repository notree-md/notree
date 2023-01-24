import { GraphData } from '@mindgraph/types';
import { map } from 'd3-array';
import { SimulationNode } from './types';
import {
  SimulationNodeDatum,
  forceSimulation,
  forceManyBody,
  forceCenter,
  forceLink,
} from 'd3-force';

export function loadSimulationNodeDatums({ nodes, links }: GraphData) {
  return {
    nodes: map(nodes, merge_node_datum) as SimulationNode[],
    links: map(links, merge_node_datum) as unknown as (SimulationNodeDatum & {
      source: SimulationNode;
      target: SimulationNode;
    })[],
  };
}

export type BuildSimulationArgs = {
  width: number;
  height: number;
} & ReturnType<typeof loadSimulationNodeDatums>;

export function buildSimulation({
  nodes,
  links,
  width,
  height,
}: BuildSimulationArgs) {
  return forceSimulation(nodes)
    .force('charge', forceManyBody().strength(-400))
    .force('center', forceCenter(width / 2, height / 2).strength(0.28))
    .force(
      'link',
      forceLink(links)
        .id((l) => (l as SimulationNode).id)
        .strength(0.06),
    );
}

function merge_node_datum<TDatum extends Record<string, string | number>>(
  datum: TDatum,
) {
  return {
    ...empty_node_datum,
    ...datum,
  };
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
