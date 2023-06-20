import { GraphData } from '@mindgraph/types';
import { Artist } from './artist';
import { Drawable } from './canvas';
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

    this.callback = undefined;
  }

  public onClick(callback: NodeClickCallback | undefined) {
    this.callback = callback;
  }

  public draw() {
    this.simulation.start([
      (nodes, links) => {
        if (this.drawables.length === 0) {
          for (const link of links) {
            const newRenderableLink = new RenderableLink(
              link,
              this.artist.getStyles(),
            );
            this.drawables.push(newRenderableLink);
          }
          for (const node of nodes) {
            const newRenderable = new RenderableNode(
              node,
              this.artist.getStyles(),
              this.callback,
            );
            this.drawables.push(newRenderable);
          }
        }
      },
    ]);

    this.render();
  }

  private render() {
    if (isSSR()) return;

    this.artist.draw(this.drawables);
    window.requestAnimationFrame(() => this.render());
  }

  private drawables: Drawable[];
  private simulation: Simulation;
  private artist: Artist;
  private callback: NodeClickCallback | undefined;
}
