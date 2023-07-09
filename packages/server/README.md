# Server

Open source backend ecosystem for notree

## Providers

### FileSystem

Reads a directory of markdown notes provided a path

```ts
const graph = await FileSystem.read({
  path: path.resolve(__dirname, 'your-directory'),
});
```

### GitHub

Reads a directory of markdown notes provided a GitHub repository.

Create a GitHub access token with read access to your repository. https://github.com/settings/tokens/new?scopes=repo

If you are developing locally, the test suite looks for your token in `.env` (at the root of the project) as `GITHUB_TOKEN`.

```ts
const graph = await GitHub.read({
  owner: 'you',
  repo: 'your-repository',
  basePath: 'optional/path/to/root',
  branch: 'defaults-to-main',
  token: process.env.GITHUB_TOKEN,
});
```
