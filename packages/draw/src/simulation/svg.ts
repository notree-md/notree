import { create, Selection, BaseType } from 'd3-selection';
import { ConfiguredSimulationLink, Simulation } from './simulation';
import { SimulationNode } from '../types';
import { Styles } from '../style';

export class SvgElements {
  public readonly links: Selection<
    BaseType | SVGLineElement,
    ConfiguredSimulationLink,
    SVGGElement,
    undefined
  >;
  public readonly nodes: Selection<
    BaseType | SVGCircleElement,
    SimulationNode,
    SVGGElement,
    undefined
  >;

  constructor(
    { links, nodes }: Simulation,
    { minimumNodeSize, nodeScaleFactor }: Styles,
  ) {
    this.root = create('svg');

    this.links = this.root
      .append('g')
      .selectAll('line')
      .data(links)
      .join('line');

    this.nodes = this.root
      .append('g')
      .selectAll('circle')
      .data(nodes)
      .join('circle')
      .attr('r', (n) => minimumNodeSize + (n.linkCount || 1) ** nodeScaleFactor)
      .attr('title', (n) => n.name);
  }

  public nextFrame(): void {
    this.nodes.attr('cx', (n) => n.x || 0).attr('cy', (n) => n.y || 0);
    this.links
      .attr('x1', (l) => l.source.x || 0)
      .attr('y1', (l) => l.source.y || 0)
      .attr('x2', (l) => l.target.x || 0)
      .attr('y2', (l) => l.target.y || 0);
  }

  private root: Selection<SVGSVGElement, undefined, null, undefined>;
}
