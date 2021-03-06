const path = require('path');
const webpack = require('webpack');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const WebpackPwaManifest = require('webpack-pwa-manifest');
const WorkboxPlugin = require('workbox-webpack-plugin');

module.exports = {
    entry: [
        './app/index.ts',
        './assets/app.scss',
        './assets/table.scss'
    ],
    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, 'dist')
    },
    resolve: {
        extensions: ['.ts', '.tsx', '.js'],
        alias: {
            'netherlink': path.resolve(__dirname, 'lib')
        }
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
            favicon: 'assets/favicon.png',
            template: 'assets/index.html',
            xhtml: true
        }),
        new MiniCssExtractPlugin({
            filename: "style.css"
        }),
        new webpack.ProvidePlugin({
            /* For Foundation */
            $: 'jquery',
            jQuery: 'jquery'
        }),
        new WebpackPwaManifest({
            name: 'Netherlink',
            description: 'Tool for planning nether portal setups in Minecraft',
            orientation: 'landscape',
            display: 'standalone',
            fingerprints: false,
            ios: true,
            icons: [
                {
                    src: path.resolve('./assets/netherlink-large.png'),
                    size: '512x512',
                    destination: 'assets'
                },
                {
                    src: path.resolve('./assets/netherlink-small.png'),
                    size: '256x256',
                    destination: 'assets'
                }
            ]
        }),
        new WorkboxPlugin.GenerateSW({
            cacheId: 'netherlink',
            cleanupOutdatedCaches: true,
            clientsClaim: true,
            skipWaiting: true
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
                            name: "assets/[name].[ext]"
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
                         *
                         * But the real problem is that pbts
                         * generates .d.ts rather than the real
                         * script, which means we still need .js
                         * too. Loaders can't handle this
                         * situation well.
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
