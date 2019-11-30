const webpack = require("webpack");
const libraryName = "immutable-linked-ordered-map";
let outputFile = libraryName + ".js";
const library = "ImmutableLinkedOrderedMap";
const srcEntryPoint = "ImmutableLinkedOrderedMap.js";
const path = require("path");

const TerserPlugin = require("terser-webpack-plugin");
const env = process.env.WEBPACK_ENV;

if (env === "build") {
  outputFile = libraryName + ".min.js";
} else {
  outputFile = libraryName + ".js";
}

var config = {
  entry: __dirname + "/src/" + srcEntryPoint,
  devtool: "source-map",
  output: {
    path: path.resolve(__dirname, "./dist"),
    filename: outputFile,
    library: library,
    libraryTarget: "umd",
    globalObject: "this",
    umdNamedDefine: true,
    libraryExport: "default"
  },
  module: {
    rules: [
      {
        test: /(\\.jsx|\\.js)$/,
        loader: "babel-loader",
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
    extensions: [".js"]
  }
};

if (env === "build") {
  config.optimization = {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        parallel: true,
        terserOptions: {
          output: {
            comments: false
          }
        }
      })
    ]
  };
  config.mode = "production";
  config.devtool = false;
} else {
  config.mode = "development";
}

module.exports = config;
