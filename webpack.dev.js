const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');

module.exports = merge(common, {
    mode: 'development',
    /* We want to, but can't use eval-source-map because it doesn't
     * support CSS source maps. See
     * https://webpack.js.org/plugins/css-minimizer-webpack-plugin/ */
    devtool: 'source-map'
});
