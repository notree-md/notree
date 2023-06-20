import { GraphData } from '@mindgraph/types';
import { map } from 'd3-array';
import { SimulationLink, GraphSimulationConfig, SimulationNode } from './types';
import {
  forceSimulation,
  forceManyBody,
  forceCenter,
  forceLink,
  Simulation as D3Simulation,
} from 'd3-force';

export interface MindGraphSimulationArgs {
  data: GraphData;
  width: number;
  height: number;
  simulationConfig?: Partial<GraphSimulationConfig>;
}

export class Simulation {
  public readonly configuration: GraphSimulationConfig;
  public readonly nodes: SimulationNode[];
  public readonly links: SimulationLink[];

  constructor({
    data: { nodes, links },
    simulationConfig,
    width,
    height,
  }: MindGraphSimulationArgs) {
    this.nodes = map(nodes, merge_node_datum);
    this.links = map(links, merge_node_datum) as unknown as SimulationLink[];
    this.configuration = {
      ...default_simulation_config,
      ...simulationConfig,
    };
    this.simulation = this.build({ width, height });
  }

  public start(
    observers?: ((nodes: SimulationNode[], links: SimulationLink[]) => void)[],
  ): void {
    this.simulation.on('tick', () => {
      observers?.forEach((f) => f(this.nodes, this.links));
    });
  }

  private simulation: D3Simulation<SimulationNode, undefined>;

  private build({
    width,
    height,
  }: BuildSimulationArgs): D3Simulation<SimulationNode, undefined> {
    const {
      initialClusterStrength,
      chargeStrength,
      linkStrength,
      centerStrength,
      alpha,
      alphaDecay,
      randomizeStartingPoints,
    } = this.configuration;

    // https://gist.github.com/mbostock/7881887
    this.nodes.forEach((node, i) => {
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

    return forceSimulation(this.nodes)
      .force('charge', forceManyBody().strength(chargeStrength))
      .force(
        'center',
        forceCenter(width / 2, height / 2).strength(centerStrength),
      )
      .force(
        'link',
        forceLink(this.links)
          .id((l) => (l as SimulationNode).id)
          .strength(linkStrength),
      )
      .alpha(alpha)
      .alphaDecay(alphaDecay);
  }
}

type BuildSimulationArgs = {
  width: number;
  height: number;
};

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
  chargeStrength: -400,
  centerStrength: 0.28,
  linkStrength: 0.06,
  alpha: 0.4,
  alphaDecay: 0.01,
  initialClusterStrength: 8,
};
