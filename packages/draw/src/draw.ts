import { zoomIdentity, zoom, ZoomTransform } from 'd3-zoom';
import { drawFrame, loadCanvas } from './canvas';
import { MindGraphSimulation } from './simulation';
import {
  convertRgbArrayToStyle,
  generateUniqueColors,
  createStyles,
} from './style';
import { loadSvgElements, nextFrame } from './svg';
import {
  MindGraphApi,
  MindGraphConfig,
  NodeClickEvent,
  SimulationNode,
} from './types';

export function draw({
  data,
  canvasElement,
  onNodeClick,
  style,
  simulationConfig,
}: MindGraphConfig): MindGraphApi {
  let activeNode: SimulationNode | null = null;
  let zoomTransform = zoomIdentity;

  const styleConfig = createStyles(style);
  const simulation = new MindGraphSimulation({
    ...data,
    ...simulationConfig,
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

  window.addEventListener('resize', () => {
    const { width, height, deviceScale } = createStyles(style);
    visualCanvas.element.attr('width', width * deviceScale);
    visualCanvas.element.attr('height', height * deviceScale);
    visualCanvas.context?.scale(deviceScale, deviceScale);
    tick();
  });

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

  return {
    focus: (id) => {
      const node = simulationDatums.nodes.find((n) => n.id === id);
      if (!node) return false;

      console.log(zoomTransform);
      console.log(node);
      console.log({ width: window.innerWidth, height: window.innerHeight });
      tick();

      return true;
    },
  };
}
