import css from 'rollup-plugin-css-only'
import resolve from 'rollup-plugin-node-resolve'

module.exports = {
  input: 'app.js',
  output: {
    file: './dist/bundle.js',
    format: 'iife'
  },
  plugins: [
    css({ output: './dist/bundle.css' }),
    resolve(),
  ],
}
