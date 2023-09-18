import { Canvas } from '../canvas';
import { Styles } from '../style';
import { Focus } from '../types';
import { Animation } from '../animation';
import { Renderable } from './renderable';

export class Link implements Renderable {
  public lastTimeActive?: number;

  constructor(
    public id: string,
    public source: string,
    public target: string,
    private styles: Styles,
    public index?: number,
    public x?: number,
    public y?: number,
    public vx?: number,
    public vy?: number,
    public fx?: number,
    public fy?: number,
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

  public draw(canvas: Canvas, focus: Focus): void {
    const line = {
      source: this.source,
      target: this.target,
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
