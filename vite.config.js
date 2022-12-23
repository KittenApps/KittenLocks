/* eslint-disable unicorn/filename-case */
/* eslint-env node */
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import graphql from '@rollup/plugin-graphql';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), graphql()],
  publicDir: false,
  define: {
    VITE_ENV: {
      VERSION: `${process.env.npm_package_version}${process.env.BRANCH ? (process.env.BRANCH === 'beta' ? '-beta' : '') : '-dev'}`,
      SENTRY: process.env.BRANCH === 'beta' ? 'https://a7ed71bbcd69473f87d243c8a00d378e@o1079625.ingest.sentry.io/6117777' : 'https://97ce662232dc48e8967956f7bcae23f5@o1079625.ingest.sentry.io/6084627'
    }
  },
  build: {
    outDir: 'public'
  },
  server: {
    port: 5000
  }
});