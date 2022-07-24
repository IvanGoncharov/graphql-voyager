/* eslint-disable */
const path = require('node:path');

const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = function (_, { mode }) {
  return {
    performance: {
      hints: false,
    },
    resolve: {
      extensions: ['.ts', '.tsx', '.mjs', '.js', '.json', '.css', '.svg'],
    },
    entry: './demo/index.tsx',
    devServer: {
      contentBase: path.resolve(__dirname, 'demo'),
      watchContentBase: true,
      port: 9090,
      stats: 'errors-only',
    },
    output: {
      path: path.resolve(__dirname, 'demo-dist'),
      filename: '[name].js',
      sourceMapFilename: '[name].[id].map',
    },
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          use: {
            loader: 'ts-loader',
            options: { compilerOptions: { noEmit: false } },
          },
          exclude: [/\.(spec|e2e)\.ts$/],
        },
        {
          test: /\.render\.js$/,
          use: {
            loader: 'file-loader',
            options: {
              name: 'voyager.worker.js',
            },
          },
        },
        {
          test: /\.css$/,
          exclude: /variables\.css$/,
          use: ExtractTextPlugin.extract({
            fallback: 'style-loader',
            use: [
              {
                loader: 'css-loader',
                options: {
                  sourceMap: true,
                },
              },
              'postcss-loader',
            ],
          }),
        },
        {
          test: /variables\.css$/,
          loader: 'postcss-variables-loader?es5=1',
        },
        {
          test: /\.svg$/,
          use: [
            {
              loader: 'react-svg-loader',
              options: {
                jsx: false,
                svgo: {
                  plugins: [{ mergePaths: false }],
                },
              },
            },
          ],
        },
      ],
    },

    plugins: [
      new webpack.LoaderOptionsPlugin({
        worker: {
          output: {
            filename: '[name].worker.js',
          },
        },
      }),

      new HtmlWebpackPlugin({
        template: './demo/index.html',
      }),

      new ExtractTextPlugin({
        filename: '[name].[hash].css',
      }),

      new CopyWebpackPlugin([
        { from: '.nojekyll', context: './demo' },
        { from: '**/*.png', context: './demo' },
        { from: '**/*.ico', context: './demo' },
      ]),
    ],
  };
};
