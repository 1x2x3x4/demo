// CommonJS 写法，Node ≥14 可直接运行
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  mode: 'development',           // 或 'production'
  // 关闭持久化缓存，避免模板变更未及时反映到输出 HTML
  cache: false,
  entry: {
    internal: './src/main.js',
  },
  output: {
    filename: '[name].bundle.[contenthash].js',
    path: path.resolve(__dirname, 'docs'),
    clean: true,                 // 每次构建前清理 docs
  },
  devtool: 'source-map',
  devServer: {
    // 同时提供 docs（构建产物）与项目根目录（CDN、scripts、TourGuide 等原生文件）
    static: [
      { directory: path.resolve(__dirname, 'docs') },
      { directory: path.resolve(__dirname, '.') },
    ],
    hot: true,
    open: ['external.html'],    // 默认打开外部页
    port: 8081,
  },
  plugins: [
    // 内部原理页（走 Webpack bundle）
    new HtmlWebpackPlugin({
      template: './public/internal.html',
      filename: 'internal.html',
      chunks: ['internal'],
    }),
    // 外部操作页（纯静态模板，不注入 bundle）
    new HtmlWebpackPlugin({
      template: './public/external.html',
      filename: 'external.html',
      inject: false,
    }),
  ],
  module: {
    rules: [
      // 如果后续想用 glsl / 图片等资源，可在这里追加 loader
    ],
  },
  resolve: {
    extensions: ['.js'],
  },
  // 关闭性能提示
  performance: {
    hints: false,
  },
};
