import { Canvas } from './canvas';
import { Simulation } from './simulation';
import { Zoomer } from './zoomer';
import { Styles, createStyles, generateUniqueColors, isSSR } from './style';
import {
  MindGraphConfig,
  MindGraphEvent,
  NodeClickCallback,
  SimulationNode,
} from './types';

export class Artist {

  constructor({ data, style, simulationConfig, canvas }: MindGraphConfig) {
    this.canvasElement = canvas;
    this.canvasInitialWidth = canvas.getBoundingClientRect().width;
    this.canvasInitialHeight = canvas.getBoundingClientRect().height;

    this.styles = createStyles(style, this.canvasInitialWidth, this.canvasInitialHeight);

    this.simulation = new Simulation({
      data,
      simulationConfig,
      styles: this.styles,
    });


    this.click_map_colors = generateUniqueColors(data.nodes.length);
    this.click_map_canvas = new Canvas(this.styles);
    this.visual_canvas = undefined;

    this.zoomer = new Zoomer();
    this.event_listeners = [];
  }

  public draw(): void {
    if (isSSR()) return;

    this.visual_canvas = new Canvas(
      this.styles,
      this.canvasElement,
      this.styles.deviceScale,
    );

    this.add_window_resize_listener();
    this.add_zoom_listener();
    this.add_click_handler();
    this.add_mousemove_handler();

    this.simulation.start([() => this.tick()]);
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
  private activeNode: SimulationNode | undefined;
  private styles: Styles;
  private simulation: Simulation;
  private click_map_canvas: Canvas;
  private click_map_colors: string[];
  private zoomer: Zoomer;
  private event_listeners: {
    id: number;
    event: MindGraphEvent;
    callback: NodeClickCallback;
  }[];

  private tick(): void {
    this.visual_canvas?.drawFrame({
      simulation: this.simulation,
      zoomer: this.zoomer,
      styles: this.styles,
      activeNode: this.activeNode,
    });
  }

  private add_window_resize_listener(): void {
    if (isSSR()) return;

    window.addEventListener('resize', () => {
      this.visual_canvas?.setDimensions();
      this.tick();
    });
  }

  private add_zoom_listener(): void {
    this.visual_canvas?.call(
      this.zoomer.configureZoomArea<HTMLCanvasElement>({
        width: this.styles.width,
        height: this.styles.height,
        minZoom: this.simulation.configuration.minZoom,
        maxZoom: this.simulation.configuration.maxZoom,
        observers: [() => this.tick()],
      }),
    );
  }

  private add_click_handler(): void {
    this.visual_canvas?.on('click', ({ layerX, layerY }) => {
      if (!this.event_listeners.length) return;

      const uniqueColorToNode = this.click_map_canvas.drawFrame({
        styles: this.styles,
        uniqueNodeColors: this.click_map_colors,
        simulation: this.simulation,
        zoomer: this.zoomer,
        activeNode: this.activeNode,
      });

      const clickedNode =
        uniqueColorToNode[this.click_map_canvas.getPixelColor(layerX, layerY)];

      if (clickedNode) {
        this.event_listeners
          .filter((e) => e.event === 'nodeClick')
          .forEach((c) => c.callback(clickedNode));
      }
    });
  }

  private add_mousemove_handler(): void {
    this.visual_canvas?.on('mousemove', ({ offsetX, offsetY }) => {
      const uniqueColorToNode = this.click_map_canvas.drawFrame({
        styles: this.styles,
        uniqueNodeColors: this.click_map_colors,
        simulation: this.simulation,
        zoomer: this.zoomer,
        activeNode: this.activeNode,
      });

      this.tick();

      const hoverNode =
        uniqueColorToNode[
          this.click_map_canvas.getPixelColor(offsetX, offsetY)
        ];

      if (hoverNode) {
        this.activeNode = hoverNode;
        this.visual_canvas?.setCursor('pointer');
      } else {
        this.activeNode = undefined;
        this.visual_canvas?.setCursor('default');
      }
    });
  }
}
