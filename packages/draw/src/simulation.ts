import { GraphData } from '@mindgraph/types';
import { map } from 'd3-array';
import { SimulationNodeDatum } from 'd3-force';
import { SimulationNode } from './types';

export function createSimulationNodeDatums({ nodes, links }: GraphData) {
  return {
    nodes: map(nodes, merge_node_datum) as SimulationNode[],
    links: map(links, merge_node_datum) as unknown as (SimulationNodeDatum & {
      source: SimulationNode;
      target: SimulationNode;
    })[],
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

function merge_node_datum<TDatum extends Record<string, string | number>>(
  datum: TDatum,
) {
  return {
    ...empty_node_datum,
    ...datum,
  };
}
