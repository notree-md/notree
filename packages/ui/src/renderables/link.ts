import { Canvas, Renderable } from '../canvas';
import { ConfiguredSimulationLink } from '../simulation';
import { Styles } from '../style';
import { Animation } from '../animation';
import { Zoomer } from '../zoomer';
import { RenderableNode } from './node';
import { Focus } from '../types';

export class RenderableLink implements Renderable {
  public lastTimeActive?: number;

  constructor(simLink: ConfiguredSimulationLink, styles: Styles) {
    this.sim_link = simLink;
    this.styles = styles;
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
    const sourceNode = new RenderableNode(this.sim_link.source, this.styles);
    const targetNode = new RenderableNode(this.sim_link.target, this.styles);

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
      source: this.sim_link.source,
      target: this.sim_link.target,
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

  private sim_link: ConfiguredSimulationLink;
  private styles: Styles;
  private current_link_color: string;
  private animation: Animation<string> | undefined;
  private color_config: Record<Focus, string>;
}
