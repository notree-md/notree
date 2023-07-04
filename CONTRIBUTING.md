# Contributing

## Tooling

Not all of this is required to contribute, but for the best experience it's
recommended you check all of this out.

- [asdf](https://asdf-vm.com/)
- [pnpm](https://pnpm.io/)
- [typescript](https://www.typescriptlang.org/)
- [prettier](https://prettier.io/)
- [eslint](https://eslint.org/)
- [turborepo](https://turbo.build/)
- [cypress](https://www.cypress.io/)
- [changesets](https://github.com/changesets/changesets#readme)

## Getting started

```
git clone your-fork/mindgraph
pnpm i
pnpm dev
```

## Code style

Feel free to do whatever you want for the most part! We have a few conventions that should be followed:

```ts
// "public" (exported) functions should be camel case
export function doCoolStuff(): void;

// "private" functions should be snake case
function helper_function(): number;

// classes should read public (top) to private (bottom)
export class Cat {
  public color: string;
  constructor() {}
  public runAround(): void;
  private mood: number;
  private speak_spanish(): string;
}
```

## Committing changes

This project uses [conventional commit messages](https://www.conventionalcommits.org/en/v1.0.0/)

## Opening a pr

Make sure to run `pnpm changeset` before opening a pr and using the cli tool to
describe your changes.

GitHub will run your changes through a ci pipeline, but you can see if it will
pass locally by running `pnpm run ci`. **If you want tests to pass you will need a
GitHub token as described by the GitHub provider docs in the read package.**
