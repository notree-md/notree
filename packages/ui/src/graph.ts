import { GraphDataPayload } from '@notree/common';
import { Artist } from './artist';
import { Renderable } from './canvas';
import { RenderableLink, RenderableNode } from './renderables';
import { Simulation } from './simulation';
import { GraphSimulationConfig, NodeClickCallback } from './types';
import { Styles, isSSR } from './style';
import { GraphData } from './data';

export interface GraphArgs {
  data: GraphDataPayload;
  canvas: HTMLCanvasElement;
  styles?: Partial<Styles>;
  simulationConfig?: Partial<GraphSimulationConfig>;
}

export class Graph {
  constructor({ data, canvas, styles, simulationConfig }: GraphArgs) {
    this.data = new GraphData(data);
    this.drawables = [];
    this.callback = undefined;

    this.artist = new Artist({
      style: styles,
      canvas,
    });

    this.simulation = new Simulation({
      data: this.data,
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
  }

  public draw() {
    for (const link of this.simulation.links) {
      const newRenderableLink = new RenderableLink(link, this.artist.styles);
      this.drawables.push(newRenderableLink);
    }
    for (const node of this.simulation.nodes) {
      const newRenderable = new RenderableNode(
        node,
        this.artist.styles,
        this.callback,
      );
      this.drawables.push(newRenderable);
    }

    this.artist.makeInteractive();
    this.render();
  }

  private data: GraphData;
  private drawables: Renderable[];
  private simulation: Simulation;
  private artist: Artist;
  private callback: NodeClickCallback | undefined;

  private render() {
    if (isSSR()) return;

    this.artist.draw(this.drawables);
    window.requestAnimationFrame(() => this.render());
  }
}

// what I want to do
// const focused = nodes.find(is_under_cursor);
// focused.children.forEach(link_or_node => link_or_node.activate())
// focused.parents(): Node[]
