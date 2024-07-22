const path = require("path");
const TsconfigPathsPlugin = require("tsconfig-paths-webpack-plugin");
const webpack = require("webpack");

module.exports = {
  entry: "./src/index.ts",
  mode: "production",
  optimization: {
    usedExports: true,
  },
  devtool: "source-map",
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: "ts-loader",
        exclude: /node_modules|dist|docs|example|test/,
      },
    ],
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js"],
    extensionAlias: {
      ".js": [".js", ".ts"],
      ".cjs": [".cjs", ".cts"],
      ".mjs": [".mjs", ".mts"],
    },
    plugins: [
      new TsconfigPathsPlugin({ configFile: "./tsconfig.webpack.json" }),
    ],
  },
  plugins: [new webpack.DefinePlugin({ process: { env: {} } })],
  output: {
    filename: "webcface.bundle.js",
    path: path.resolve(__dirname, "dist"),
    globalObject: "this",
    library: {
      name: "webcface",
      type: "umd",
    },
  },
};
