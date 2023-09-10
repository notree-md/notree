import { Canvas, Renderable } from '../canvas';
import { Styles } from '../style';
import { Animation } from '../animation';
import { Zoomer } from '../zoomer';
import { Focus, emptyNodeDatum } from '../types';
import { GraphDataPayload, ServerLink } from '@notree/common';
import { Node } from './node';

export class Link implements Renderable {
  public lastTimeActive?: number;

  constructor(
    public id: string,
    public source: Node,
    public target: Node,
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

  public static fromServerLink(
    link: ServerLink,
    styles: Styles,
    data: GraphDataPayload,
  ): Link {
    if (link instanceof Link) return link as unknown as Link;

    const convertedLink = new Link(
      link.id,
      Node.fromServerNode(data.nodes[link.source], styles, data),
      Node.fromServerNode(data.nodes[link.target], styles, data),
      styles,
      emptyNodeDatum.index,
      emptyNodeDatum.x,
      emptyNodeDatum.y,
      emptyNodeDatum.vx,
      emptyNodeDatum.vy,
      emptyNodeDatum.fx,
      emptyNodeDatum.fy,
    );

    data.links[link.id] = convertedLink as unknown as ServerLink;

    return convertedLink;
  }

  public reset() {
    this.lastTimeActive = undefined;
    this.current_link_color = this.styles.linkColor;
    this.animation = undefined;
  }

  public isActive(cursor: { x: number; y: number }, zoomer: Zoomer): boolean {
    const sourceNode = this.source;
    const targetNode = this.target;

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
