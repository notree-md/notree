import type { GraphData } from '@mindgraph/types';
import {
  SimulationNodeDatum,
  forceSimulation,
  forceManyBody,
  forceCenter,
  forceLink,
} from 'd3-force';
import { zoomIdentity, zoom, ZoomTransform } from 'd3-zoom';
import { map } from 'd3-array';
import { create, select, Selection } from 'd3-selection';

type SimulationNode = SimulationNodeDatum & GraphData['nodes'][0];
type NodeClickCallback<TReturn = void> = (node: SimulationNode) => TReturn;
type NodeClickEvent = { layerX: number; layerY: number };
type GraphStyleConfig = {
  nodeColor: string;
  linkColor: string;
  titleColor: string;
};

let ZOOM_TRANSFORM = zoomIdentity;

export interface MindGraphConfig {
  data: GraphData;
  canvasElement: HTMLCanvasElement;
  onNodeClick?: NodeClickCallback;
  style?: Partial<GraphStyleConfig>;
}

export function draw({
  data,
  canvasElement,
  onNodeClick,
  style,
}: MindGraphConfig) {
  const styles = merge_style(style);

  const resources = initialize_graph_resources(data, canvasElement);
  const graphSelections = create_graph_selections(resources);
  const simulation = create_simulation(resources, graphSelections, styles);

  simulation.on('tick', () => handle_tick(resources, graphSelections, styles));
  resources.canvas.on('click', (event: NodeClickEvent) =>
    handle_click(event, resources, graphSelections, styles, onNodeClick),
  );
}

const empty_node_datum = {
  index: undefined,
  x: undefined,
  y: undefined,
  vx: undefined,
  vy: undefined,
  fx: undefined,
  fy: undefined,
};

function initialize_graph_resources(
  notes: GraphData,
  canvasElement: HTMLCanvasElement,
) {
  const nodes = map(notes.nodes, (n) => ({
    ...n,
    ...empty_node_datum,
  })) as SimulationNode[];
  const links = map(notes.links, (l) => ({
    ...l,
    ...empty_node_datum,
  })) as unknown as (SimulationNodeDatum & {
    source: SimulationNode;
    target: SimulationNode;
  })[];

  const width = window.innerWidth;
  const height = window.innerHeight;

  const root = create('svg');

  const deviceScale = window.devicePixelRatio;

  const canvas = select(canvasElement)
    .attr('width', width * deviceScale)
    .attr('height', height * deviceScale);
  const canvasContext = canvas.node()?.getContext('2d');
  canvasContext?.scale(deviceScale, deviceScale);

  const clickMapCanvas = create('canvas')
    .attr('width', width)
    .attr('height', height);
  const clickMapContext = clickMapCanvas.node()?.getContext('2d');

  const nodeColors = generate_unique_node_colors(nodes.length);

  return {
    nodes,
    links,
    width,
    height,
    root,
    canvas,
    canvasContext,
    clickMapCanvas,
    clickMapContext,
    nodeColors,
  };
}

type GraphResources = ReturnType<typeof initialize_graph_resources>;

function create_simulation(
  resources: GraphResources,
  graphSelections: GraphSelections,
  style: GraphStyleConfig,
) {
  const { nodes, width, height, links, canvas } = resources;

  canvas.call(
    zoom<HTMLCanvasElement, unknown>()
      .extent([
        [0, 0],
        [width, height],
      ])
      .scaleExtent([0.4, 16])
      .on('zoom', (e: { transform: ZoomTransform }) => {
        ZOOM_TRANSFORM = e.transform;
        handle_tick(resources, graphSelections, style);
      }),
  );

  return forceSimulation(nodes)
    .force('charge', forceManyBody().strength(-400))
    .force('center', forceCenter(width / 2, height / 2).strength(0.28))
    .force(
      'link',
      forceLink(links)
        .id((l) => (l as SimulationNode).id)
        .strength(0.06),
    );
}

