import { GraphData } from '@mindgraph/types';
import { Artist } from '../src/index';

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

    const artist = new Artist({
      data,
      style: {
        nodeColor: '#01b0d3',
        linkColor: '#01586a',
        titleColor: '#ffffff',
      },
      simulationConfig: {
        randomizeStartingPoints: false,
      },
      canvas,
    });

    artist.addEventListener('nodeClick', (node) => {
      alert(node.id);
    });

    artist.draw();
  } catch (error) {
    alert(error);
  }
});
