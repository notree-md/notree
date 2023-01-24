import { zoomIdentity, zoom, ZoomTransform } from 'd3-zoom';
import { drawFrame, loadCanvas } from './canvas';
import { buildSimulation, loadSimulationNodeDatums } from './simulation';
import {
  convertRgbArrayToStyle,
  generateUniqueColors,
  getStyles,
} from './style';
import { loadSvgElements, nextFrame } from './svg';
import { MindGraphConfig, NodeClickEvent } from './types';

export function draw({
  data,
  canvasElement,
  onNodeClick,
  style,
}: MindGraphConfig) {
  let zoomTransform = zoomIdentity;

  const styleConfig = getStyles(style);

  const simulationDatums = loadSimulationNodeDatums(data);
  const simulation = buildSimulation({
    ...simulationDatums,
    width: styleConfig.width,
    height: styleConfig.height,
  });

  const svgElements = loadSvgElements(simulationDatums);
  const visualCanvas = loadCanvas(styleConfig, true, canvasElement);

  const tick = () => {
    nextFrame(svgElements);
    drawFrame({
      canvas: visualCanvas,
      style: styleConfig,
      svgElements,
      zoomTransform,
    });
  };

  visualCanvas.element.call(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    zoom<HTMLCanvasElement, any>()
      .extent([
        [0, 0],
        [styleConfig.width, styleConfig.height],
      ])
      .scaleExtent([0.4, 16])
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
}
