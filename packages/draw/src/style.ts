import { GraphStyleConfig } from './types';

export function getStyles(styleConfig: Partial<GraphStyleConfig> | undefined) {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const deviceScale = window.devicePixelRatio;

  return {
    ...default_styles,
    ...styleConfig,
    width,
    height,
    deviceScale,
  };
}

export function generateUniqueColors(colorCount: number) {
  // https://stackoverflow.com/questions/15804149/rgb-color-permutation/15804183#15804183
  return [...Array(colorCount).keys()].map((i) =>
    convertRgbArrayToStyle([
      (i + 1) & 0xff,
      ((i + 1) & 0xff00) >> 8,
      ((i + 1) & 0xff0000) >> 16,
    ]),
  );
}

export function convertRgbArrayToStyle(rgbArray: number[]) {
  return `rgb(${rgbArray.slice(0, 3).join(',')})`;
}

const default_styles = {
  nodeColor: 'red',
  linkColor: 'blue',
  titleColor: 'green',
  nodeTitlePadding: 12,
};
