/* eslint-disable unicorn/filename-case */
/* eslint-env node */
import { URL, fileURLToPath } from 'node:url'; // eslint-disable-line import/no-unresolved
import webpack from 'webpack';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import CopyPlugin from 'copy-webpack-plugin'; // eslint-disable-line import/default
import { GenerateSW } from 'workbox-webpack-plugin';
import SentryWebpackPlugin from '@sentry/webpack-plugin';

const config = {
  mode: process.env.NODE_ENV || 'development',
  context: fileURLToPath(new URL('./', import.meta.url)),
  entry: { index: './app/index.js' },
  output: {
    path: fileURLToPath(new URL('./public', import.meta.url)),
    filename: 'static/js/[name].js',
    clean: true,
    assetModuleFilename: 'static/images/[name][ext]'
  },
  resolve: { extensions: ['.js'], fallback: { 'crypto': false } },
  module: {
    rules: [
      {
        test: /\.jsx?$/ui,
        exclude: /node_modules/u,
        include: fileURLToPath(new URL('./app', import.meta.url)),
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env', ['@babel/preset-react', { 'runtime': 'automatic' }]],
            plugins: ['import-graphql', ['direct-import', { modules: ['@mui/material', '@mui/icons-material', '@mui/lab', '@mui/system'] }]]
          }
        }
      },
      {
        test: /\.css$/ui,
        use: ['style-loader', 'css-loader']
      },
      {
        test: /\.png/ui,
        type: 'asset/resource'
      }
    ]
  },
  plugins: [
    // eslint-disable-next-line camelcase
    new webpack.EnvironmentPlugin({
      CI: '',
      COMMIT_REF: 'dev',
      NODE_ENV: 'development',
      BRANCH: 'beta',
      VERSION: `${process.env.npm_package_version}${process.env.BRANCH ? (process.env.BRANCH === 'beta' ? '-beta' : '') : '-dev'}`,
      SENTRY: process.env.BRANCH === 'beta' ? 'https://a7ed71bbcd69473f87d243c8a00d378e@o1079625.ingest.sentry.io/6117777' : 'https://97ce662232dc48e8967956f7bcae23f5@o1079625.ingest.sentry.io/6084627'
    }),
    new HtmlWebpackPlugin({ title: 'Kitten Locks', publicPath: '/' }),
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
            window.opener.postMessage({ authCode, state }, window.location.origin );
          </script>
        </body>
      </html>
  ` }),
    new CopyPlugin({ patterns: [
      { from: 'assets/manifest.webmanifest', to: '.', transform: c => (process.env.CI ? Buffer.from(c.toString().replaceAll('http://localhost:8080', `https://${process.env.BRANCH === 'beta' ? 'beta' : 'www'}.kittenlocks.de`)) : c) },
      { from: 'assets/push-worker.js', to: '.' }
    ] }),
    ...(process.env.NETLIFY ? [
      new SentryWebpackPlugin({
        authToken: process.env.SENTRY_AUTH_TOKEN, org: 'stella-xy', project: `${process.env.BRANCH === 'beta' ? 'beta-' : ''}kittenlocks`,
        release: `kittenlocks@${process.env.npm_package_version}${process.env.BRANCH === 'beta' ? '-beta' : ''}+${process.env.COMMIT_REF}`,
        include: './public',
        setCommits: { repo: 'KittenApps/KittenLocks', commit: process.env.COMMIT_REF, previousCommit: process.env.CACHED_COMMIT_REF }
      })
    ] : []),
    ...(process.env.NODE_ENV === 'production' && process.env.BRANCH !== 'beta' ? [new GenerateSW({ clientsClaim: true, skipWaiting: false, navigateFallback: 'index.html', exclude: ['push-worker.js'], importScripts: ['./push-worker.js'] })] : [])
  ],
  optimization: {
    splitChunks: {
      chunks: 'all'
    }
  },
  devServer: { historyApiFallback: true, port: 5000 },
  devtool: process.env.NODE_ENV === 'development' ? 'eval-source-map' : 'source-map'
};

export default config;