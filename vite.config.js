const { defineConfig } = require('vite');

module.exports = defineConfig({
  root: 'dist',
  server: { host: '127.0.0.1' },
  preview: { host: '127.0.0.1' },
  build: {
    outDir: '../build',
    emptyOutDir: true,
    sourcemap: true,
  },
});
