import { create } from 'd3-selection';
import { loadSimulationNodeDatums } from './simulation';
import { GraphStyleConfig } from './types';

export function loadSvgElements(
  { links, nodes }: ReturnType<typeof loadSimulationNodeDatums>,
  { minimumNodeSize, nodeScaleFactor }: GraphStyleConfig,
) {
  const root = create('svg');

  const linkObjects = root
    .append('g')
    .selectAll('line')
    .data(links)
    .join('line');

  const nodeObjects = root
    .append('g')
    .selectAll('circle')
    .data(nodes)
    .join('circle')
    .attr('r', (n) => minimumNodeSize + (n.linkCount || 1) ** nodeScaleFactor)
    .attr('title', (n) => n.name);

  return { linkObjects, nodeObjects };
}

export function nextFrame(selections: ReturnType<typeof loadSvgElements>) {
  selections.nodeObjects
    .attr('cx', (n) => n.x || 0)
    .attr('cy', (n) => n.y || 0);
  selections.linkObjects
    .attr('x1', (l) => l.source.x || 0)
    .attr('y1', (l) => l.source.y || 0)
    .attr('x2', (l) => l.target.x || 0)
    .attr('y2', (l) => l.target.y || 0);
}
