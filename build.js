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
    resolve: { extensions: [".js"] },
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
      new HtmlWebpackPlugin({title: "Kitten Locks", publicPath: '/', meta: {'apple-mobile-web-app-capable': 'yes'}}
        /*{
        scriptLoading: "defer",
        favicon: "./favicon.ico",
        inject: false,
        meta: { description: "A simple kitten push notification service." },
        templateContent: ({ htmlWebpackPlugin }) =>
          `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Purrer 😺💌</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="icon" href="favicon.ico" />
  <link rel="preload" href="/index.js" as="script" />
  <link rel="preload" href="/commons~index.js" as="script" />
  <link rel="preload" href="/notificationEditor.js" as="script" />
  <link
    rel="preload"
    href="/commons~notificationEditor~themeEditor.js"
    as="script"
  />
  <link rel="preload" href="/commons~notificationFeed.js" as="script" />
  <link
    rel="preload"
    href="/commons~notificationEditor~notificationFeed~themeEditor.js"
    as="script"
  />
  <link
    rel="preload"
    href="/commons~notificationEditor~notificationFeed.js"
    as="script"
  />
  <link
    rel="preload"
    href="https://fonts.googleapis.com/css?family=Roboto:300,400&display=swap"
    as="style"
  />
  <link rel="prefetch" href="/commons~themeEditor.js" as="script" />
</head>
<body>
  <div id="main"></div>
  <script defer="defer" src="/commons~index.js"></script>
  <script defer="defer" src="/index.js"></script>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Roboto:300,400&display=swap" />
</body>
</html>
`
      }*/)
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
    console.log("finished webpack");
  }
);
