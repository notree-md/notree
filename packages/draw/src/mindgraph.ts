import { GraphData } from '@mindgraph/types';
import { Artist } from './artist';
import { Drawable } from './canvas';
import { RenderableLink, RenderableNode } from './renderables';
import { ConfiguredSimulationLink, Simulation } from './simulation';
import { GraphSimulationConfig, SimulationNode } from './types';
import { Styles } from './style';

export type NodeClickCallback = (node: SimulationNode) => void;

export class MindGraph {
  private nodeToDrawableMap: Map<SimulationNode, RenderableNode>;
  private linkToDrawableMap: Map<ConfiguredSimulationLink, RenderableLink>;
  private drawables: Drawable[];

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
    this.nodeToDrawableMap = new Map();
    this.linkToDrawableMap = new Map();
    this.drawables = [];

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
        for (const link of links) {
          if (!this.linkToDrawableMap.has(link)) {
            const newRenderableLink = new RenderableLink(
              link,
              this.artist.getStyles(),
            );
            this.drawables.push(newRenderableLink);
            this.linkToDrawableMap.set(link, newRenderableLink);
          }
        }
        for (const node of nodes) {
          if (!this.nodeToDrawableMap.has(node)) {
            const newRenderable = new RenderableNode(
              node,
              this.artist.getStyles(),
              this.callback,
            );
            this.drawables.push(newRenderable);
            this.nodeToDrawableMap.set(node, newRenderable);
          }
        }
        this.artist.draw(this.drawables);
      },
    ]);
    setInterval(() => {
      this.artist.draw(this.drawables);
    }, 100);
  }

  private simulation: Simulation;
  private artist: Artist;
  private callback: NodeClickCallback | undefined;
}
