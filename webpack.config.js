var webpack = require('webpack');
var libraryName = 'immutable-linked-ordered-map';
var outputFile = libraryName + '.js';
var srcEntryPoint = 'ImmutableLinkedOrderedMap.js'

var TerserPlugin = require('terser-webpack-plugin')
var env = process.env.WEBPACK_ENV;

if (env === 'build') {
    outputFile = libraryName + '.min.js';
}
else {
    outputFile = libraryName + '.js';
}

var config = {
    entry: __dirname + '/src/' + srcEntryPoint,
    devtool: 'source-map',
    output: {
        path: __dirname + '/dist',
        filename: outputFile,
        library: libraryName,
        libraryTarget: 'umd',
        umdNamedDefine: true
    },
    module: {
        rules: [
            {
                test: /(\\.jsx|\\.js)$/,
                loader: 'babel',
                exclude: /(node_modules|bower_components)/
            },
            {
                test: /(\\.jsx|\\.js)$/,
                loader: "eslint-loader",
                exclude: /node_modules/
            }
        ]
    },
    resolve: {
        extensions: ['.js']
    }
};

if (env === 'build') {
    config.optimization = {
        minimize: true,
        minimizer: [
            new TerserPlugin({
                parallel: true,
                terserOptions: {
                    output: {
                        comments: false,
                    }
                }
            })
        ]
    };
    config.mode = 'production';
    config.devtool = false;
}
else {
    config.mode = 'development';
}

module.exports = config;