import { GraphDataPayload } from '@notree/common';
import { Artist } from './artist';
import { GraphData, GraphSimulationConfig, NodeClickCallback } from './types';
import { Styles, isSSR } from './style';
import { convertInPlace } from './data';
import { startForceSimulation } from './simulation';

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

    this.data = convertInPlace({ data, styles: this.artist.styles });
    this.callback = undefined;

    startForceSimulation({
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
    this.artist.makeInteractive();
    this.render();
  }

  private data: GraphData;
  private artist: Artist;
  private callback: NodeClickCallback | undefined;

  private render() {
    if (isSSR()) return;

    this.artist.draw(this.drawables);
    window.requestAnimationFrame(() => this.render());
  }
}
