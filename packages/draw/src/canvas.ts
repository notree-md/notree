import { create, select } from 'd3-selection';
import { ZoomTransform } from 'd3-zoom';
import { getStyles } from './style';
import { loadSvgElements } from './svg';
import { SimulationNode } from './types';

export function loadCanvas(
  { width, height, deviceScale }: ReturnType<typeof getStyles>,
  scaledToDevice: boolean,
  canvasElement?: HTMLCanvasElement,
) {
  const element = canvasElement ? select(canvasElement) : create('canvas');

  const appliedWidth = scaledToDevice ? width * deviceScale : width;
  const appliedHeight = scaledToDevice ? height * deviceScale : height;

  element.attr('width', appliedWidth);
  element.attr('height', appliedHeight);

  const context = element.node()?.getContext('2d');

  if (scaledToDevice) {
    context?.scale(deviceScale, deviceScale);
  }

  return { element, context };
}

export interface DrawFrameArgs {
  canvas: ReturnType<typeof loadCanvas>;
  svgElements: ReturnType<typeof loadSvgElements>;
  style: ReturnType<typeof getStyles>;
  zoomTransform: ZoomTransform;
  uniqueNodeColors?: string[];
}

export function drawFrame({
  canvas: { element, context },
  svgElements: { nodeObjects, linkObjects },
  uniqueNodeColors,
  zoomTransform,
  style,
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
      context.strokeStyle = style.linkColor;

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
      const initialRadius = Number(select(this).attr('r'));
      const radius = mapColorToNode ? initialRadius + 3 : initialRadius;
      const nodeFill = mapColorToNode ? uniqueNodeColors[i] : style.nodeColor;

      context.beginPath();
      context.fillStyle = nodeFill;
      context.arc(n.x, n.y, radius, 0, Math.PI * 2);
      context.fill();
      context.closePath();

      const name = n.name.split('.md')[0];

      context.beginPath();
      context.fillStyle = style.titleColor;
      context.fillText(
        name,
        n.x - context.measureText(name).width / 2,
        n.y + radius + style.nodeTitlePadding,
      );
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
