var path = require('path')
var LowerCaseNamePlugin = require('webpack-lowercase-name')
const MomentLocalesPlugin = require('moment-locales-webpack-plugin');

module.exports = {
  node: {
    crypto: true,
    http: true,
    https: true,
    os: true,
    vm: true,
    stream: true,
    fs: 'empty',
    child_process: 'empty'
  },
  target: 'web',
  entry: {
    'History': './src/metricq-history.js',
    'Live': './src/metricq-live.js'
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
  plugins: [
    new LowerCaseNamePlugin(),
    new MomentLocalesPlugin({
            localesToKeep: ['de'],
        })
  ]
}
