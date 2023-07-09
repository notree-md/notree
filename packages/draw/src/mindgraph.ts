import { GraphData } from '@mindgraph/types';
import { Artist } from './artist';
import { Renderable } from './canvas';
import { RenderableLink, RenderableNode } from './renderables';
import { Simulation } from './simulation';
import { GraphSimulationConfig, NodeClickCallback } from './types';
import { Styles, isSSR } from './style';

export interface MindGraphArgs {
  data: GraphData;
  canvas: HTMLCanvasElement;
  styles?: Partial<Styles>;
  simulationConfig?: Partial<GraphSimulationConfig>;
}

export class MindGraph {
  constructor({ data, canvas, styles, simulationConfig }: MindGraphArgs) {
    this.drawables = [];
    this.callback = undefined;

    this.artist = new Artist({
      style: styles,
      canvas,
    });

    this.simulation = new Simulation({
      data,
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
