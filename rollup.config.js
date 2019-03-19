import css from 'rollup-plugin-css-porter'
import resolve from 'rollup-plugin-node-resolve'

module.exports = {
  input: 'app.js',
  output: {
    file: './dist/bundle.js',
    format: 'iife'
  },
  plugins: [
    css({ minified: true }),
    resolve(),
  ],
}
