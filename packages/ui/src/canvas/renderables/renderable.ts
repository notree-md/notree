import { SimulationNodeDatum } from 'd3-force';
import { Canvas } from '../canvas';
import { Focus } from '../types';

export interface Renderable extends SimulationNodeDatum {
  reset(): void;
  draw(canvas: Canvas, focus: Focus): void;
  onClick?(): void;
  onHover?(): void;
}

export const emptyNodeDatum = {
  index: undefined,
  x: undefined,
  y: undefined,
  vx: undefined,
  vy: undefined,
  fx: undefined,
  fy: undefined,
};

