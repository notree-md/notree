import { Canvas } from './canvas';
import { Zoomer } from './zoomer';
import { Styles, createStyles, isSSR } from './style';
import {
  MindGraphConfig,
  MindGraphEvent,
  NodeClickCallback,
  RenderableNode,
  SimulationNode,
} from './types';
import { ConfiguredSimulationLink } from './simulation/simulation';

export class Artist {
  constructor({ style, canvas }: MindGraphConfig) {
    this.canvasElement = canvas;
    this.canvasInitialWidth = canvas.getBoundingClientRect().width;
    this.canvasInitialHeight = canvas.getBoundingClientRect().height;

    this.styles = createStyles(
      style,
      this.canvasInitialWidth,
      this.canvasInitialHeight,
    );

    this.visual_canvas = new Canvas(
      this.canvasElement,
      this.styles.deviceScale,
    );

    this.zoomer = new Zoomer();
    this.event_listeners = [];
    this.nodes = [];
    this.links = [];

    this.add_window_resize_listener();
    this.add_zoom_listener();
    this.add_click_handler();
    this.add_mousemove_handler();
  }

  public get canvasInitialWidth(): number {
    return this.canvasInitialWidth;
  }
  
  public get canvasInitialHeight(): number {
    return this.canvasInitialHeight;
  }

  public draw(nodes: SimulationNode[], links: ConfiguredSimulationLink[]): void {
    if (isSSR()) return;
    this.nodes = nodes.map(n => {
      const r = this.styles.minimumNodeSize + (n.linkCount || 1) ** this.styles.nodeScaleFactor;
      return {
        ...n,
        radius: r,
        text: n.name.split(".md")[0]
      }
    });
    this.links = links;
    this.redraw()
  }

  private redraw(): void {
    this.visual_canvas?.drawFrame({
      nodes: this.nodes,
      links: this.links,
      zoomer: this.zoomer,
      styles: this.styles,
      activeNode: this.activeNode,
    });
  }

  public addEventListener(
    event: 'nodeClick',
    callback: NodeClickCallback,
  ): number;
  public addEventListener(event: MindGraphEvent, callback: never): number {
    const id =
      (this.event_listeners[this.event_listeners.length - 1]?.id || 0) + 1;

    this.event_listeners.push({ id, event, callback });

    return id;
  }

  private canvasInitialWidth: number;
  private canvasInitialHeight: number;
  private canvasElement: HTMLCanvasElement;
  private visual_canvas: Canvas | undefined;
  private activeNode: RenderableNode | undefined;
  private styles: Styles;
  private zoomer: Zoomer;
  private nodes: RenderableNode[];
  private links: ConfiguredSimulationLink[];
  private event_listeners: {
    id: number;
    event: MindGraphEvent;
    callback: NodeClickCallback;
  }[];

  private add_window_resize_listener(): void {
    if (isSSR()) return;

    window.addEventListener('resize', () => {
      this.visual_canvas?.setDimensions();
      this.redraw();
    });
  }

  private add_zoom_listener(): void {
    this.visual_canvas?.call(
      this.zoomer.configureZoomArea<HTMLCanvasElement>({
        width: this.styles.width,
        height: this.styles.height,
        minZoom: this.styles.minZoom,
        maxZoom: this.styles.maxZoom,
        observers: [() => this.redraw()],
      }),
    );
  }

  private between(min: number, max: number, val: number): boolean {
    return val >= min && val <= max;
  }

  private detect_node_cursor_collision(x: number, y: number): RenderableNode | undefined {
    const translatedMouseX = (x - this.zoomer.x);
    const translatedMouseY = (y - this.zoomer.y);
    for (const node of this.nodes) {
      if (node.x && node.y) {
        const scaledNodeX = node.x * this.zoomer.k;
        const scaledNodeY = node.y * this.zoomer.k;
        const scaledNodeRadius = node.radius * this.zoomer.k;
        if (this.between(scaledNodeX - scaledNodeRadius, scaledNodeX + scaledNodeRadius, translatedMouseX) && (this.between(scaledNodeY - scaledNodeRadius, scaledNodeY + scaledNodeRadius, translatedMouseY))) {
          return node;
        }
      }
    }
    return
  }

  private add_click_handler(): void {
    this.visual_canvas?.on('click', ({layerX, layerY}) => {
      if (!this.event_listeners.length) return;
      
      const clickedNode = this.detect_node_cursor_collision(layerX, layerY);
      if (clickedNode) {
        this.event_listeners
          .filter((e) => e.event === 'nodeClick')
          .forEach((c) => c.callback(clickedNode as RenderableNode));
      }
    });
  }

  private add_mousemove_handler(): void {
    this.visual_canvas?.on('mousemove', ({ offsetX, offsetY }) => {
      const hoverNode = this.detect_node_cursor_collision(offsetX, offsetY)
      if (hoverNode) {
        if (this.activeNode != hoverNode) {
          this.activeNode = hoverNode;
          this.redraw();
          this.visual_canvas?.setCursor('pointer');
        }
      } else {
        if (this.activeNode != undefined) {
          this.activeNode = undefined;
          this.redraw();
        }
        this.visual_canvas?.setCursor('default');
      }
    });
  }
}
