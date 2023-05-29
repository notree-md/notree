import { GraphData } from '@mindgraph/types';
import { map } from 'd3-array';
import { GraphSimulationConfig, SimulationNode } from './types';
import {
  SimulationNodeDatum,
  forceSimulation,
  forceManyBody,
  forceCenter,
  forceLink,
  Simulation as D3Simulation,
} from 'd3-force';
import { Styles } from './style';

export type ConfiguredSimulationLink = SimulationNodeDatum & {
  source: SimulationNode;
  target: SimulationNode;
};

export interface MindGraphSimulationArgs {
  data: GraphData;
  styles: Styles;
  simulationConfig?: Partial<GraphSimulationConfig>;
}

export class Simulation {
  public readonly configuration: GraphSimulationConfig;
  public readonly nodes: SimulationNodeDatum[];
  public readonly links: ConfiguredSimulationLink[];

  constructor({
    data: { nodes, links },
    simulationConfig,
    styles: { width, height },
  }: MindGraphSimulationArgs) {
    this.nodes = map(nodes, merge_node_datum);
    this.links = map(
      links,
      merge_node_datum,
    ) as unknown as ConfiguredSimulationLink[];
    this.configuration = {
      ...default_simulation_config,
      ...simulationConfig,
    };
    this.simulation = this.build({ width, height });
  }

  private build({
    width,
    height,
  }: BuildSimulationArgs): D3Simulation<SimulationNodeDatum, undefined> {
    const {
      initialClusterStrength,
      chargeStrength,
      linkStrength,
      centerStrength,
      alpha,
      alphaDecay,
    } = this.configuration;

    // https://gist.github.com/mbostock/7881887
    this.nodes.forEach((node, i) => {
      node.x =
        Math.cos((i / initialClusterStrength) * 2 * Math.PI) * 200 +
        width / 2 +
        Math.random();
      node.y =
        Math.sin((i / initialClusterStrength) * 2 * Math.PI) * 200 +
        height / 2 +
        Math.random();
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

  private simulation: D3Simulation<SimulationNodeDatum, undefined>;
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
  minZoom: 0.4,
  maxZoom: 16,
  chargeStrength: -400,
  centerStrength: 0.28,
  linkStrength: 0.06,
  alpha: 0.4,
  alphaDecay: 0.01,
  initialClusterStrength: 8,
};
