import typescript from '@rollup/plugin-typescript';

export default {
  input: './src/index.ts',
  output: {
    dir: 'dist',
  },
  external: ['node:readline', 'fs', 'axios', 'octokit'],
  plugins: [typescript()],
};
