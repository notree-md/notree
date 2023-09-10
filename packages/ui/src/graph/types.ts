export type Focus = 'active' | 'neutral' | 'inactive';

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

export type NodeClickEvent = { offsetX: number; offsetY: number };
export type NodeClickCallback = (node: Node) => void;

export type GraphStyleConfig = {
  nodeColor: string;
  activeNodeColor: string;
  hoverAnimationDuration: number;
  linkColor: string;
  activeLinkColor: string;
  titleColor: string;
  nodeTitlePadding: number;
  activeNodeTitlePadding: number;
  activeNodeRadiusPadding: number;
  minimumNodeSize: number;
  nodeScaleFactor: number;
  minZoom: number;
  maxZoom: number;
  dimmedLayerOpacity: number;
  dimmingLayerDuration: number;
};

export type GraphSimulationConfig = {
  chargeStrength: number;
  centerStrength: number;
  linkStrength: number;
  alpha: number;
  alphaDecay: number;
  initialClusterStrength: number;
  randomizeStartingPoints?: boolean;
};

export const emptyNodeDatum = {
  index: undefined,
  x: undefined,
  y: undefined,
  vx: undefined,
  vy: undefined,
  fx: undefined,
  fy: undefined,
};
