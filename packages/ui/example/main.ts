import { GraphDataPayload } from '@notree/common';
import { GraphData } from '../src/data';

document.addEventListener('DOMContentLoaded', async () => {
  const canvas = document.getElementById('app') as HTMLCanvasElement;

  if (!canvas) {
    alert('no canvas found in html body');
    return;
  }

  try {
    const data: GraphDataPayload = await fetch('/api/notes').then((response) =>
      response.json(),
    );
    console.log({ data });
    const example = new GraphData(data);
    console.log({ example });
    // const mg: Graph = new Graph({
    //   data,
    //   canvas,
    //   styles: {
    //     titleColor: '#ffffff',
    //   },
    // });
    // mg.onClick((node) => alert(node.id));
    // mg.draw();
  } catch (error) {
    alert(error);
  }
});
