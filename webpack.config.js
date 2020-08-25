var path = require('path');
var webpack = require('webpack');
var HtmlWebpackPlugin = require('html-webpack-plugin');
var MiniCssExtractPlugin = require('mini-css-extract-plugin');
var OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin');
var TerserWebpackPlugin = require('terser-webpack-plugin');

module.exports = (env, argv) => {
    let isProduction = (argv.mode === 'production');

    let config = {
        entry: [
            './app/index.ts',
            './assets/app.scss'
        ],
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
                new OptimizeCSSAssetsPlugin(),
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
            new HtmlWebpackPlugin({
                inject: 'body',
                minify: {
                    caseSensitive: true,
                    collapseWhitespace: true,
                    keepClosingSlash: true,
                    removeComments: true
                },
                template: 'assets/index.html',
                xhtml: true
            }),
            new webpack.LoaderOptionsPlugin({
               minimize: true
            }),
            new MiniCssExtractPlugin({
                filename: "style.css"
            })
        ],
        module: {
            rules: [
                { test: /\.tsx?$/, loader: 'ts-loader' },
                {
                    test: /\.(sa|sc|c)ss$/,
                    use: [
                        MiniCssExtractPlugin.loader,
                        "css-loader",
                        "sass-loader"
                    ],
                }
            ]
        }
    };

    return config;
};