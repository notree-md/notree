import { GraphSimulationConfig } from './types';
import { Node, Link } from './models';
import {
  forceSimulation,
  forceManyBody,
  forceCenter,
  forceLink,
} from 'd3-force';

export interface ForceSimulationArgs {
  data: {
    nodes: Node[];
    links: Link[];
  };
  width: number;
  height: number;
  simulationConfig?: Partial<GraphSimulationConfig>;
}

export function startForceSimulation({
  data: { nodes, links },
  simulationConfig,
  width,
  height,
}: ForceSimulationArgs) {
  const {
    initialClusterStrength,
    chargeStrength,
    linkStrength,
    centerStrength,
    alpha,
    alphaDecay,
    randomizeStartingPoints,
  } = {
    ...default_simulation_config,
    ...simulationConfig,
  };

  // https://gist.github.com/mbostock/7881887
  nodes.forEach((node, i) => {
    const randomX = randomizeStartingPoints ? Math.random() : 0;
    const randomY = randomizeStartingPoints ? Math.random() : 0;
    node.x =
      Math.cos((i / initialClusterStrength) * 2 * Math.PI) * 200 +
      width / 2 +
      randomX;
    node.y =
      Math.sin((i / initialClusterStrength) * 2 * Math.PI) * 200 +
      height / 2 +
      randomY;
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
        .id((l) => (l as Node).id)
        .strength(linkStrength),
    )
    .alpha(alpha)
    .alphaDecay(alphaDecay);
}

const default_simulation_config: GraphSimulationConfig = {
  chargeStrength: -400,
  centerStrength: 0.28,
  linkStrength: 0.06,
  alpha: 0.4,
  alphaDecay: 0.01,
  initialClusterStrength: 8,
};
