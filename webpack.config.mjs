/* eslint-disable unicorn/filename-case */
/* eslint-env node */
import { URL, fileURLToPath } from 'node:url'; // eslint-disable-line import/no-unresolved
import webpack from 'webpack';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import CopyPlugin from 'copy-webpack-plugin'; // eslint-disable-line import/default
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
        test: /\.jsx?$/u,
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
        test: /\.png/u,
        type: 'asset/resource'
      }
    ]
  },
  plugins: [
    // eslint-disable-next-line camelcase
    new webpack.EnvironmentPlugin({ CI: '', COMMIT_REF: 'dev', npm_package_version: 'dev', REDURL: `${process.env.CI ? `https://${process.env.BRANCH === 'beta' ? 'beta' : 'www'}.kittenlocks.de` : 'http://localhost:8080'}/static/html/oauthcb` }),
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
            window.opener.postMessage({ authCode, state }, '${process.env.CI ? `https://${process.env.BRANCH === 'beta' ? 'beta' : 'www'}.kittenlocks.de` : 'http://localhost:8080'}' );
          </script>
        </body>
      </html>
  ` }),
    new CopyPlugin({ patterns: [{ from: 'manifest.webmanifest', to: '.', transform: c => (process.env.CI ? Buffer.from(c.toString().replaceAll('http://localhost:8080', `https://${process.env.BRANCH === 'beta' ? 'beta' : 'www'}.kittenlocks.de`)) : c) }] }),
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

export default config;