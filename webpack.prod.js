const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin');
const TerserWebpackPlugin = require('terser-webpack-plugin');
const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');

module.exports = merge(common, {
    mode: 'production',
    devtool: 'source-map',
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
    }
});
