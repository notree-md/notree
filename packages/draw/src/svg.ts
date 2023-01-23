import { create } from 'd3-selection';
import { createSimulationNodeDatums } from './simulation';

export function loadSvgElements({
  links,
  nodes,
}: ReturnType<typeof createSimulationNodeDatums>) {
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
    .attr('r', (n) => 4 + (n.linkCount || 1) ** 0.95)
    .attr('title', (n) => n.name);

  return { linkObjects, nodeObjects };
}
