import { ZoomTransform, zoomIdentity } from 'd3-zoom';

export class Zoomer {
  constructor() {
    this.zoom_transform = zoomIdentity;
  }

  public replace(zoomTransform: ZoomTransform) {
    this.zoom_transform = zoomTransform;
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
