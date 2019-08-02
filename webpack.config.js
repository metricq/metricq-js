var path = require('path')
var LowerCaseNamePlugin = require('webpack-lowercase-name')

module.exports = {
  entry: {
    'REST': './src/metricq-rest.js',
    'Websocket': './src/metricq-ws.js'
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'metricq.[lc-name].js',
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
    new LowerCaseNamePlugin()
  ]
}
