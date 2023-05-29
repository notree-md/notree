import { draw } from '../src/index';

document.addEventListener('DOMContentLoaded', async () => {
  const body = document.getElementById('app') as HTMLCanvasElement;

  if (!body) {
    alert('no canvas found in html body');
    return;
  }

  try {
    const data = await fetch('/api/notes').then((response) => response.json());
    const { focus } = draw({
      data,
      canvasElement: body,
      style: {
        nodeColor: '#01b0d3',
        linkColor: '#01586a',
        titleColor: '#ffffff',
      },
      onNodeClick: (node) => {
        alert(node.id);
      },
    });

    setTimeout(() => {
      console.log(data.nodes[0].id);
      focus(data.nodes[0].id);
    }, 3000);
  } catch (error) {
    alert(error);
  }
});
