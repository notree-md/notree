import { GraphDataPayload } from '@notree/common';
import { Artist } from './artist';
import { GraphSimulationConfig, NodeClickCallback } from './types';
import { Styles, isSSR } from './style';
import { startForceSimulation } from './simulation';
import { Renderable } from './canvas';
import { Node } from './renderables';

export interface GraphArgs {
  data: GraphDataPayload;
  canvas: HTMLCanvasElement;
  styles?: Partial<Styles>;
  simulationConfig?: Partial<GraphSimulationConfig>;
}

export class Graph {
  constructor({ data, canvas, styles, simulationConfig }: GraphArgs) {
    this.artist = new Artist({
      style: styles,
      canvas,
    });

    for (const node of Object.values(data.nodes)) {
      Node.fromServerNode(node, this.artist.styles, data);
    }

    console.log(data);

    this.callback = undefined;
    startForceSimulation({
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
    this.artist.makeInteractive();
    this.render();
  }

  private renderables: Renderable;
  private artist: Artist;
  private callback: NodeClickCallback | undefined;

  private render() {
    if (isSSR()) return;

    // this.artist.draw(this.drawables);
    window.requestAnimationFrame(() => this.render());
  }
}
