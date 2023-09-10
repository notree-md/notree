import { Canvas, Renderable } from '../canvas';
import { Styles } from '../style';
import { Animation } from '../animation';
import { Zoomer } from '../zoomer';
import { Circle, Focus, NodeClickCallback, emptyNodeDatum } from '../types';
import { Link } from './link';
import { GraphDataPayload, ServerNode } from '@notree/common';

export class Node implements Renderable {
  public lastTimeActive?: number;

  constructor(
    public id: string,
    public title: string,
    public totalDescendants: number,
    public parentNodes: Node[],
    public childNodes: Node[],
    public parentLinks: Link[],
    public childLinks: Link[],
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
    this.callback = undefined;
    this.current_node_color = this.styles.nodeColor;
    this.circle = {
      x: this.x,
      y: this.y,
      radius:
        styles.minimumNodeSize +
        (this.totalDescendants || 1) ** styles.nodeScaleFactor,
    };
    this.color_config = {
      active: this.styles.activeNodeColor,
      neutral: this.styles.nodeColor,
      inactive: this.styles.nodeColor,
    };
  }

  public static fromServerNode(
    node: ServerNode,
    styles: Styles,
    data: GraphDataPayload,
  ): Node {
    console.log(node);
    if (node instanceof Node) return node as unknown as Node;

    const convertedNode = new Node(
      node.id,
      node.title,
      node.totalDescendants,
      node.parentNodes.map((id) =>
        Node.fromServerNode(data.nodes[id], styles, data),
      ),
      node.childNodes.map((id) =>
        Node.fromServerNode(data.nodes[id], styles, data),
      ),
      node.parentLinks.map((id) =>
        Link.fromServerLink(data.links[id], styles, data),
      ),
      node.childLinks.map((id) =>
        Link.fromServerLink(data.links[id], styles, data),
      ),
      styles,
      emptyNodeDatum.index,
      emptyNodeDatum.x,
      emptyNodeDatum.y,
      emptyNodeDatum.vx,
      emptyNodeDatum.vy,
      emptyNodeDatum.fx,
      emptyNodeDatum.fy,
    );

    data.nodes[node.id] = convertedNode as unknown as ServerNode;

    return convertedNode;
  }

  public onClick() {
    if (this.callback) {
      // TODO
      // this.callback(this);
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
    if (this.x && this.y) {
      const scaledNodeX = this.x * zoomer.k;
      const scaledNodeY = this.y * zoomer.k;
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

  private callback: NodeClickCallback | undefined;
  private circle: Circle;
  private current_node_color: string;
  private animation: Animation<string> | undefined;
  private color_config: Record<Focus, string>;
}

function between(min: number, max: number, val: number): boolean {
  return val >= min && val <= max;
}
