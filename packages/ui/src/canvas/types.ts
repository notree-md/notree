export interface ZoomAreaConfiguration {
  width: number;
  height: number;
  minZoom: number;
  maxZoom: number;
  observers?: (() => void)[];
}

export type Circle = {
  x?: number;
  y?: number;
  radius: number;
};

export type Line = {
  source: {
    x?: number;
    y?: number;
  };
  target: {
    x?: number;
    y?: number;
  };
};

export type Focus = 'active' | 'neutral' | 'inactive';
