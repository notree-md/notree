import { Canvas, Drawable } from './canvas';
import { NodeClickCallback } from './mindgraph';
import { ConfiguredSimulationLink } from './simulation';
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

  draw(canvas: Canvas, highlight: 'active' | 'dimmed' | 'normal'): void {
    const line = {
      source: this.simLink.source,
      target: this.simLink.target,
    };
    const highlightMap = {
      active: this.styles.activeLinkColor,
      dimmed: this.styles.dimmedLinkColor,
      normal: this.styles.linkColor,
    };
    canvas.drawLine(line, highlightMap[highlight]);
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

  draw(canvas: Canvas, highlight: 'active' | 'dimmed' | 'normal'): void {
    const radiusPadding =
      highlight === 'active' ? this.styles.activeNodeRadiusPadding : 0;
    const text = this.simNode.name.split('.md')[0];
    const highlightMap = {
      active: this.styles.activeNodeColor,
      dimmed: this.styles.dimmedNodeColor,
      normal: this.styles.nodeColor,
    };
    const textColor = this.styles.titleColor;
    const textPadding =
      highlight === 'active'
        ? this.styles.activeNodeTitlePadding
        : this.styles.nodeTitlePadding;
    canvas.drawCircle(
      { ...this.circle, radius: this.circle.radius + radiusPadding },
      highlightMap[highlight],
      {
        text: text,
        textColor: textColor,
        textPadding: textPadding,
      },
    );
  }
}
