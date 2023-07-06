import { Drawable } from './canvas';
import { Animation } from './animation';
import { Layer } from './artist';
import { Focus } from './types';

class LayerTransition {
  public name: string;
  public drawables: Drawable[];
  public focus: Focus;
  public constructor({
    name,
    drawables,
    focus,
    animation,
    toLayer,
  }: {
    name: string;
    drawables: Drawable[];
    focus: Focus;
    animation: Animation<number>;
    toLayer: Layer;
  }) {
    this.name = name;
    this.drawables = drawables;
    this.focus = focus;
    this.animation = animation;
    this.toLayer = toLayer;
  }

  public isFinished(): boolean {
    this.animation.getValue();
    return this.animation.state.current === this.animation.state.desired;
  }

  public transition() {
    for (const d of this.drawables) {
      if (!this.toLayer.drawables.includes(d)) {
        this.toLayer.drawables.push(d);
      }
    }
  }

  private toLayer: Layer;
  private animation: Animation<number>;
}

export class TransitionManager {
  constructor() {
    this.layerTransitions = [];
  }

  public updateTransitions() {
    for (const layerTransition of this.layerTransitions) {
      if (layerTransition.isFinished()) {
        layerTransition.transition();
        this.layerTransitions.splice(
          this.layerTransitions.indexOf(layerTransition),
          1,
        );
      }
    }
  }

  public removeTransition(transition: LayerTransition) {
    this.layerTransitions.splice(this.layerTransitions.indexOf(transition), 1);
  }

  public add_to_layer_transition({
    name,
    drawable,
    focus,
    toLayer,
    duration,
  }: {
    name: string;
    drawable: Drawable;
    focus: Focus;
    toLayer: Layer;
    duration: number;
  }) {
    let foundTransition = false;
    for (const transition of this.layerTransitions) {
      if (transition.name === name) {
        if (!transition.drawables.includes(drawable)) {
          transition.drawables.push(drawable);
        }
        foundTransition = true;
      }
    }
    if (!foundTransition) {
      this.layerTransitions.push(
        new LayerTransition({
          name,
          toLayer,
          drawables: [drawable],
          focus,
          animation: new Animation({
            from: 0,
            to: 1,
            duration: duration,
            easing: 'linear',
          }),
        }),
      );
    }
  }

  public getTransitions() {
    return this.layerTransitions;
  }

  public getTransition(drawable: Drawable) {
    let transitionContainingDrawable: LayerTransition | undefined = undefined;
    for (const transition of this.layerTransitions) {
      if (transition.drawables.includes(drawable)) {
        transitionContainingDrawable = transition;
      }
    }
    return transitionContainingDrawable;
  }

  private layerTransitions: LayerTransition[];
}
