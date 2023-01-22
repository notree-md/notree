import { draw } from '../src/index';

document.addEventListener('DOMContentLoaded', async () => {
  const body = document.getElementById('app') as HTMLCanvasElement;

  if (!body) {
    alert('no canvas found in html body');
    return;
  }

  try {
    const data = await fetch('/api/notes').then((response) => response.json());
    draw({
      data,
      canvasElement: body,
      style: {
        nodeColor: '#01b0d3',
        linkColor: '#01586a',
        titleColor: '#ffffff',
      },
      onNodeClick: (node) => {
        console.log(node);
      },
    });
  } catch (error) {
    alert(error);
  }
});
