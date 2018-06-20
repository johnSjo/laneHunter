/* eslint-env node */

module.exports = {
    context: `${__dirname}/src`,
    entry: {
        index: './index.js'
    },
    output: {
        filename: '[name].js',
        path: `${__dirname}/dist`,
        publicPath: '/'
    },
    devServer: {
        contentBase: `${__dirname}/src`,
        host: '0.0.0.0',
        port: 9001
    },
    mode: 'development',
    devtool: 'source-map'
};
