import { Canvas, Renderable } from '../canvas';
import { Styles } from '../style';
import { Animation } from '../animation';
import { Zoomer } from '../zoomer';
import { Focus, Link } from '../types';

export class RenderableLink implements Renderable {
  public lastTimeActive?: number;

  constructor(
    private data: Link,
    private styles: Styles,
  ) {
    this.current_link_color = this.styles.linkColor;
    this.animation = undefined;
    this.color_config = {
      active: this.styles.activeLinkColor,
      neutral: this.styles.linkColor,
      inactive: this.styles.linkColor,
    };
  }

  public reset() {
    this.lastTimeActive = undefined;
    this.current_link_color = this.styles.linkColor;
    this.animation = undefined;
  }

  public isActive(cursor: { x: number; y: number }, zoomer: Zoomer): boolean {
    const sourceNode = this.data.source.renderable;
    const targetNode = this.data.target.renderable;

    const out =
      sourceNode.isActive(cursor, zoomer) ||
      targetNode.isActive(cursor, zoomer);

    if (out) {
      this.lastTimeActive = new Date().getTime();
    }

    return out;
  }

  public draw(canvas: Canvas, focus: Focus): void {
    const line = {
      source: this.data.source,
      target: this.data.target,
    };

    const desiredColor = this.color_config[focus];

    if (desiredColor != this.current_link_color) {
      if (
        this.animation === undefined ||
        this.animation.state.desired != desiredColor
      ) {
        this.animation = new Animation({
          from: this.current_link_color,
          to: desiredColor,
          easing: 'easeout',
          duration: this.styles.hoverAnimationDuration,
        });
      } else {
        this.current_link_color = this.animation.getValue();
      }
    }
    canvas.drawLine(line, this.current_link_color);
  }

  private current_link_color: string;
  private animation: Animation<string> | undefined;
  private color_config: Record<Focus, string>;
}
