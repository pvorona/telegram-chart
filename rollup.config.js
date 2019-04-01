import css from 'rollup-plugin-css-porter'
import resolve from 'rollup-plugin-node-resolve'
import filesize from 'rollup-plugin-filesize'

module.exports = {
  input: 'app.js',
  output: {
    file: './dist/bundle.js',
    format: 'iife'
  },
  plugins: [
    css({ minified: true }),
    resolve(),
    filesize(),
  ],
}
