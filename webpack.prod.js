const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin');
const TerserWebpackPlugin = require('terser-webpack-plugin');
const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');

module.exports = merge(common, {
    mode: 'production',
    devtool: 'source-map',
    optimization: {
        usedExports: true, // See https://webpack.js.org/guides/tree-shaking/
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
