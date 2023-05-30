import { create, select, Selection } from 'd3-selection';
import { convertRgbArrayToStyle, Styles } from './style';
import { SvgElements } from './svg';
import { NodeClickEvent, SimulationNode } from './types';
import { Zoomer } from './zoomer';

export class Canvas {
  constructor(
    { width, height }: Styles,
    canvasElement?: HTMLCanvasElement,
    deviceScale?: number,
  ) {
    this.deviceScale = deviceScale;
    this.element = canvasElement ? select(canvasElement) : create('canvas');

    this.context = this.element.node()?.getContext('2d') || undefined;

    this.setDimensions(width, height);
  }

  public setDimensions(width: number, height: number): void {
    const appliedWidth = this.deviceScale ? width * this.deviceScale : width;
    const appliedHeight = this.deviceScale ? height * this.deviceScale : height;

    this.element.attr('width', appliedWidth);
    this.element.attr('height', appliedHeight);

    if (this.deviceScale) {
      this.context?.scale(this.deviceScale, this.deviceScale);
    }
  }

  public drawFrame({
    zoomer,
    svgElements,
    styles,
    activeNode,
    uniqueNodeColors,
  }: {
    zoomer: Zoomer;
    svgElements: SvgElements;
    styles: Styles;
    activeNode?: SimulationNode;
    uniqueNodeColors?: string[];
  }): Record<string, SimulationNode> {
    if (!this.context) return {};

    this.context.save();

    this.context.clearRect(
      0,
      0,
      Number(this.element.attr('width')),
      Number(this.element.attr('height')),
    );
    this.context.translate(zoomer.x, zoomer.y);
    this.context.scale(zoomer.k, zoomer.k);

    svgElements.links.each((link) => {
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

    // TODO: figure out how to remove `select(this)`
    // from the nodes iteration callback and still have access to the `BaseType`
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const current = this;

    svgElements.nodes.each(function (n, i) {
      if (!current.context) return;
      if (n.x && n.y) {
        const isActiveNode = activeNode && n.id === activeNode.id;
        const initialRadius = Number(select(this).attr('r'));
        const radius = mapColorToNode ? initialRadius + 3 : initialRadius;
        const nodeFill = mapColorToNode
          ? uniqueNodeColors[i]
          : styles.nodeColor;

        current.context.beginPath();

        if (isActiveNode) {
          current.context.fillStyle = mapColorToNode
            ? nodeFill
            : styles.activeNodeColor;
          current.context.arc(n.x, n.y, radius + 1, 0, Math.PI * 2);
        } else {
          current.context.fillStyle = nodeFill;
          current.context.arc(n.x, n.y, radius, 0, Math.PI * 2);
        }

        current.context.fill();
        current.context.closePath();

        const name = n.name.split('.md')[0];

        current.context.beginPath();
        current.context.fillStyle = styles.titleColor;

        if (isActiveNode) {
          current.context.fillText(
            name,
            n.x - current.context.measureText(name).width / 2,
            n.y + radius + styles.nodeTitlePadding + 2,
          );
        } else {
          current.context.fillText(
            name,
            n.x - current.context.measureText(name).width / 2,
            n.y + radius + styles.nodeTitlePadding,
          );
        }

        current.context.fill();
        current.context.closePath();

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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public on(event: any, callback: any): void {
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
