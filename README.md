# mindgraph

A web based graph view for markdown notes - based on [obsidian](https://obsidian.md/)'s graph view.

**In active development and will likely have breaking changes before v1.0**

## Example

https://jtabb.dev/notes

## Installation

```sh
pnpm add @mindgraph/read @mindgraph/draw
npm install @mindgraph/read @mindgraph/draw
yarn add @mindgraph/read @mindgraph/draw
```

## Usage

```tsx
// On the server
import { readFromFileSystem } from '@mindgraph/read';

app.get('/api/v1/notes', async (res) => {
  const notes = await readFromFileSystem('path/to/obsidian/directory');
});

// On the client
import { MindGraph } from '@mindgraph/draw';

const notes = await fetch('/api/v1/notes').then((res) => res.json());
const canvas = document.getElementById('your-canvas');

const mindGraph = new MindGraph({ data: notes, canvas });
mindGraph.draw(canvas);
```

## Contributing

Issues and PRs are more than welcome. Please clone the repo and setup your environment with `pnpm i`

If you want your change to be released, run `pnpm changeset` before opening your PR

See each packages README for more details
