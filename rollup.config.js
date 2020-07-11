import css from 'rollup-plugin-css-porter'
import resolve from 'rollup-plugin-node-resolve'
import filesize from 'rollup-plugin-filesize'
import typescript from 'rollup-plugin-typescript2'
import json from '@rollup/plugin-json'

module.exports = {
  input: 'app.ts',
  output: {
    file: './dist/bundle.js',
    format: 'iife'
  },
  plugins: [
    json(),
    css({ minified: false }),
    resolve(),
    filesize({ showBrotliSize: true }),
    typescript(),
  ],
}
