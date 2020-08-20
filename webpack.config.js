var path = require('path');
var webpack = require('webpack');
var HtmlWebpackPlugin = require('html-webpack-plugin');
var TerserWebpackPlugin = require('terser-webpack-plugin');

module.exports = {
    mode: 'production',
    entry: './app/index.ts',
    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, 'dist')
    },
    devtool: 'source-map',
    resolve: {
        extensions: ['.ts', '.tsx', '.js']
    },
    optimization: {
        minimizer: [
            new TerserWebpackPlugin({
                sourceMap: true,
                terserOptions: {
                    compress: {
                        warnings: true
                    }
                }
            })
        ]
    },
    plugins: [
        new webpack.LoaderOptionsPlugin({
            minimize: true
        }),
    ],
    module: {
        rules: [
            { test: /\.tsx?$/, loader: 'ts-loader' },
        ]
    }
};
