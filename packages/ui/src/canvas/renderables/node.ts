import { Styles } from '../style';
import { Circle, Focus } from '../types';
import { CursorPosition, Renderable } from './renderable';
import { Animation } from '../animation';
import { Canvas } from '../canvas';
import { Zoomer } from '../zoomer';

export class Node implements Renderable {
  public lastTimeActive?: number;

  constructor(
    public id: string,
    public title: string,
    public totalDescendants: number,
    public parentNodes: string[],
    public childNodes: string[],
    public parentLinks: string[],
    public childLinks: string[],
    private styles: Styles,
    public index?: number,
    public x?: number,
    public y?: number,
    public vx?: number,
    public vy?: number,
    public fx?: number,
    public fy?: number,
  ) {
    this.animation = undefined;
    this.current_node_color = this.styles.nodeColor;
    this.circle = {
      x: x,
      y: y,
      radius:
        styles.minimumNodeSize +
        (totalDescendants || 1) ** styles.nodeScaleFactor,
    };
    this.color_config = {
      active: this.styles.activeNodeColor,
      neutral: this.styles.nodeColor,
      inactive: this.styles.nodeColor,
    };
  }

  public reset() {
    this.lastTimeActive = undefined;
    this.current_node_color = this.styles.nodeColor;
    this.animation = undefined;
  }

  public draw(canvas: Canvas, focus: Focus): void {
    const radiusPadding =
      focus === 'active' ? this.styles.activeNodeRadiusPadding : 0;
    const text = this.title.split('.md')[0];

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
        x: this.x,
        y: this.y,
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

  public isUnderCursor(cursor: CursorPosition, zoomer: Zoomer) {
    return false;
  }

  private circle: Circle;
  private current_node_color: string;
  private animation: Animation<string> | undefined;
  private color_config: Record<Focus, string>;
}
