import { GraphData } from '@mindgraph/types';
import { map } from 'd3-array';
import { GraphSimulationConfig, SimulationNode } from './types';
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
} & ReturnType<typeof loadSimulationNodeDatums> &
  GraphSimulationConfig;

export function buildSimulation({
  nodes,
  links,
  width,
  height,
  chargeStrength,
  centerStrength,
  linkStrength,
  alpha,
  alphaDecay,
  initialClusterStrength,
}: BuildSimulationArgs) {
  // https://gist.github.com/mbostock/7881887
  nodes.forEach((node, i) => {
    node.x =
      Math.cos((i / initialClusterStrength) * 2 * Math.PI) * 200 +
      width / 2 +
      Math.random();
    node.y =
      Math.sin((i / initialClusterStrength) * 2 * Math.PI) * 200 +
      height / 2 +
      Math.random();
  });

  return forceSimulation(nodes)
    .force('charge', forceManyBody().strength(chargeStrength))
    .force(
      'center',
      forceCenter(width / 2, height / 2).strength(centerStrength),
    )
    .force(
      'link',
      forceLink(links)
        .id((l) => (l as SimulationNode).id)
        .strength(linkStrength),
    )
    .alpha(alpha)
    .alphaDecay(alphaDecay);
}

export function getSimulationConfig(
  simulationConfig: Partial<GraphSimulationConfig> | undefined,
) {
  return {
    ...default_simulation_config,
    ...simulationConfig,
  };
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

const default_simulation_config: GraphSimulationConfig = {
  minZoom: 0.4,
  maxZoom: 16,
  chargeStrength: -400,
  centerStrength: 0.28,
  linkStrength: 0.06,
  alpha: 0.4,
  alphaDecay: 0.01,
  initialClusterStrength: 8,
};
