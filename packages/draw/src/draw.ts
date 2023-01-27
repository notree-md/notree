import { zoomIdentity, zoom, ZoomTransform } from 'd3-zoom';
import { drawFrame, loadCanvas } from './canvas';
import {
  buildSimulation,
  getSimulationConfig,
  loadSimulationNodeDatums,
} from './simulation';
import {
  convertRgbArrayToStyle,
  generateUniqueColors,
  getStyles,
} from './style';
import { loadSvgElements, nextFrame } from './svg';
import { MindGraphConfig, NodeClickEvent, SimulationNode } from './types';

export function draw({
  data,
  canvasElement,
  onNodeClick,
  style,
  simulationConfig,
}: MindGraphConfig) {
  let activeNode: SimulationNode | null = null;
  let zoomTransform = zoomIdentity;

  const styleConfig = getStyles(style);
  const simulationSettings = getSimulationConfig(simulationConfig);

  const simulationDatums = loadSimulationNodeDatums(data);
  const simulation = buildSimulation({
    ...simulationDatums,
    ...simulationSettings,
    width: styleConfig.width,
    height: styleConfig.height,
  });

  const svgElements = loadSvgElements(simulationDatums, styleConfig);
  const visualCanvas = loadCanvas(styleConfig, true, canvasElement);

  const tick = () => {
    nextFrame(svgElements);
    drawFrame({
      canvas: visualCanvas,
      style: styleConfig,
      svgElements,
      zoomTransform,
      activeNode,
    });
  };

  visualCanvas.element.call(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    zoom<HTMLCanvasElement, any>()
      .extent([
        [0, 0],
        [styleConfig.width, styleConfig.height],
      ])
      .scaleExtent([simulationSettings.minZoom, simulationSettings.maxZoom])
      .on('zoom', (e: { transform: ZoomTransform }) => {
        zoomTransform = e.transform;

        tick();
      }),
  );

  simulation.on('tick', tick);

  const clickMapCanvas = loadCanvas(styleConfig, false);
  const clickMapColors = generateUniqueColors(data.nodes.length);

  visualCanvas.element.on('click', ({ layerX, layerY }: NodeClickEvent) => {
    if (!clickMapCanvas.context || typeof onNodeClick !== 'function') return;

    const uniqueColorToNode = drawFrame({
      canvas: clickMapCanvas,
      style: styleConfig,
      uniqueNodeColors: clickMapColors,
      svgElements,
      zoomTransform,
      activeNode,
    });

    const clickedNode =
      uniqueColorToNode[
        convertRgbArrayToStyle(
          Array.from(
            clickMapCanvas.context.getImageData(layerX, layerY, 1, 1).data,
          ),
        )
      ];

    if (clickedNode) {
      onNodeClick(clickedNode);
    }
  });

  visualCanvas.element.on('mousemove', ({ offsetX, offsetY }: MouseEvent) => {
    if (!clickMapCanvas.context) return;

    const uniqueColorToNode = drawFrame({
      canvas: clickMapCanvas,
      style: styleConfig,
      uniqueNodeColors: clickMapColors,
      svgElements,
      zoomTransform,
      activeNode,
    });
    tick();

    const hoverNode =
      uniqueColorToNode[
        convertRgbArrayToStyle(
          Array.from(
            clickMapCanvas.context.getImageData(offsetX, offsetY, 1, 1).data,
          ),
        )
      ];

    if (hoverNode) {
      activeNode = hoverNode;
      visualCanvas.element.style('cursor', 'pointer');
    } else {
      activeNode = null;
      visualCanvas.element.style('cursor', 'default');
    }
  });
}
