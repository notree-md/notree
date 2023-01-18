import { draw } from '../src/index';

document.addEventListener('DOMContentLoaded', async () => {
  const body = document.getElementById('app') as HTMLCanvasElement;

  if (!body) {
    alert('no canvas found in html body');
    return;
  }

  try {
    const data = await fetch('/api/notes').then((response) => response.json());
    draw(data, body);
  } catch (error) {
    alert(error);
  }
});
