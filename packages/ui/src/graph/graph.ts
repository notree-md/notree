import { GraphDataPayload } from '@notree/common';
import { Artist } from './artist';
import { GraphSimulationConfig, NodeClickCallback } from './types';
import { Styles, isSSR } from './style';
import { startForceSimulation } from './simulation';
import { Link, Node } from './models';

export interface GraphArgs {
  data: GraphDataPayload;
  canvas: HTMLCanvasElement;
  styles?: Partial<Styles>;
  simulationConfig?: Partial<GraphSimulationConfig>;
}

export class Graph {
  constructor({ data, canvas, styles, simulationConfig }: GraphArgs) {
    this.data = { nodes: {}, links: {} };

    this.artist = new Artist({
      style: styles,
      canvas,
    });

    for (const [key, link] of Object.entries(data.links)) {
      this.data.links[key] = new Link(
        link.id,
        link.source,
        link.target,
        this.data.nodes,
        this.artist.styles,
        empty_node_datum.index,
        empty_node_datum.x,
        empty_node_datum.y,
        empty_node_datum.vx,
        empty_node_datum.vy,
        empty_node_datum.fx,
        empty_node_datum.fy,
      );
    }

    for (const [key, node] of Object.entries(data.nodes)) {
      this.data.nodes[key] = new Node(
        node.id,
        node.title,
        node.totalDescendants,
        node.parentNodes,
        node.childNodes,
        node.parentLinks,
        node.childLinks,
        this.artist.styles,
        empty_node_datum.index,
        empty_node_datum.x,
        empty_node_datum.y,
        empty_node_datum.vx,
        empty_node_datum.vy,
        empty_node_datum.fx,
        empty_node_datum.fy,
      );
    }

    this.callback = undefined;

    startForceSimulation({
      data: {
        nodes: Object.values(this.data.nodes),
        links: Object.values(this.data.links),
      },
      simulationConfig: {
        randomizeStartingPoints: true,
        ...simulationConfig,
      },
      width: this.artist.canvasInitialWidth,
      height: this.artist.canvasInitialHeight,
    });
  }

  public onClick(callback: NodeClickCallback | undefined) {
    this.callback = callback;
    console.log(this.callback);
  }

  public draw() {
    this.artist.makeInteractive();
    this.render();
  }

  private render() {
    if (isSSR()) return;

    console.log(this.data);

    this.artist.draw([
      ...Object.values(this.data.links),
      ...Object.values(this.data.nodes),
    ]);
    window.requestAnimationFrame(() => this.render());
  }

  private artist: Artist;
  private callback: NodeClickCallback | undefined;
  private data: {
    links: Record<string, Link>;
    nodes: Record<string, Node>;
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
