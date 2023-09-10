import { ZoomTransform, zoom, zoomIdentity } from 'd3-zoom';

export interface ZoomAreaConfiguration {
  width: number;
  height: number;
  minZoom: number;
  maxZoom: number;
  observers?: (() => void)[];
}

export class Zoomer {
  constructor() {
    this.zoom_transform = zoomIdentity;
  }

  public configureZoomArea<TArea extends Element>(
    config: ZoomAreaConfiguration,
  ) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- second generic on zoom seems broken
    return zoom<TArea, any>()
      .extent([
        [0, 0],
        [config.width, config.height],
      ])
      .scaleExtent([config.minZoom, config.maxZoom])
      .on('zoom', (e: { transform: ZoomTransform }) => {
        this.zoom_transform = e.transform;
        config.observers?.forEach((f) => f());
      });
  }

  public get x() {
    return this.zoom_transform.x;
  }

  public get y() {
    return this.zoom_transform.y;
  }

  public get k() {
    return this.zoom_transform.k;
  }

  private zoom_transform: ZoomTransform;
}
