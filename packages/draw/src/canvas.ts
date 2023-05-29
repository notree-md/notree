import { create, select, Selection } from 'd3-selection';
import { ZoomTransform } from 'd3-zoom';
import { createStyles, Styles } from './style';
import { loadSvgElements, SvgElements } from './svg';
import { SimulationNode } from './types';
import { Zoomer } from './zoomer';

export class Canvas {
  constructor(
    { width, height }: Styles,
    canvasElement?: HTMLCanvasElement,
    deviceScale?: number,
  ) {
    this.deviceScale = deviceScale;
    this.element = canvasElement ? select(canvasElement) : create('canvas');
    this.setDimensions(width, height);

    this.context = this.element.node()?.getContext('2d') || undefined;

    if (this.deviceScale) {
      this.context?.scale(this.deviceScale, this.deviceScale);
    }
  }

  public setDimensions(width: number, height: number): void {
    const appliedWidth = this.deviceScale ? width * this.deviceScale : width;
    const appliedHeight = this.deviceScale ? height * this.deviceScale : height;

    this.element.attr('width', appliedWidth);
    this.element.attr('height', appliedHeight);
  }

  public drawFrame({
    zoomer,
    svgElements,
  }: {
    zoomer: Zoomer;
    svgElements: SvgElements;
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
      if (link.source.x && link.source.y && link.target.x && link.target.y) {
        this.context!.beginPath();

        if (
          activeNode &&
          (link.source.id === activeNode.id || link.target.id === activeNode.id)
        ) {
          context.strokeStyle = style.activeLinkColor;
        } else {
          context.strokeStyle = style.linkColor;
        }

        context.moveTo(link.source.x, link.source.y);
        context.lineTo(link.target.x, link.target.y);

        context.stroke();
        context.closePath();
      }
    });

    svgElements.links.each(function (link) {});

    const mapColorToNode = !!uniqueNodeColors;
    const nodeColorMap: Record<string, SimulationNode> = {};
    nodeObjects.each(function (n, i) {
      if (n.x && n.y) {
        const isActiveNode = activeNode && n.id === activeNode.id;
        const initialRadius = Number(select(this).attr('r'));
        const radius = mapColorToNode ? initialRadius + 3 : initialRadius;
        const nodeFill = mapColorToNode ? uniqueNodeColors[i] : style.nodeColor;

        context.beginPath();

        if (isActiveNode) {
          context.fillStyle = mapColorToNode ? nodeFill : style.activeNodeColor;
          context.arc(n.x, n.y, radius + 1, 0, Math.PI * 2);
        } else {
          context.fillStyle = nodeFill;
          context.arc(n.x, n.y, radius, 0, Math.PI * 2);
        }

        context.fill();
        context.closePath();

        const name = n.name.split('.md')[0];

        context.beginPath();
        context.fillStyle = style.titleColor;

        if (isActiveNode) {
          context.fillText(
            name,
            n.x - context.measureText(name).width / 2,
            n.y + radius + style.nodeTitlePadding + 2,
          );
        } else {
          context.fillText(
            name,
            n.x - context.measureText(name).width / 2,
            n.y + radius + style.nodeTitlePadding,
          );
        }

        context.fill();
        context.closePath();

        if (mapColorToNode) {
          nodeColorMap[nodeFill] = n;
        }
      }
    });

    context.restore();

    return nodeColorMap;
  }

  private element: Selection<HTMLCanvasElement, undefined, null, undefined>;
  private context: CanvasRenderingContext2D | undefined;
  private deviceScale: number | undefined;
}

export interface DrawFrameArgs {
  svgElements: ReturnType<typeof loadSvgElements>;
  style: ReturnType<typeof createStyles>;
  zoomTransform: ZoomTransform;
  uniqueNodeColors?: string[];
  activeNode: SimulationNode | null;
}

export function drawFrame({
  canvas: { element, context },
  svgElements: { nodeObjects, linkObjects },
  uniqueNodeColors,
  zoomTransform,
  style,
  activeNode,
}: DrawFrameArgs) {
  if (!context) return {};

  context.save();

  context.clearRect(
    0,
    0,
    Number(element.attr('width')),
    Number(element.attr('height')),
  );
  context.translate(zoomTransform.x, zoomTransform.y);
  context.scale(zoomTransform.k, zoomTransform.k);

  linkObjects.each(function (link) {
    if (link.source.x && link.source.y && link.target.x && link.target.y) {
      context.beginPath();

      if (
        activeNode &&
        (link.source.id === activeNode.id || link.target.id === activeNode.id)
      ) {
        context.strokeStyle = style.activeLinkColor;
      } else {
        context.strokeStyle = style.linkColor;
      }

      context.moveTo(link.source.x, link.source.y);
      context.lineTo(link.target.x, link.target.y);

      context.stroke();
      context.closePath();
    }
  });

  const mapColorToNode = !!uniqueNodeColors;
  const nodeColorMap: Record<string, SimulationNode> = {};
  nodeObjects.each(function (n, i) {
    if (n.x && n.y) {
      const isActiveNode = activeNode && n.id === activeNode.id;
      const initialRadius = Number(select(this).attr('r'));
      const radius = mapColorToNode ? initialRadius + 3 : initialRadius;
      const nodeFill = mapColorToNode ? uniqueNodeColors[i] : style.nodeColor;

      context.beginPath();

      if (isActiveNode) {
        context.fillStyle = mapColorToNode ? nodeFill : style.activeNodeColor;
        context.arc(n.x, n.y, radius + 1, 0, Math.PI * 2);
      } else {
        context.fillStyle = nodeFill;
        context.arc(n.x, n.y, radius, 0, Math.PI * 2);
      }

      context.fill();
      context.closePath();

      const name = n.name.split('.md')[0];

      context.beginPath();
      context.fillStyle = style.titleColor;

      if (isActiveNode) {
        context.fillText(
          name,
          n.x - context.measureText(name).width / 2,
          n.y + radius + style.nodeTitlePadding + 2,
        );
      } else {
        context.fillText(
          name,
          n.x - context.measureText(name).width / 2,
          n.y + radius + style.nodeTitlePadding,
        );
      }

      context.fill();
      context.closePath();

      if (mapColorToNode) {
        nodeColorMap[nodeFill] = n;
      }
    }
  });

  context.restore();

  return nodeColorMap;
}
