import { GraphData } from '@notree/common';
import { Graph } from '../src/graph';

document.addEventListener('DOMContentLoaded', async () => {
  const canvas = document.getElementById('app') as HTMLCanvasElement;

  if (!canvas) {
    alert('no canvas found in html body');
    return;
  }

  try {
    const data: GraphData = await fetch('/api/notes').then((response) =>
      response.json(),
    );
    const mg: Graph = new Graph({
      data,
      canvas,
      styles: {
        titleColor: '#ffffff',
      },
    });
    mg.onClick((node) => alert(node.id));
    mg.draw();
  } catch (error) {
    alert(error);
  }
});
