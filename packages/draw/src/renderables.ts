import { Canvas, Drawable } from './canvas';
import { NodeClickCallback } from './mindgraph';
import { ConfiguredSimulationLink } from './simulation';
import { Styles } from './style';
import { SimulationNode, Circle } from './types';
import { Zoomer } from './zoomer';
import { Animation } from './animation';

function between(min: number, max: number, val: number): boolean {
  return val >= min && val <= max;
}

const ANIMATION_TIME = 0.2;

export class RenderableLink implements Drawable {
  private simLink: ConfiguredSimulationLink;
  private styles: Styles;
  private currentLinkColor: string;
  private animation: Animation<string> | undefined;

  public constructor(simLink: ConfiguredSimulationLink, styles: Styles) {
    this.simLink = simLink;
    this.styles = styles;
    this.currentLinkColor = this.styles.linkColor;
    this.animation = undefined;
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

    const desiredColor = highlightMap[highlight];
    if (desiredColor != this.currentLinkColor) {
      if (
        this.animation === undefined ||
        this.animation.state.desired != desiredColor
      ) {
        this.animation = new Animation({
          from: this.currentLinkColor,
          to: desiredColor,
          easing: 'linear',
          duration: ANIMATION_TIME,
        });
      } else {
        this.currentLinkColor = this.animation.getValue();
      }
    }
    canvas.drawLine(line, this.currentLinkColor);
  }
}

export class RenderableNode implements Drawable {
  private simNode: SimulationNode;
  private circle: Circle;
  private styles: Styles;
  private callback: NodeClickCallback | undefined;
  private currentNodeColor: string;
  private animation: Animation<string> | undefined;

  public constructor(
    simNode: SimulationNode,
    styles: Styles,
    callback?: NodeClickCallback,
  ) {
    this.simNode = simNode;
    this.styles = styles;
    this.callback = callback;
    this.animation = undefined;
    this.currentNodeColor = this.styles.nodeColor;
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

    const desiredColor = highlightMap[highlight];
    if (desiredColor != this.currentNodeColor) {
      if (
        this.animation === undefined ||
        this.animation.state.desired != desiredColor
      ) {
        this.animation = new Animation({
          from: this.currentNodeColor,
          to: desiredColor,
          easing: 'easein',
          duration: ANIMATION_TIME,
        });
      } else {
        this.currentNodeColor = this.animation.getValue();
      }
    }

    const textColor = this.styles.titleColor;
    const textPadding =
      highlight === 'active'
        ? this.styles.activeNodeTitlePadding
        : this.styles.nodeTitlePadding;
    canvas.drawCircle(
      {
        x: this.simNode.x,
        y: this.simNode.y,
        radius: this.circle.radius + radiusPadding,
      },
      this.currentNodeColor,
      {
        text: text,
        textColor: textColor,
        textPadding: textPadding,
      },
    );
  }
}
