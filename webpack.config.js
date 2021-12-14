/* eslint-disable unicorn/filename-case */
/* eslint-env node */
const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');
const SentryWebpackPlugin = require('@sentry/webpack-plugin');

module.exports = {
  mode: process.env.NODE_ENV || 'development',
  context: path.join(__dirname, './'),
  entry: { index: './app/index.js' },
  output: {
    path: path.join(__dirname, 'public'),
    filename: 'static/js/[name].js',
    chunkFilename: 'static/js/[name].js',
    clean: true
  },
  resolve: { extensions: ['.js'], fallback: { 'crypto': false } },
  module: {
    rules: [
      {
        test: /\.jsx?$/u,
        exclude: /node_modules/u,
        include: path.join(__dirname, 'app'),
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env', ['@babel/preset-react', { 'runtime': 'automatic' }]],
            plugins: ['import-graphql', ['direct-import', { modules: ['@mui/material', '@mui/icons-material', '@mui/lab', '@mui/system'] }]]
          }
        }
      }
    ]
  },
  plugins: [
    // eslint-disable-next-line camelcase
    new webpack.EnvironmentPlugin({ CI: '', COMMIT_REF: 'dev', npm_package_version: 'dev' }),
    new HtmlWebpackPlugin({ title: 'Kitten Locks', publicPath: '/', favicon: 'favicon.png' }),
    new HtmlWebpackPlugin({ filename: 'static/html/oauthcb/index.html', publicPath: '/static/html/oauthcb', templateContent: () => `
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
            window.opener.postMessage({ authCode, state }, '${process.env.CI ? 'https://www.kittenlocks.de' : 'http://localhost:8080'}' );
          </script>
        </body>
      </html>
  ` }),
    new CopyPlugin({ patterns: [
      { from: 'appicon.png', to: '.' },
      { from: 'manifest.webmanifest', to: '.', transform: c => (process.env.CI ? c : Buffer.from(c.toString().replaceAll('https://www.kittenlocks.de', 'http://localhost:8080'))) }
    ] }),
    ...(process.env.NETLIFY && [
      new SentryWebpackPlugin({
        authToken: process.env.SENTRY_AUTH_TOKEN, org: 'stella-xy', project: 'kittenlocks',
        release: `kittenlocks@${process.env.npm_package_version}+${process.env.COMMIT_REF}`,
        include: './public',
        setCommits: { repo: 'KittenApps/KittenLocks', commit: process.env.COMMIT_REF, previousCommit: process.env.CACHED_COMMIT_REF }
      })
    ] || [])
  ],
  optimization: {
    splitChunks: {
      chunks: 'all'
    }
  },
  devServer: { historyApiFallback: true },
  devtool: process.env.NODE_ENV === 'development' ? 'eval-source-map' : 'source-map'
};