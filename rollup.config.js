import { nodeResolve } from '@rollup/plugin-node-resolve'
import css from 'rollup-plugin-css-porter'
import typescript from 'rollup-plugin-typescript2'

module.exports = {
  input: 'app.ts',
  output: {
    file: './dist/bundle.js',
    format: 'iife'
  },
  plugins: [
    css({ minified: false }),
    nodeResolve(),
    typescript(),
  ],
}
