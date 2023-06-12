import { GraphData } from '@mindgraph/types';
import { Artist } from './artist';
import { Drawable } from './canvas';
import { RenderableLink, RenderableNode } from './renderables';
import { Simulation } from './simulation';
import { GraphSimulationConfig, SimulationNode } from './types';
import { Styles } from './style';

export type NodeClickCallback = (node: SimulationNode) => void;

export class MindGraph {
  public constructor({
    data,
    canvas,
    styles,
    simulationConfig,
  }: {
    data: GraphData;
    canvas: HTMLCanvasElement;
    styles?: Partial<Styles>;
    simulationConfig?: Partial<GraphSimulationConfig>;
  }) {
    this.artist = new Artist({
      style: {
        nodeColor: '#01b0d3',
        linkColor: '#01586a',
        titleColor: '#ffffff',
        ...styles,
      },
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
        const d = links
          .map<Drawable>((l) => new RenderableLink(l, this.artist.getStyles()))
          .concat(
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

  private simulation: Simulation;
  private artist: Artist;
  private callback: NodeClickCallback | undefined;
}
