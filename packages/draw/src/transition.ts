import { Drawable } from './canvas';
import { Animation, AnimationConfig } from './animation';
import { Layer } from './artist';
import { Focus } from './types';

class LayerTransition {
  public name: string;
  public drawables: Drawable[];
  public focus: Focus;
  public animation?: Animation<number>;

  public constructor({
    name,
    drawables,
    focus,
    animation,
    toLayer,
    event,
  }: {
    name: string;
    drawables: Drawable[];
    focus: Focus;
    event: Animation<number>;
    toLayer: Layer;
    animation?: Animation<number>;
  }) {
    this.name = name;
    this.drawables = drawables;
    this.focus = focus;
    this.event = event;
    this.animation = animation;
    this.toLayer = toLayer;
  }

  public isFinished(): boolean {
    this.event.getValue();
    return this.event.state.current === this.event.state.desired;
  }

  public transition() {
    for (const d of this.drawables) {
      if (!this.toLayer.drawables.includes(d)) {
        this.toLayer.drawables.push(d);
      }
    }
    this.toLayer.drawables.sort((a, b) => {
      if (a.zIndex && b.zIndex) {
        return a.zIndex - b.zIndex;
      }
      return 1;
    });
  }

  private toLayer: Layer;
  private event: Animation<number>;
}

export class TransitionManager {
  constructor() {
    this.layer_transitions = [];
  }

  public updateTransitions() {
    for (const layerTransition of this.layer_transitions) {
      if (layerTransition.isFinished()) {
        layerTransition.transition();
        this.layer_transitions.splice(
          this.layer_transitions.indexOf(layerTransition),
          1,
        );
      }
    }
  }

  public removeTransition(transition: LayerTransition) {
    this.layer_transitions.splice(
      this.layer_transitions.indexOf(transition),
      1,
    );
  }

  public transitionToLayerWithAnimation({
    drawable,
    sourceLayer,
    targetLayer,
    transitionName,
    focus,
    transitionDuration,
    animationLayer,
    animationConfig,
  }: {
    drawable: Drawable;
    sourceLayer: Layer;
    targetLayer: Layer;
    transitionName: string;
    focus: Focus;
    transitionDuration: number;
    animationLayer: Layer;
    animationConfig: AnimationConfig<number>;
  }) {
    const activeTransitionWithDrawable = this.getTransition(drawable);
    if (!targetLayer.drawables.includes(drawable)) {
      if (this.remove_from_layer_if_exists(sourceLayer, drawable)) {
        animationLayer.animation = new Animation(animationConfig);
        if (activeTransitionWithDrawable) {
          // If the current drawable is already part of a transition, this is most likely
          //   a re-trigger of a previous transition and we need to start it over
          this.removeTransition(activeTransitionWithDrawable);
        }
        this.create_or_add_to_transition({
          name: transitionName,
          drawable: drawable,
          focus: focus,
          toLayer: targetLayer,
          duration: transitionDuration,
        });
      } else {
        targetLayer.drawables.push(drawable);
      }
    }
  }

  public getTransitions() {
    return this.layer_transitions;
  }

  public getTransition(drawable: Drawable) {
    let transitionContainingDrawable: LayerTransition | undefined = undefined;
    for (const transition of this.layer_transitions) {
      if (transition.drawables.includes(drawable)) {
        transitionContainingDrawable = transition;
      }
    }
    return transitionContainingDrawable;
  }

  private layer_transitions: LayerTransition[];

  private create_or_add_to_transition({
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
    for (const transition of this.layer_transitions) {
      if (transition.name === name) {
        if (!transition.drawables.includes(drawable)) {
          transition.drawables.push(drawable);
        }
        foundTransition = true;
      }
    }
    if (!foundTransition) {
      this.layer_transitions.push(
        new LayerTransition({
          name,
          toLayer,
          drawables: [drawable],
          focus,
          event: new Animation({
            from: 0,
            to: 1,
            duration: duration,
            easing: 'linear',
          }),
        }),
      );
    }
  }

  private remove_from_layer_if_exists(layer: Layer, d: Drawable): boolean {
    if (layer.drawables.includes(d)) {
      layer.drawables.splice(layer.drawables.indexOf(d), 1);
      return true;
    }
    return false;
  }
}