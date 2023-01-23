import { create, select } from 'd3-selection';
import { getStyles } from './style';

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
