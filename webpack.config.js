const path = require('path')

const { CleanWebpackPlugin } = require('clean-webpack-plugin')
const CompressionPlugin = require('compression-webpack-plugin')
const HardSourcePlugin = require('hard-source-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const webpack = require('webpack')

// Locally used variables
const inProduction = process.env.NODE_ENV === 'production'
const publicDir = path.resolve(__dirname, 'dist')

// Add hash if in production
const withHash = name => (inProduction ? name.replace(/^.+\.(\[[a-z]+\]|[a-z]+)$/, '[contenthash:16].$1') : name)

// Disable imagemin in dev
const imageConfig = {}
if (!inProduction) {
  imageConfig.plugins = []
}

// Compression config
const compressionConfig = {
  test: inProduction ? /\.(js|css|svg|html)$/ : /^-$/, // Match nothing in testing
  threshold: 512,
  minRatio: 0.9
}

// SVGO config (compat with mPDF)
const imageMinPlugins = !inProduction ? [] : [
  require('imagemin-mozjpeg')({}),
  require('imagemin-optipng')({}),
  require('imagemin-svgo')({})
]

module.exports = {
  // Set mode and source maps
  mode: inProduction ? 'production' : 'development',

  // Development config
  devtool: inProduction ? false : 'source-map',

  // Configure devserver as a transparent proxy
  devServer: {
    contentBase: publicDir,
    compress: true,
    port: 9000
  },

  // Context and entry file
  entry: ['./src/app.js', './src/css/app.css'],
  output: {
    path: publicDir,
    filename: withHash('bundle.js')
  },

  // Various optimizations
  optimization: {
    // Enable tree shaking
    usedExports: true,

    // Use hashes as IDs
    moduleIds: 'hashed'
  },

  // Loaders
  module: {
    rules: [
      // Linting
      {
        enforce: 'pre',
        test: /\.js$/,
        exclude: /node_modules/,
        loader: 'eslint-loader'
      },
      // Stylesheets
      {
        test: /\.css$/,
        use: [
          { loader: MiniCssExtractPlugin.loader, options: { hmr: !inProduction } },
          { loader: 'css-loader', options: { modules: false, importLoaders: 1 } },
          { loader: 'postcss-loader' }
        ]
      },
      // Javascript + Babel
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: 'babel-loader'
      },
      // HTML
      {
        test: /\.html$/,
        use: [
          {
            loader: 'html-loader',
            options: {
              interpolate: true
            }
          }
        ]
      },
      // Images
      {
        test: /\.(png|svg|jpg)$/,
        use: [
          {
            loader: 'file-loader',
            options: {
              esModule: false,
              name: withHash('[name].[ext]'),
              outputPath: 'images'
            }
          },
          {
            loader: 'img-loader',
            options: {
              plugins: imageMinPlugins
            }
          }
        ]
      }
    ]
  },
  plugins: [
    // Hardsource cache
    new HardSourcePlugin(),

    // CSS extractor
    new MiniCssExtractPlugin({
      filename: withHash('[name].css'),
      chunkFilename: withHash('[id].css')
    }),

    // Output cleaning
    new CleanWebpackPlugin({
      cleanOnceBeforeBuildPatterns: [
        // Remove compressed files
        './*.{br,gz}',

        // remove old Javascript and CSS code
        './*.{css,js}',

        // Remove statics
        './*.html',
        './*.{svg,png|jpg}'
      ]
    }),

    // Inline bundle files in HTML
    new HtmlWebpackPlugin({
      template: './src/html/app.html',
      inject: 'head',
    }),

    // Brotli compression
    new CompressionPlugin({
      ...compressionConfig,
      filename: '[path].br[query]',
      algorithm: 'brotliCompress',
      compressionOptions: { level: 11 }
    }),

    // GZip compression
    new CompressionPlugin({
      ...compressionConfig,
      filename: '[path].gz[query]'
    }),

    // Add partial env
    new webpack.DefinePlugin({
      'process.env': {
        production: inProduction
      }
    })
  ],

  // Aliasses
  resolve: {
    alias: {
      images: path.join(__dirname, 'lib/images')
    }
  }
}
