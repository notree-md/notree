import { Easing, Animation } from '../src/animation';
import { Artist } from '../src/artist';
import { Drawable, Canvas } from '../src/canvas';

document.addEventListener('DOMContentLoaded', async () => {
  const canvas = document.getElementById('app') as HTMLCanvasElement;

  if (!canvas) {
    alert('no canvas found in html body');
    return;
  }

  const artist = new Artist({
    canvas,
  });
  class RenderableCircle implements Drawable {
    private x;
    private y;
    private animation;

    constructor(y: number, easing: Easing) {
      this.x = 100;
      this.y = y;
      this.animation = new Animation({
        from: 100,
        to: 1000,
        easing: easing,
        duration: 5,
      });
    }

    draw(canvas: Canvas): void {
      this.x = this.animation.getValue();
      canvas.drawCircle(
        {
          radius: 20,
          x: this.x,
          y: this.y,
        },
        'red',
      );
    }
    isActive(): boolean {
      return false;
    }
  }
  const drawables = [
    new RenderableCircle(100, 'linear'),
    new RenderableCircle(200, 'easein'),
    new RenderableCircle(300, 'flip'),
    new RenderableCircle(400, 'easeout'),
  ];

  artist.draw(drawables);
  setInterval(() => {
    artist.draw(drawables);
  }, 1000 / 60);
});
