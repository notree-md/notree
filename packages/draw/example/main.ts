import { GraphData } from '@mindgraph/types';
import { Artist } from '../src/index';
import { Simulation } from '../src/simulation';
import { Canvas, Drawable } from '../src/canvas';
import { RenderableNode, RenderableLink } from '../src/renderables';
import { MindGraph } from '../src/mindgraph';
import { Zoomer } from '../src/zoomer';
import { SimulationNode } from '../src/types';

class NodeTriangle implements Drawable {
  private node: SimulationNode;
  private triangleSize: number;

  public constructor(node: SimulationNode) {
    this.node = node;
    this.triangleSize = 50;
  }

  draw(canvas: Canvas, isActive: boolean): void {
    const triangleColor = isActive ? 'pink' : 'red';
    if (this.node.x && this.node.y) {
      canvas.drawLine(
        {
          source: { x: this.node.x - this.triangleSize, y: this.node.y },
          target: { x: this.node.x, y: this.node.y - this.triangleSize },
        },
        triangleColor,
      );
      canvas.drawLine(
        {
          source: { x: this.node.x, y: this.node.y - this.triangleSize },
          target: { x: this.node.x + this.triangleSize, y: this.node.y },
        },
        triangleColor,
      );
      canvas.drawLine(
        {
          source: { x: this.node.x + this.triangleSize, y: this.node.y },
          target: { x: this.node.x - this.triangleSize, y: this.node.y },
        },
        triangleColor,
      );
      canvas.drawText(this.node.name, 'white', this.node.x, this.node.y);
    }
  }
  isActive(cursor: { x: number; y: number }, zoomer: Zoomer): boolean {
    const translatedMouseX = cursor.x - zoomer.x;
    const translatedMouseY = cursor.y - zoomer.y;
    const scaledTriangleSize = this.triangleSize * zoomer.k;
    if (this.node.x && this.node.y) {
      const scaledNodeX = this.node.x * zoomer.k;
      const scaledNodeY = this.node.y * zoomer.k;
      return (
        scaledNodeX - scaledTriangleSize <= translatedMouseX &&
        scaledNodeX + scaledTriangleSize >= translatedMouseX &&
        scaledNodeY + scaledTriangleSize >= translatedMouseY &&
        scaledNodeY - scaledTriangleSize <= translatedMouseY
      );
    }
    return false;
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  const canvas = document.getElementById('app') as HTMLCanvasElement;

  if (!canvas) {
    alert('no canvas found in html body');
    return;
  }

  try {
    const data: GraphData = await fetch('/api/notes').then((response) =>
      response.json(),
    );
    const mg: MindGraph = new MindGraph({
      data,
      canvas,
    });
    mg.onClick((node) => alert(node.id));
    mg.draw();
  } catch (error) {
    alert(error);
  }
});