function create_graph_selections({ root, links, nodes }: GraphResources) {
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

type GraphSelections = ReturnType<typeof create_graph_selections>;

const node_title_padding = 12;
function handle_tick(
  { canvasContext, canvas }: GraphResources,
  selections: GraphSelections,
  style: GraphStyleConfig,
) {
  if (!canvasContext) return;

  selections.nodeObjects
    .attr('cx', (n) => n.x || 0)
    .attr('cy', (n) => n.y || 0);
  selections.linkObjects
    .attr('x1', (l) => l.source.x || 0)
    .attr('y1', (l) => l.source.y || 0)
    .attr('x2', (l) => l.target.x || 0)
    .attr('y2', (l) => l.target.y || 0);

  draw_canvas({ canvas, canvasContext, selections, style });
}

function handle_click(
  { layerX, layerY }: NodeClickEvent,
  { clickMapCanvas, clickMapContext, nodeColors }: GraphResources,
  selections: GraphSelections,
  style: GraphStyleConfig,
  onNodeClick?: NodeClickCallback,
) {
  if (!clickMapContext || typeof onNodeClick !== 'function') return;

  const colorToNode = draw_canvas({
    canvas: clickMapCanvas,
    canvasContext: clickMapContext,
    selections: selections,
    nodeColors: nodeColors,
    style,
  });
  const node = colorToNode[
    rgb_array_to_style(
      Array.from(clickMapContext.getImageData(layerX, layerY, 1, 1).data),
    )
  ] as SimulationNode | undefined;

  if (node) {
    onNodeClick(node);
  }
}

type DrawCanvasArgs = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- d3 types here are silly
  canvas: Selection<HTMLCanvasElement, any, any, any>;
  canvasContext: CanvasRenderingContext2D;
  selections: GraphSelections;
  nodeColors?: string[];
  style: GraphStyleConfig;
};
function draw_canvas({
  canvas,
  canvasContext,
  selections: { nodeObjects, linkObjects },
  nodeColors,
  style,
}: DrawCanvasArgs) {
  canvasContext.save();

  canvasContext.clearRect(
    0,
    0,
    Number(canvas.attr('width')),
    Number(canvas.attr('height')),
  );
  canvasContext.translate(ZOOM_TRANSFORM.x, ZOOM_TRANSFORM.y);
  canvasContext.scale(ZOOM_TRANSFORM.k, ZOOM_TRANSFORM.k);

  linkObjects.each(function (link) {
    if (link.source.x && link.source.y && link.target.x && link.target.y) {
      canvasContext.beginPath();
      canvasContext.strokeStyle = style.linkColor;

      canvasContext.moveTo(link.source.x, link.source.y);
      canvasContext.lineTo(link.target.x, link.target.y);

      canvasContext.stroke();
      canvasContext.closePath();
    }
  });

  const mapColorToNode = !!nodeColors;
  const nodeColorMap: Record<string, SimulationNode> = {};
  nodeObjects.each(function (n, i) {
    if (n.x && n.y) {
      const radius = Number(select(this).attr('r'));
      const nodeFill = mapColorToNode ? nodeColors[i] : style.nodeColor;

      canvasContext.beginPath();
      canvasContext.fillStyle = nodeFill;
      canvasContext.arc(n.x, n.y, radius, 0, Math.PI * 2);
      canvasContext.fill();
      canvasContext.closePath();

      const name = n.name.split('.md')[0];

      canvasContext.beginPath();
      canvasContext.fillStyle = style.titleColor;
      canvasContext.fillText(
        name,
        n.x - canvasContext.measureText(name).width / 2,
        n.y + radius + node_title_padding,
      );
      canvasContext.fill();
      canvasContext.closePath();

      if (mapColorToNode) {
        nodeColorMap[nodeFill] = n;
      }
    }
  });

  canvasContext.restore();

  return nodeColorMap;
}

function generate_unique_node_colors(nodeCount: number) {
  // https://stackoverflow.com/questions/15804149/rgb-color-permutation/15804183#15804183
  return [...Array(nodeCount).keys()].map((i) =>
    rgb_array_to_style([
      (i + 1) & 0xff,
      ((i + 1) & 0xff00) >> 8,
      ((i + 1) & 0xff0000) >> 16,
    ]),
  );
}

function rgb_array_to_style(rgbArray: number[]) {
  return `rgb(${rgbArray.slice(0, 3).join(',')})`;
}

const default_styles = {
  nodeColor: 'red',
  linkColor: 'blue',
  titleColor: 'green',
};
function merge_style(style?: MindGraphConfig['style']): GraphStyleConfig {
  return {
    ...default_styles,
    ...style,
  };
}
