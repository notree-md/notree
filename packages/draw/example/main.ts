import { Artist } from '../src/index';

document.addEventListener('DOMContentLoaded', async () => {
  const body = document.getElementById('app') as HTMLCanvasElement;

  if (!body) {
    alert('no canvas found in html body');
    return;
  }

  try {
    const data = await fetch('/api/notes').then((response) => response.json());

    const artist = new Artist({
      data,
      style: {
        nodeColor: '#01b0d3',
        linkColor: '#01586a',
        titleColor: '#ffffff',
      },
    });

    artist.addEventListener({
      event: 'nodeClick',
      callback: (node) => {
        alert(node.id);
      },
    });

    artist.draw(body);
  } catch (error) {
    alert(error);
  }
});
