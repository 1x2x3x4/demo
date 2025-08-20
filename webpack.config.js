// CommonJS 写法，Node ≥14 可直接运行
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

// 在 GitHub Actions 中会自动存在 GITHUB_ACTIONS=true
const isCI = process.env.GITHUB_ACTIONS === 'true';
const BASE_PATH = isCI ? '/demo/' : '/';     // 线上挂 /demo/，本地用根路径

module.exports = {
  mode: 'development',          // 或 'production'
  cache: false,
  entry: {
    internal: './src/main.js',
    external: './src/external.js',
  },
  output: {
    filename: '[name].bundle.[contenthash].js',
    path: path.resolve(__dirname, 'dist'),   // 构建输出目录
    publicPath: BASE_PATH,                   // ☆ 关键：资源前缀（本地'/'，线上'/demo/'）
    clean: true,
  },
  devtool: 'source-map',
  devServer: {
    // dev-server 会把构建产物放在内存中从“服务器根”提供；static 只用于磁盘上的额外静态文件
    static: [
      { directory: path.resolve(__dirname, 'dist') }, // 访问 dist 中的静态文件（如 CNAME）
      { directory: path.resolve(__dirname, '.') },    // 根目录下的 /CDN /public /TourGuide 等
    ],
    hot: true,
    open: ['demo/index.html'],   // 本地直接打开 /demo/index.html（由 HWP 虚拟输出）
    port: 8081,
    // 如需让本地也“完全模拟”线上（资源也从 /demo/ 前缀提供），取消下面注释两行：
    // devMiddleware: { publicPath: '/demo/' },        // 与 output.publicPath 对齐
    // static: [{ directory: path.resolve(__dirname, '.'), publicPath: '/demo/' }],
  },
  plugins: [
    // /demo/internal.html 走 Webpack bundle（会自动按 publicPath 注入 <script>）
    new HtmlWebpackPlugin({
      template: './public/internal.html',
      filename: 'demo/internal.html',
      chunks: ['internal'],
      templateParameters: { BASE_PATH },   // 提供给模板使用
    }),
    // /demo/index.html 作为“外部页/首页”，注入 external 入口的 bundle
    new HtmlWebpackPlugin({
      template: './public/external.html',
      filename: 'demo/index.html',      // 作为 /demo/ 的首页，把./public/external.html 映射到 /demo/index.html
      chunks: ['external'],
      inject: 'body',
      templateParameters: { BASE_PATH },   // 提供给模板使用
    }),
    // 将 src/widgets/switcher.js 复制为输出目录下的 public/switcher.js，供两端页面公用
    new CopyWebpackPlugin({
      patterns: [
        // JS：复制到两份，兼容 dev('/') 与 prod('/demo/')
        { from: path.resolve(__dirname, 'src/widgets/switcher.js'), to: 'public/switcher.js' },
        { from: path.resolve(__dirname, 'src/widgets/switcher.js'), to: 'demo/public/switcher.js' },
        // CSS：从 src/widgets 源复制到两份
        { from: path.resolve(__dirname, 'src/widgets/switcher.css'), to: 'public/switcher.css' },
        { from: path.resolve(__dirname, 'src/widgets/switcher.css'), to: 'demo/public/switcher.css' },
        // 其他静态资源：样式与第三方库
        { from: path.resolve(__dirname, 'public/styles.css'), to: 'public/styles.css' },
        { from: path.resolve(__dirname, 'public/styles.css'), to: 'demo/public/styles.css' },
        { from: path.resolve(__dirname, 'CDN'), to: 'CDN' },
        { from: path.resolve(__dirname, 'CDN'), to: 'demo/CDN' },
        { from: path.resolve(__dirname, 'TourGuide'), to: 'TourGuide' },
        { from: path.resolve(__dirname, 'TourGuide'), to: 'demo/TourGuide' },
      ],
    }),
  ],
  module: { rules: [] },
  resolve: { extensions: ['.js'] },
  performance: { hints: false },
};
