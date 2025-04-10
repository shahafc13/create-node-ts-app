import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';
import copy from 'rollup-plugin-copy';

export default {
  input: 'src/index.ts',
  output: {
    dir: 'dist',
    format: 'esm',
    sourcemap: true,
    preserveModules: false,
  },
  external: [
    // List external dependencies that shouldn't be bundled
    '@clack/prompts',
    'fs/promises',
    'path',
    'url',
  ],
  plugins: [
    resolve({
      preferBuiltins: true,
    }),
    commonjs(),
    typescript({
      tsconfig: './tsconfig.json',
      sourceMap: true,
    }),
    copy({
      targets: [{ src: 'src/templates/**/*', dest: 'dist' }],
      flatten: false,
    }),
  ],
};
