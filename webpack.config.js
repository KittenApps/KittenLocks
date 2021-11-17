const path = require("path");
const env = process.env.NODE_ENV = process.env.NODE_ENV || "development";
const webpack = require("webpack");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const CopyPlugin = require("copy-webpack-plugin");

module.exports = {
  mode: env,
  context: path.join(__dirname, "./"),
  entry: { index: "./app/index.js" },
  output: {
    path: path.join(__dirname, "public"),
    filename: "static/js/[name].js",
    chunkFilename: "static/js/[name].js"
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
    new HtmlWebpackPlugin({title: "Kitten Locks", publicPath: "/", favicon: "favicon.png"}),
    new HtmlWebpackPlugin({ filename: 'static/html/oauthcb/index.html', publicPath: "/static/html/oauthcb", templateContent: ({htmlWebpackPlugin}) => `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Kitten Locks OAuth Callback</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
        </head>
        <body>
          <h3>Sucessfully loged in with Chaster!</h3>
          <h5>This window should close immediately.</h5>
          <script>
            const searchParams = new URLSearchParams(window.location.search);
            const authCode = searchParams.get('code');
            const state = searchParams.get('state');
            window.opener.postMessage({ authCode, state }, '${env === 'production' ? 'https://kittenlocks.netlify.app' : 'http://localhost:8080'}' );
          </script>
        </body>
      </html>
  `}),
    new CopyPlugin({patterns: [{ from: "appicon.png", to: "." }]})
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
  },
  devServer: {
    historyApiFallback: true,
  }
};