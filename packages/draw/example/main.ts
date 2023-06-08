import { GraphData } from '@mindgraph/types';
import { Artist } from '../src/index';
import { Simulation } from '../src/simulation';

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
      style: {
        nodeColor: '#01b0d3',
        linkColor: '#01586a',
        titleColor: '#ffffff',
      },
      canvas,
    });

    const simulation = new Simulation({
      data,
      simulationConfig: {
        randomizeStartingPoints: false
      },
      width: artist.canvasInitialWidth,
      height: artist.canvasInitialHeight
    })

    simulation.start([(nodes, links) => {
      artist.draw(nodes, links)
    }])

    artist.addEventListener('nodeClick', (node) => {
      alert(node.id);
    });
  } catch (error) {
    alert(error);
  }
});
