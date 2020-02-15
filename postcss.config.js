const autoprefixer = require('autoprefixer')
const cssnano = require('cssnano')
const postcssCalc = require('postcss-calc')
const postcssImport = require('postcss-import')
const purgecss = require('@fullhuman/postcss-purgecss')
const tailwindcss = require('tailwindcss')

const purgeConfig = {
  content: [
    'src/**/*.html'
  ],
  extractors: [
    {
      extractor: (content) => {
        return content.match(/[a-zA-Z0-9-:_/]+/g) || []
      },
      extensions: ['php', 'html', 'js', 'vue']
    }
  ]
}

module.exports = ({ file, options, env }) => ({
  parser: false,
  plugins: [
    postcssImport(),
    tailwindcss(),
    purgecss(purgeConfig),
    postcssCalc(),
    autoprefixer(),
    cssnano(options.cssnano || {})
  ]
})
