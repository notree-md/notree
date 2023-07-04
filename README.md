<div align="center">
    <h1 align="center">mindgraph</h1>
</div>

A graph view for markdown notes on the web - based on [obsidian](https://obsidian.md/)'s graph view.

**In active development and will likely have breaking changes before v1.0**

## Example

https://jtabb.dev/notes

## Installation

```sh
npm install @mindgraph/read @mindgraph/draw
```

## Usage

```tsx
// On the server
import { FileSystem } from '@mindgraph/read';

app.get('/api/v1/notes', async (res) => {
  const notes = await FileSystem.read({
    path: 'path/to/obsidian/directory',
  });

  res.send(notes);
});

// On the client
import { MindGraph } from '@mindgraph/draw';

const notes = await fetch('/api/v1/notes').then((res) => res.json());
const canvas = document.getElementById('your-canvas');

const mindGraph = new MindGraph({ data: notes, canvas });
mindGraph.draw();
```

## Contributing

See the [contributing guide](./CONTRIBUTING.md) to learn the development
workflow.
