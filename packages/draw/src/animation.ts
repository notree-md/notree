type HexColor = string;
type AnimateableProperty = number | HexColor;
type AnimationState<T extends AnimateableProperty> = {
  initial: T;
  current: T;
  desired: T;
};

export type Easing = 'linear' | 'easein' | 'flip' | 'easeout';

// from: https://stackoverflow.com/questions/5623838/rgb-to-hex-and-hex-to-rgb
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 0, g: 0, b: 0 };
}

function componentToHex(c: number) {
  const hex = Math.trunc(c).toString(16);
  return hex.length == 1 ? '0' + hex : hex;
}

function rgbToHex(r: number, g: number, b: number) {
  return '#' + componentToHex(r) + componentToHex(g) + componentToHex(b);
}

function linear(per: number) {
  return per;
}

function easeIn(per: number) {
  return per * per;
}

function flip(per: number) {
  return 1 - per;
}

function easeOut(per: number) {
  return flip(flip(per) ** 2);
}

export type AnimationConfig<T> = {
  from: T;
  to: T;
  easing: Easing;
  duration: number;
  propertyName: string;
};

export class AnimationManager {
  public static attachAnimation<T>(
    obj: T,
    animation: Animation<number | string>,
  ) {
    if (!this.animations.has(obj)) {
      this.animations.set(obj, []);
    }
    this.animations.get(obj)?.push(animation);
  }

  public static clearAnimations<T>(obj: T): void {
    this.animations.set(obj, []);
  }

  public static initializeAnimations<T>(
    animationConfig: Map<T, AnimationConfig<AnimateableProperty>[]>,
  ) {
    for (const [obj, animations] of animationConfig.entries()) {
      AnimationManager.clearAnimations(obj);
      for (const animation of animations) {
        AnimationManager.attachAnimation(obj, new Animation(animation));
      }
    }
  }

  public static getAnimationValueByPropertyName<
    ObjType,
    T extends AnimateableProperty,
  >(obj: ObjType, propertyName: string): AnimateableProperty | undefined {
    const layerAnimations = this.getAnimations(obj);
    for (const animation of layerAnimations) {
      if (animation.propertyName === propertyName) {
        return animation.getValue() as T;
      }
    }

    return undefined;
  }

  public static getAnimations<T>(obj: T): Animation<number | string>[] {
    const animations = this.animations.get(obj);
    if (animations) {
      for (const animation of animations) {
        if (animation.state.current === animation.state.desired) {
          animations.splice(animations.indexOf(animation), 1);
          this.animations.set(obj, animations);
        }
      }
      return animations;
    }
    return [];
  }

  private static animations: Map<unknown, Animation<number | string>[]> =
    new Map();
}

export class Animation<T extends AnimateableProperty> {
  public constructor({
    from,
    to,
    easing,
    duration,
    propertyName,
  }: AnimationConfig<T>) {
    this.state = {
      initial: from,
      current: from,
      desired: to,
    };
    this.easing = easing;
    this.duration = duration;
    this.startTime = new Date().getTime();
    this.propertyName = propertyName;
  }

  public getValue(): T {
    const currTime = new Date().getTime();
    const elapsedTime = currTime / 1000 - this.startTime / 1000;

    let easingFunc: (x: number) => number;
    switch (this.easing) {
      case 'linear':
        easingFunc = linear;
        break;
      case 'easein':
        easingFunc = easeIn;
        break;
      case 'flip':
        easingFunc = flip;
        break;
      case 'easeout':
        easingFunc = easeOut;
        break;
      default:
        // eslint-disable-next-line no-case-declarations
        const exhaustiveCase: never = this.easing;
        throw new Error(
          `Not all easing functions are handled ${exhaustiveCase}`,
        );
    }

    const animationPercentage = easingFunc(
      Math.min(1, elapsedTime / this.duration),
    );
    let result;
    if (typeof this.state.initial == 'number') {
      result = this.numericLerp(
        this.state.initial,
        this.state.desired as number,
        animationPercentage,
      ) as T;
    } else if (typeof this.state.initial == 'string') {
      const initRgb = hexToRgb(this.state.initial);
      const desiredRgb = hexToRgb(this.state.desired as string);
      const currentRgb = {
        r: this.numericLerp(initRgb.r, desiredRgb.r, animationPercentage),
        g: this.numericLerp(initRgb.g, desiredRgb.g, animationPercentage),
        b: this.numericLerp(initRgb.b, desiredRgb.b, animationPercentage),
      };
      result = rgbToHex(currentRgb.r, currentRgb.g, currentRgb.b) as T;
    } else {
      result = 0 as T;
    }
    this.state.current = result;
    return result;
  }
  public state: AnimationState<T>;
  public propertyName: string;

  private numericLerp(start: number, finish: number, percentage: number) {
    return start + (finish - start) * percentage;
  }
  private duration: number;
  private easing: Easing;
  private startTime: number;
}
