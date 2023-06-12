import { GraphData } from '@mindgraph/types';
import { Artist } from './artist';
import { Drawable } from './canvas';
import { RenderableLink, RenderableNode } from './renderables';
import { Simulation } from './simulation';
import { SimulationNode } from './types';

export type NodeClickCallback = (node: SimulationNode) => void;

export class MindGraph {
  private simulation: Simulation;
  private artist: Artist;
  private callback: NodeClickCallback | undefined;

  public constructor({
    data,
    canvas,
  }: {
    data: GraphData;
    canvas: HTMLCanvasElement;
  }) {
    this.artist = new Artist({
      style: {
        nodeColor: '#01b0d3',
        linkColor: '#01586a',
        titleColor: '#ffffff',
      },
      canvas,
    });

    this.simulation = new Simulation({
      data,
      simulationConfig: {
        randomizeStartingPoints: true,
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
        let d = links.map<Drawable>(
          (l) => new RenderableLink(l, this.artist.getStyles()),
        );
        d = d.concat(
          nodes.map((n) => {
            return new RenderableNode(
              n,
              this.artist.getStyles(),
              this.callback,
            );
          }),
        );
        this.artist.draw(d);
      },
    ]);
  }
}
