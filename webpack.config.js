var path = require('path');
var webpack = require('webpack');
var {CleanWebpackPlugin} = require('clean-webpack-plugin');
var HtmlWebpackPlugin = require('html-webpack-plugin');
var MiniCssExtractPlugin = require('mini-css-extract-plugin');
var OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin');
var TerserWebpackPlugin = require('terser-webpack-plugin');

module.exports = (env, argv) => {
    let isProduction = (argv.mode === 'production');

    let config = {
        entry: [
            './app/index.ts',
            './assets/app.scss',
            './assets/table.scss'
        ],
        output: {
            filename: 'bundle.js',
            path: path.resolve(__dirname, 'dist')
        },
        devtool: 'source-map',
        resolve: {
            extensions: ['.ts', '.tsx', '.js'],
            alias: {
                'netherlink': path.resolve(__dirname, 'lib')
            }
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
            new CleanWebpackPlugin(),
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
            }),
            new webpack.ProvidePlugin({
                $: 'jquery',
                jQuery: 'jquery'
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
                        "postcss-loader",
                        "sass-loader"
                    ],
                },
                {
                    test: /\.(eot|svg|ttf|woff)$/i,
                    use: [
                        {
                            loader: 'file-loader',
                            options: {
                                limit: 10000,
                                name: "assets/[hash].[ext]"
                            }
                        }
                    ]
                },
                {
                    test: /\.html$/i,
                    use: [
                        {
                            loader: 'html-loader',
                            options: {
                                minimize: true,
                                esModule: true
                            }
                        }
                    ]
                },
                {
                    test: /\.proto$/i,
                    use: [
                        {
                            loader: 'protobuf-preloader'
                            /* The loader doesn't support pbts so we
                             * have to resort to the raw js
                             * mode. There's a PR but it hasn't been
                             * merged for years:
                             * https://github.com/kmontag/protobufjs-loader/pull/2
                             */,
                            options: {
                                pbjsArgs: ['--wrap', 'es6']
                            }
                        }
                    ]
                }
            ]
        }
    };

    return config;
};
