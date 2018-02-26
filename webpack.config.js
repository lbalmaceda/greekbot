'use latest'

const webpack = require('webpack');
const path = require('path');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');

module.exports = {
    entry: path.resolve(__dirname, './src/server.js'),
    externals: [
      'express',
      'webtask-tools',
      'body-parser',
      'moment',
      'request',
      'underscore'
    ],
    target: 'node',
    output: {
      path: path.resolve(__dirname, 'build'),
      filename: 'bundle.js',
      libraryTarget: 'commonjs2',
    },
    node: {
      console: false,
      global: false,
      process: false,
      __filename: false,
      __dirname: false,
      Buffer: false,
      setImmediate: false
    },
    plugins: [
      new webpack.DefinePlugin({
        'process.env.NODE_ENV': '"production"',
      }),
      new UglifyJsPlugin({
        uglifyOptions: {
          compress: {
            sequences: true,
            dead_code: true,
            conditionals: true,
            booleans: true,
            unused: true,
            if_return: true,
            join_vars: true,
            warnings: false,
            drop_console: false,
          }
        }
      })
    ]
  }