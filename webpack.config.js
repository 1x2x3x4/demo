// CommonJS 写法，Node ≥14 可直接运行
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  mode: 'development',           // 或 'production'
  entry: './src/main.js',
  output: {
    filename: 'bundle.[contenthash].js',
    path: path.resolve(__dirname, 'docs'),
    clean: true,                 // 每次构建前清理 docs
  },
  devtool: 'source-map',
  devServer: {
    static: './dist',           // Webpack-5 写法
    hot: true,                   // 模块热替换
    open: true,                  // 启动后自动打开浏览器
    port: 5173,                  // 随意
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './public/index.html',   // 把下方模板复制进来
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
};
