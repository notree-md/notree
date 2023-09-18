import { Canvas } from '../canvas';
import { Focus } from '../types';
import { Zoomer } from '../zoomer';

export interface Renderable {
  lastTimeActive?: number;
  reset(): void;
  draw(canvas: Canvas, focus: Focus): void;
  // isActive(cursor: { x: number; y: number }, zoomer: Zoomer): boolean;
  onClick?(): void;
  onHover?(): void;
}
