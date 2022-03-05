/* eslint-disable unicorn/filename-case, camelcase */
/* eslint-env node */
import { fileURLToPath } from 'node:url'; // eslint-disable-line import/no-unresolved
import webpack from 'webpack';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import FaviconsWebpackPlugin from '@silizia/favicons-webpack-plugin'; // eslint-disable-line import/default
import { GenerateSW } from 'workbox-webpack-plugin';
import SentryWebpackPlugin from '@sentry/webpack-plugin';

const config = {
  mode: process.env.NODE_ENV || 'development',
  context: fileURLToPath(new URL('.', import.meta.url)),
  entry: {
    index: './app/index.js',
    sw_push: './assets/push-worker.js'
  },
  output: {
    path: fileURLToPath(new URL('public', import.meta.url)),
    filename: 'static/js/[name].js',
    clean: true,
    assetModuleFilename(p){return /\.woff2?$/u.test(p.filename) ? 'static/fonts/[name][ext]' : 'static/images/[name][ext]';}
  },
  resolve: { extensions: ['.js'], fallback: { 'crypto': false } },
  module: {
    rules: [
      {
        test: /\.jsx?$/ui,
        exclude: /node_modules/u,
        include: fileURLToPath(new URL('app', import.meta.url)),
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
        test: /\.webp/ui,
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
    new FaviconsWebpackPlugin({ logo: './assets/appicon.png', prefix: 'static/images/', inject: i => i.userOptions.publicPath === '/', favicons: {
      appName: 'KittenLocks',
      appleStatusBarStyle: 'black',
      appDescription: 'KittenLocks is a pawtastic WebApp to enchance your Chaster experience, built with ❤ by Silizia ~ Stella.',
      background: '#272533',
      theme_color: '#272533',
      start_url: '/',
      scope: '/',
      manifestMaskable: './assets/maskable_icon.png',
      icons: {
        appleIcon: { background: '#272533' },
        appleStartup: { background: '#272533' }
      },
      shortcuts: [
        { name: 'My Lock Profile', url: '/lock', icon: './assets/shortcut1.png' },
        { name: 'My Wearers Locks', url: '/wearers', icon: './assets/shortcut2.png' },
        { name: 'Public Lock Profiles', url: '/locks', icon: './assets/shortcut3.png' },
        { name: 'Chastity Month Event', url: '/event', icon: './assets/shortcut4.png' },
        { name: 'Lock Transfer', url: '/trans', icon: './assets/shortcut5.png' }
      ]
    } }),
    new HtmlWebpackPlugin({ title: 'KittenLocks', publicPath: '/', meta: {
      viewport: 'width=device-width, initial-scale=1, maximum-scale=1, minimum-scale=1',
      description: 'a pawtastic WebApp to enchance your Chaster experience',
      OGtitle: { property: 'og:title', content: 'KittenLocks' },
      OGtype: { property: 'og:type', content: 'website' },
      OGurl: { property: 'og:url', content: 'https://www.kittenlocks.de/' },
      OGimage: { property: 'og:image', content: 'https://www.kittenlocks.de/static/images/appicon.webp' },
      OGdescription: { property: 'og:description', content: 'KittenLocks is a pawtastic WebApp to enchance your Chaster experience, built with ❤ by Silizia ~ Stella.' }
    } }),
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
    ...(process.env.NETLIFY ? [
      new SentryWebpackPlugin({
        authToken: process.env.SENTRY_AUTH_TOKEN, org: 'stella-xy', project: `${process.env.BRANCH === 'beta' ? 'beta-' : ''}kittenlocks`,
        release: `kittenlocks@${process.env.npm_package_version}${process.env.BRANCH === 'beta' ? '-beta' : ''}+${process.env.COMMIT_REF}`,
        include: './public',
        setCommits: { repo: 'KittenApps/KittenLocks', commit: process.env.COMMIT_REF, previousCommit: process.env.CACHED_COMMIT_REF }
      })
    ] : []),
  ...(process.env.NODE_ENV === 'production' && process.env.BRANCH !== 'beta' ? [new GenerateSW({ clientsClaim: true, skipWaiting: false, navigateFallback: 'index.html', navigateFallbackDenylist: [/^\/service-worker\.js$/u, /^\/workbox-.*\.js$/u, /^\/static\/.*$/u], exclude: [/^static\/images\/(?:apple-touch-|android-chrome-|mstile-|yandex-|browserconfig|shortcut).*/ui], ignoreURLParametersMatching: [/.*/u], importScriptsViaChunks: ['sw_push'] })] : [])
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