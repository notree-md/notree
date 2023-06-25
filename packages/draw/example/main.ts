import { GraphData } from '@mindgraph/types';
import { MindGraph } from '../src/mindgraph';

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
    const mg: MindGraph = new MindGraph({
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
