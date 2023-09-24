import { GraphDataPayload } from '@notree/common';
import { Focus, GraphSimulationConfig } from './types';
import { startForceSimulation } from './simulation';
import { Link, Node, Renderable, emptyNodeDatum } from './models';
import { Styles, createStyles, isSSR } from './style';
import { Canvas } from './canvas';
import { Zoomer } from './zoomer';
import { Animation } from './animation';

interface Layer {
  drawables: Renderable[];
  focus: Focus;
  animation?: Animation<number>;
}

export interface GraphArgs {
  data: GraphDataPayload;
  canvas: HTMLCanvasElement;
  styles?: Partial<Styles>;
  simulationConfig?: Partial<GraphSimulationConfig>;
}

export class Graph {
  constructor({ data, canvas, styles, simulationConfig }: GraphArgs) {
    this.styles = createStyles(
      styles,
      canvas.getBoundingClientRect().width,
      canvas.getBoundingClientRect().height,
    );
    this.canvas = new Canvas(canvas, {
      deviceScale: this.styles.deviceScale,
    });
    this.zoomer = new Zoomer();

    this.data = { nodes: {}, links: {} };
    this.load_data(data);

    this.layers = [
      { drawables: [], focus: 'neutral' },
      { drawables: [], focus: 'neutral' },
      { drawables: [], focus: 'active' },
    ];

    startForceSimulation({
      data: {
        nodes: Object.values(this.data.nodes),
        links: Object.values(this.data.links),
      },
      simulationConfig: {
        randomizeStartingPoints: true,
        ...simulationConfig,
      },
      width: canvas.getBoundingClientRect().width,
      height: canvas.getBoundingClientRect().height,
    });
  }

  public draw() {
    this.artist.makeInteractive();
    this.render();
  }

  public draw(drawables: Renderable[]): void {
    if (isSSR()) return;
    this.drawables = drawables;
    this.redraw();
  }

  public makeInteractive(): void {
    this.add_window_resize_listener();
    this.add_zoom_listener();
    this.add_click_handler();
    this.add_mousemove_handler();
  }

  private data: {
    links: Record<string, Link>;
    nodes: Record<string, Node>;
  };
  private styles: Styles;
  private canvas: Canvas | undefined;
  private cursor: { x: number; y: number } | undefined;
  private zoomer: Zoomer;
  private layers: Layer[];

  private render() {
    if (isSSR()) return;

    this.artist.draw([
      ...Object.values(this.data.links),
      ...Object.values(this.data.nodes),
    ]);
    window.requestAnimationFrame(() => this.render());
  }

  private load_data(data: GraphDataPayload) {
    for (const [key, link] of Object.entries(data.links)) {
      this.data.links[key] = new Link(
        link.id,
        link.source,
        link.target,
        this.styles,
        emptyNodeDatum.index,
        emptyNodeDatum.x,
        emptyNodeDatum.y,
        emptyNodeDatum.vx,
        emptyNodeDatum.vy,
        emptyNodeDatum.fx,
        emptyNodeDatum.fy,
      );
    }

    for (const [key, node] of Object.entries(data.nodes)) {
      this.data.nodes[key] = new Node(
        node.id,
        node.title,
        node.totalDescendants,
        node.parentNodes,
        node.childNodes,
        node.parentLinks,
        node.childLinks,
        this.styles,
        emptyNodeDatum.index,
        emptyNodeDatum.x,
        emptyNodeDatum.y,
        emptyNodeDatum.vx,
        emptyNodeDatum.vy,
        emptyNodeDatum.fx,
        emptyNodeDatum.fy,
      );
    }
  }
  private redraw(): void {
    this.distribute_drawables();
    this.update_cursor();

    const layers = [this.purgatory, this.base_layer, this.active_layer];

    if (this.canvas) {
      this.canvas.clear();

      for (const layer of layers) {
        let layerOpacity =
          layer.focus === 'inactive' ? this.styles.dimmedLayerOpacity : 1;
        if (layer.animation) {
          layerOpacity = layer.animation.getValue();
          if (layer.animation.state.current == layer.animation.state.desired) {
            layer.animation = undefined;
          }
        }

        this.canvas.drawFrame({
          zoomer: this.zoomer,
          drawables: layer.drawables,
          config: {
            layer: {
              opacity: layerOpacity,
            },
            drawables: {
              focus: layer.focus,
            },
          },
        });
      }
    }
  }

  private add_window_resize_listener(): void {
    if (isSSR()) return;

    window.addEventListener('resize', () => {
      this.canvas?.resizeCanvas();
    });
  }

  private add_zoom_listener(): void {
    this.canvas?.call(
      this.zoomer.configureZoomArea<HTMLCanvasElement>({
        width: this.styles.width,
        height: this.styles.height,
        minZoom: this.styles.minZoom,
        maxZoom: this.styles.maxZoom,
      }),
    );
  }

  private distribute_drawables(): void {
    const now = new Date().getTime();
    const activeAtStart = this.active_layer.drawables.length;

    this.active_layer.drawables = [];
    this.purgatory.drawables = [];
    this.base_layer.drawables = [];

    for (const d of this.drawables) {
      if (
        this.cursor &&
        d.isActive({ x: this.cursor.x, y: this.cursor.y }, this.zoomer) &&
        !this.active_layer.drawables.includes(d)
      ) {
        this.active_layer.drawables.push(d);
      } else if (
        typeof d.lastTimeActive === 'number' &&
        now - d.lastTimeActive <= this.styles.dimmingLayerDuration * 1000
      ) {
        this.purgatory.drawables.push(d);
      } else {
        this.base_layer.drawables.push(d);
      }
    }

    if (this.active_layer.drawables.length) {
      this.base_layer.focus = 'inactive';
      do {
        const node = this.purgatory.drawables.pop();
        if (node) {
          node.reset();
          this.base_layer.drawables.push(node);
        }
      } while (this.purgatory.drawables.length);
    } else {
      this.base_layer.focus = 'neutral';
    }

    if (activeAtStart && !this.active_layer.drawables.length) {
      this.base_layer.animation = new Animation({
        from:
          this.base_layer.animation?.getValue() ||
          this.styles.dimmedLayerOpacity,
        to: 1,
        duration: this.styles.dimmingLayerDuration,
        easing: 'easeout',
      });
    } else if (!activeAtStart && this.active_layer.drawables.length) {
      this.base_layer.animation = new Animation({
        from: this.base_layer.animation?.getValue() || 1,
        to: this.styles.dimmedLayerOpacity,
        duration: this.styles.dimmingLayerDuration,
        easing: 'easeout',
      });
    }
  }

  private update_cursor(): void {
    if (this.active_layer.drawables.length > 0) {
      this.canvas?.setCursor('pointer');
    } else {
      this.canvas?.setCursor('default');
    }
  }

  private add_click_handler(): void {
    this.canvas?.on('click', ({ offsetX, offsetY }) => {
      for (const d of this.drawables) {
        if (
          this.cursor &&
          d.isActive({ x: offsetX, y: offsetY }, this.zoomer) &&
          d.onClick
        ) {
          d.onClick();
        }
      }
    });
  }

  private add_mousemove_handler(): void {
    this.canvas?.on('mousemove', ({ offsetX, offsetY }) => {
      this.cursor = { x: offsetX, y: offsetY };
      this.distribute_drawables();
    });
  }
}
