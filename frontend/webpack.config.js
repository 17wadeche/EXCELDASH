/* eslint-disable no-undef */

const CopyWebpackPlugin = require("copy-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const webpack = require("webpack");
const path = require("path");

const urlDev = "https://localhost:3000/";
const urlProd = "https://happy-forest-059a9d710.4.azurestaticapps.net"; //

async function getHttpsOptions() {
  const devCerts = require("office-addin-dev-certs");
  const httpsOptions = await devCerts.getHttpsServerOptions();
  return { ca: httpsOptions.ca, key: httpsOptions.key, cert: httpsOptions.cert };
}

module.exports = async (env, options) => {
  const dev = options.mode === "development";
  const config = {
    devtool: "source-map",
    entry: {
      polyfill: ["core-js/stable", "regenerator-runtime/runtime"],
      vendor: [
        "react",
        "react-dom",
        "core-js",
        "@fluentui/react-components",
        "@fluentui/react-icons",
      ],
      taskpane: "./src/taskpane/index.tsx",
      commands: "./src/commands/commands.ts",
      screenshot: "./src/screenshot.tsx",
      fullScreenDashboard: "./src/fullScreenDashboard.tsx",
      index: "./src/taskpane/index.tsx",
    },
    output: {
      path: path.resolve(__dirname, "dist"),
      filename: "[name].bundle.js",
      clean: true,
    },
    resolve: {
      extensions: [".ts", ".tsx", ".js", ".jsx", ".html"],
      fullySpecified: false,
    },
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          exclude: /node_modules/,
          use: "ts-loader",
        },
        {
          test: /\.css$/i,
          use: ["style-loader", "css-loader"],
        },
        {
          test: /\.(scss|sass)$/i,
          use: [
            "style-loader",
            "css-loader",
            {
              loader: "sass-loader",
              options: {
                sassOptions: {
                  quietDeps: true,
                },
              },
            },
          ],
        },
        {
          test: /\.html$/,
          exclude: /node_modules/,
          use: "html-loader",
        },
        {
          test: /\.(png|jpg|jpeg|ttf|woff|woff2|gif|ico)$/,
          type: "asset/resource",
          generator: {
            filename: "assets/[name][ext][query]",
          },
        },
      ],
    },
    plugins: [
      new HtmlWebpackPlugin({
        filename: "taskpane.html",
        template: "./src/taskpane/taskpane.html",
        chunks: ["polyfill", "vendor", "taskpane"],
      }),
      new HtmlWebpackPlugin({
        filename: "commands.html",
        template: "./src/commands/commands.html",
        chunks: ["polyfill", "commands"],
      }),
      new HtmlWebpackPlugin({
        filename: "fullScreenDashboard.html",
        template: "./src/fullScreenDashboard.html",
        chunks: ["polyfill", "vendor", "fullScreenDashboard"],
      }),
      new HtmlWebpackPlugin({
        filename: "screenshot.html",
        template: "./src/screenshot.html",
        chunks: ["polyfill", "vendor", "screenshot"],
        inject: true, // Ensure scripts are injected automatically
      }),
      new HtmlWebpackPlugin({
        filename: "index.html",
        template: "./src/taskpane/index.html", // Create this template file
        chunks: ["polyfill", "vendor", "taskpane"], // Include necessary chunks
        inject: true,
      }),
      new CopyWebpackPlugin({
        patterns: [
          {
            from: "../assets/*",
            to: "assets",
          },
          {
            from: "../frontend/manifest*.xml",
            to: "[name][ext]",
            transform(content) {
              if (dev) {
                return content;
              } else {
                return content.toString().replace(new RegExp(urlDev, "g"), urlProd);
              }
            },
          },
        ],
      }),
      new webpack.ProvidePlugin({
        Promise: ["es6-promise", "Promise"],
      }),
    ],
    devServer: {
      hot: true,
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
      server: {
        type: "https",
        options:
          env.WEBPACK_BUILD || options.https !== undefined
            ? options.https
            : dev
            ? await getHttpsOptions()
            : undefined,
      },
      port: process.env.npm_package_config_dev_server_port || 3000,
    },
  };

  return config;
};