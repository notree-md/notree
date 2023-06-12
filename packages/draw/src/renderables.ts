import { Canvas, Drawable } from './canvas';
import { NodeClickCallback } from './mindgraph';
import { ConfiguredSimulationLink } from './simulation/simulation';
import { Styles } from './style';
import { SimulationNode, Circle } from './types';
import { Zoomer } from './zoomer';

function between(min: number, max: number, val: number): boolean {
  return val >= min && val <= max;
}

export class RenderableLink implements Drawable {
  private simLink: ConfiguredSimulationLink;
  private styles: Styles;

  public constructor(simLink: ConfiguredSimulationLink, styles: Styles) {
    this.simLink = simLink;
    this.styles = styles;
  }

  isActive(cursor: { x: number; y: number }, zoomer: Zoomer): boolean {
    const sourceNode = new RenderableNode(this.simLink.source, this.styles);
    const targetNode = new RenderableNode(this.simLink.target, this.styles);
    return (
      sourceNode.isActive(cursor, zoomer) || targetNode.isActive(cursor, zoomer)
    );
  }

  draw(canvas: Canvas, isActive: boolean): void {
    const line = {
      source: this.simLink.source,
      target: this.simLink.target,
    };
    const lineColor = isActive
      ? this.styles.activeLinkColor
      : this.styles.linkColor;
    canvas.drawLine(line, lineColor);
  }
}

export class RenderableNode implements Drawable {
  private simNode: SimulationNode;
  private circle: Circle;
  private styles: Styles;
  private callback: NodeClickCallback | undefined;

  public constructor(
    simNode: SimulationNode,
    styles: Styles,
    callback?: NodeClickCallback,
  ) {
    this.simNode = simNode;
    this.styles = styles;
    this.callback = callback;
    this.circle = {
      x: this.simNode.x,
      y: this.simNode.y,
      radius:
        styles.minimumNodeSize +
        (this.simNode.linkCount || 1) ** styles.nodeScaleFactor,
    };
  }

  onClick() {
    if (this.callback) {
      this.callback(this.simNode);
    }
  }

  isActive(cursor: { x: number; y: number }, zoomer: Zoomer): boolean {
    const translatedMouseX = cursor.x - zoomer.x;
    const translatedMouseY = cursor.y - zoomer.y;
    if (this.simNode.x && this.simNode.y) {
      const scaledNodeX = this.simNode.x * zoomer.k;
      const scaledNodeY = this.simNode.y * zoomer.k;
      const scaledNodeRadius = this.circle.radius * zoomer.k;
      if (
        between(
          scaledNodeX - scaledNodeRadius,
          scaledNodeX + scaledNodeRadius,
          translatedMouseX,
        ) &&
        between(
          scaledNodeY - scaledNodeRadius,
          scaledNodeY + scaledNodeRadius,
          translatedMouseY,
        )
      ) {
        return true;
      }
    }
    return false;
  }

  draw(canvas: Canvas, isActive: boolean): void {
    const radiusPadding = isActive ? this.styles.activeNodeRadiusPadding : 0;
    const text = this.simNode.name.split('.md')[0];
    const circleColor = isActive
      ? this.styles.activeNodeColor
      : this.styles.nodeColor;
    const textColor = this.styles.titleColor;
    const textPadding = isActive
      ? this.styles.activeNodeTitlePadding
      : this.styles.nodeTitlePadding;
    canvas.drawCircle(
      { ...this.circle, radius: this.circle.radius + radiusPadding },
      circleColor,
      {
        text: text,
        textColor: textColor,
        textPadding: textPadding,
      },
    );
  }
}
