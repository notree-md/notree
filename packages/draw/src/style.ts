import { GraphStyleConfig } from './types';

export interface Styles {
  width: number;
  height: number;
  deviceScale: number;
  nodeColor: string;
  activeNodeColor: string;
  dimmedNodeColor: string;
  linkColor: string;
  activeLinkColor: string;
  dimmedLinkColor: string;
  titleColor: string;
  nodeTitlePadding: number;
  activeNodeTitlePadding: number;
  activeNodeRadiusPadding: number;
  minimumNodeSize: number;
  nodeScaleFactor: number;
  minZoom: number;
  maxZoom: number;
}

export function createStyles(
  styleConfig: Partial<GraphStyleConfig> | undefined,
  canvasWidth: number,
  canvasHeight: number,
): Styles {
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

const default_styles: GraphStyleConfig = {
  minZoom: 0.4,
  maxZoom: 16,
  nodeColor: '#01b0d3',
  activeNodeColor: '#ffffff',
  dimmedNodeColor: '#01414e',
  linkColor: '#01586a',
  activeLinkColor: '#ffffff',
  dimmedLinkColor: '#01414e',
  titleColor: 'green',
  nodeTitlePadding: 12,
  activeNodeTitlePadding: 14,
  activeNodeRadiusPadding: 1,
  nodeScaleFactor: 0.96,
  minimumNodeSize: 4,
};
