import { create, select, Selection } from 'd3-selection';
import { convertRgbArrayToStyle, Styles } from './style';
import { NodeClickEvent, SimulationNode } from './types';
import { Zoomer } from './zoomer';
import { Simulation } from './simulation';

export class Canvas {
  constructor(
    { width, height }: Styles,
    canvasElement?: HTMLCanvasElement,
    deviceScale?: number,
  ) {
    this.deviceScale = deviceScale;
    this.element = canvasElement ? select(canvasElement) : create('canvas');

    this.context = this.element.node()?.getContext('2d') || undefined;

    this.setDimensions();
  }

  public setDimensions(): void {
    const elNode = this.element.node()
    if(elNode) {
      const currElWidth = elNode.getBoundingClientRect().width;
      const currElHeight = elNode.getBoundingClientRect().height;
      const appliedWidth = this.deviceScale ? this.deviceScale * currElWidth : currElWidth;
      const appliedHeight = this.deviceScale ? this.deviceScale * currElHeight : currElHeight;
      this.element.attr('width', appliedWidth);
      this.element.attr('height', appliedHeight);
    }

    if (this.deviceScale) {
      this.context?.scale(this.deviceScale, this.deviceScale);
    }
  }

  public drawFrame({
    zoomer,
    simulation,
    styles,
    activeNode,
    uniqueNodeColors,
  }: {
    zoomer: Zoomer;
    simulation: Simulation;
    styles: Styles;
    activeNode?: SimulationNode;
    uniqueNodeColors?: string[];
  }): Record<string, SimulationNode> {
    if (!this.context) return {};

    this.context.save();

    this.context.clearRect(
      0,
      0,
      Number(this.element.attr("width")),
      Number(this.element.attr("height")),
    );
    this.context.translate(zoomer.x, zoomer.y);
    this.context.scale(zoomer.k, zoomer.k);

    simulation.renderedLinks().each((link) => {
      if (!this.context) return;
      if (link.source.x && link.source.y && link.target.x && link.target.y) {
        this.context.beginPath();

        if (
          activeNode &&
          (link.source.id === activeNode.id || link.target.id === activeNode.id)
        ) {
          this.context.strokeStyle = styles.activeLinkColor;
        } else {
          this.context.strokeStyle = styles.linkColor;
        }

        this.context.moveTo(link.source.x, link.source.y);
        this.context.lineTo(link.target.x, link.target.y);

        this.context.stroke();
        this.context.closePath();
      }
    });

    const mapColorToNode = !!uniqueNodeColors;
    const nodeColorMap: Record<string, SimulationNode> = {};

    simulation.renderedNodes().forEach((n, i) => {
      if (!this.context) return;

      if (n.x && n.y) {
        const isActiveNode = activeNode && n.id === activeNode.id;

        // increase clickable area of node
        const radius = mapColorToNode ? n.r + 3 : n.r;

        const nodeFill = mapColorToNode
          ? uniqueNodeColors[i]
          : styles.nodeColor;

        this.context.beginPath();

        if (isActiveNode) {
          this.context.fillStyle = mapColorToNode
            ? nodeFill
            : styles.activeNodeColor;
          this.context.arc(n.x, n.y, radius + 1, 0, Math.PI * 2);
        } else {
          this.context.fillStyle = nodeFill;
          this.context.arc(n.x, n.y, radius, 0, Math.PI * 2);
        }

        this.context.fill();
        this.context.closePath();

        const name = n.name.split('.md')[0];

        this.context.beginPath();
        this.context.fillStyle = styles.titleColor;

        if (isActiveNode) {
          this.context.fillText(
            name,
            n.x - this.context.measureText(name).width / 2,
            n.y + radius + styles.nodeTitlePadding + 2,
          );
        } else {
          this.context.fillText(
            name,
            n.x - this.context.measureText(name).width / 2,
            n.y + radius + styles.nodeTitlePadding,
          );
        }

        this.context.fill();
        this.context.closePath();

        if (mapColorToNode) {
          nodeColorMap[nodeFill] = n;
        }
      }
    });

    this.context.restore();

    return nodeColorMap;
  }

  public on(event: 'click', callback: (args: NodeClickEvent) => void): void;
  public on(event: 'mousemove', callback: (args: MouseEvent) => void): void;
  public on(event: never, callback: never): void {
    this.element.on(event, callback);
  }

  public call(
    callback: (
      selection: Selection<HTMLCanvasElement, undefined, null, undefined>,
    ) => void,
  ): void {
    this.element.call(callback);
  }

  public getPixelColor(x: number, y: number): string {
    if (!this.context) return '';

    return convertRgbArrayToStyle(
      Array.from(this.context.getImageData(x, y, 1, 1).data),
    );
  }

  public setCursor(style: 'pointer' | 'default'): void {
    this.element.style('cursor', style);
  }

  private element: Selection<HTMLCanvasElement, undefined, null, undefined>;
  private context: CanvasRenderingContext2D | undefined;
  private deviceScale: number | undefined;
}
