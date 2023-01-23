import { loadCanvas } from './canvas';
import { createSimulationNodeDatums } from './simulation';
import { getStyles } from './style';
import { loadSvgElements } from './svg';
import { MindGraphConfig } from './types';

export function draw({
  data,
  canvasElement,
  onNodeClick,
  style,
}: MindGraphConfig) {
  const simulationDatums = createSimulationNodeDatums(data);
  const svgElements = loadSvgElements(simulationDatums);

  const styleConfig = getStyles(style);

  const visualCanvas = loadCanvas(styleConfig, true, canvasElement);
  const clickMapCanvas = loadCanvas(styleConfig, false);
}
