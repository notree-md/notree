import { Canvas, Renderable } from '../canvas';
import { Styles } from '../style';
import { Animation } from '../animation';
import { Zoomer } from '../zoomer';
import { Circle, Focus, NodeClickCallback, SimulationNode } from '../types';

export class RenderableNode implements Renderable {
  public lastTimeActive?: number;

  constructor(
    simNode: SimulationNode,
    styles: Styles,
    callback?: NodeClickCallback,
  ) {
    this.sim_node = simNode;
    this.styles = styles;
    this.callback = callback;
    this.animation = undefined;
    this.current_node_color = this.styles.nodeColor;
    this.circle = {
      x: this.sim_node.x,
      y: this.sim_node.y,
      radius:
        styles.minimumNodeSize +
        (this.sim_node.totalDescendants || 1) ** styles.nodeScaleFactor,
    };
    this.color_config = {
      active: this.styles.activeNodeColor,
      neutral: this.styles.nodeColor,
      inactive: this.styles.nodeColor,
    };
  }

  public onClick() {
    if (this.callback) {
      this.callback(this.sim_node);
    }
  }

  public reset() {
    this.lastTimeActive = undefined;
    this.current_node_color = this.styles.nodeColor;
    this.animation = undefined;
  }

  public isActive(cursor: { x: number; y: number }, zoomer: Zoomer): boolean {
    let out = false;

    const translatedMouseX = cursor.x - zoomer.x;
    const translatedMouseY = cursor.y - zoomer.y;
    if (this.sim_node.x && this.sim_node.y) {
      const scaledNodeX = this.sim_node.x * zoomer.k;
      const scaledNodeY = this.sim_node.y * zoomer.k;
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
        out = true;
      }
    }

    if (out) {
      this.lastTimeActive = new Date().getTime();
    }

    return out;
  }

  public draw(canvas: Canvas, focus: Focus): void {
    const radiusPadding =
      focus === 'active' ? this.styles.activeNodeRadiusPadding : 0;
    const text = this.sim_node.title.split('.md')[0];

    const desiredColor = this.color_config[focus];

    if (desiredColor != this.current_node_color) {
      if (
        this.animation === undefined ||
        this.animation.state.desired != desiredColor
      ) {
        this.animation = new Animation({
          from: this.current_node_color,
          to: desiredColor,
          easing: 'easeout',
          duration: this.styles.hoverAnimationDuration,
        });
      } else {
        this.current_node_color = this.animation.getValue();
      }
    }

    const textColor = this.styles.titleColor;
    const textPadding =
      focus === 'active'
        ? this.styles.activeNodeTitlePadding
        : this.styles.nodeTitlePadding;
    canvas.drawCircle(
      {
        x: this.sim_node.x,
        y: this.sim_node.y,
        radius: this.circle.radius + radiusPadding,
      },
      this.current_node_color,
      {
        text: text,
        textColor: textColor,
        textPadding: textPadding,
      },
    );
  }

  private sim_node: SimulationNode;
  private circle: Circle;
  private styles: Styles;
  private callback: NodeClickCallback | undefined;
  private current_node_color: string;
  private animation: Animation<string> | undefined;
  private color_config: Record<Focus, string>;
}

function between(min: number, max: number, val: number): boolean {
  return val >= min && val <= max;
}
