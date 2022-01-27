var path = require('path')
var LowerCaseNamePlugin = require('webpack-lowercase-name')
const MomentLocalesPlugin = require('moment-locales-webpack-plugin')
const TerserPlugin = require('terser-webpack-plugin')

module.exports = {
  target: 'web',
  entry: {
    'History': './history/metricq-history.js',
    'Live': './live/metricq-live.js'
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'metricq-[lc-name]-[chunkhash].js',
    library: 'MetricQ[name]',
    libraryTarget: 'umd'
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env']
          }
        }
      }
    ]
  },
  optimization: {
    minimizer: [new TerserPlugin({
      extractComments: false,
    })],
  },
  plugins: [
    new LowerCaseNamePlugin(),
    new MomentLocalesPlugin({
            localesToKeep: ['de'],
        })
  ]
}
