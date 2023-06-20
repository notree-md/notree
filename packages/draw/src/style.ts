import { Color, GraphStyleConfig } from './types';

export type Styles = ReturnType<typeof createStyles>;

export function createStyles(
  styleConfig: Partial<GraphStyleConfig> | undefined,
  canvasWidth: number,
  canvasHeight: number,
) {
  if (isSSR()) {
    return { ...default_styles, width: 0, height: 0, deviceScale: 0 };
  }

  const width =
    window.innerWidth <= canvasWidth ? window.innerWidth : canvasWidth;
  const height =
    window.innerHeight <= canvasHeight ? window.innerHeight : canvasHeight;
  const deviceScale = window.devicePixelRatio;

  return {
    ...default_styles,
    ...styleConfig,
    width,
    height,
    deviceScale,
  };
}

export function isSSR(): boolean {
  return typeof window === 'undefined';
}

export function colorToRgba({ r, g, b, a = 1 }: Color): string {
  return `rgba(${r},${g},${b},${a})`;
}

const default_styles: GraphStyleConfig = {
  minZoom: 0.4,
  maxZoom: 16,
  hoverAnimationDuration: 0.3,
  nodeColor: {
    r: 1,
    g: 176,
    b: 211,
  },
  activeNodeColor: {
    r: 255,
    g: 255,
    b: 255,
  },
  linkColor: {
    r: 1,
    g: 88,
    b: 106,
  },
  activeLinkColor: {
    r: 255,
    g: 255,
    b: 255,
  },
  titleColor: {
    r: 255,
    g: 255,
    b: 255,
  },
  nodeTitlePadding: 12,
  activeNodeTitlePadding: 14,
  activeNodeRadiusPadding: 1,
  nodeScaleFactor: 0.96,
  minimumNodeSize: 4,
};
