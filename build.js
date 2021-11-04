const path = require("path");
const fs = require("fs");
const webpack = require("webpack");
const HtmlWebpackPlugin = require("html-webpack-plugin");

const env = process.env.NODE_ENV || "development";

console.log("starting webpack");
webpack(
  {
    mode: env,
    context: path.join(__dirname, "./"),
    entry: { index: "./app/index.js" },
    output: {
      path: path.join(__dirname, "public"),
      filename: "[name].js",
      chunkFilename: "[name].js"
    },
    stats: 'detailed',
    resolve: { extensions: [".js"], fallback: { "crypto": false } },
    module: {
      rules: [
        {
          test: /\.jsx?$/,
          exclude: /node_modules/,
          include: path.join(__dirname, "app"),
          use: {
            loader: "babel-loader",
            options: {
              presets: ["@babel/preset-env", ["@babel/preset-react", {"runtime": "automatic"}]]
            }
          }
        },
        {
          test: /\.scss$/i,
          use: ["style-loader", "css-loader", "sass-loader"],
        },
      ]
    },
    plugins: [
      new webpack.EnvironmentPlugin(["NODE_ENV"]),
      new HtmlWebpackPlugin({title: "Kitten Locks", publicPath: "/", favicon: "favicon.png"})
    ],
    optimization: {
      splitChunks: {
        cacheGroups: {
          commons: {
            chunks: "all",
            minChunks: 1
          }
        }
      }
    }
  },
  (err, stats) => {
    // Stats Object
    if (err || stats.hasErrors()) {
      console.log(stats.toString());
      if (err) console.log(err.stack || err);
      if (err && err.details) {
        console.error(err.details);
      }
      return;
    }
    console.log(stats.toString("normal"));
    fs.copyFileSync(env == "production" ? "oauthcb.html" : "oauthcb2.html", "public/oauthcb.html");
    fs.copyFileSync("appicon.png", "public/appicon.png");
    console.log("finished webpack");
  }
);
