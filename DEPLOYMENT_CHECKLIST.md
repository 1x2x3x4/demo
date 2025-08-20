# 🚀 GitHub Pages 部署检查清单

## ✅ 部署前检查

### 1. 文件结构检查
- [x] `.github/workflows/deploy-pages.yml` 存在且位置正确
- [x] `package.json` 包含正确的构建脚本
- [x] `webpack.config.js` 配置正确
- [x] `.gitignore` 文件存在，排除 `node_modules/` 和 `dist/`

### 2. 代码检查
- [x] 所有导入路径正确
- [x] 没有语法错误
- [x] 构建命令 `npm run build` 执行成功
- [x] 构建输出到 `dist/` 目录

### 3. 依赖检查
- [x] `package-lock.json` 已提交到Git
- [x] 所有依赖在 `package.json` 中正确声明
- [x] 开发依赖和运行时依赖分离正确

## 🔧 部署步骤

### 1. 推送代码到GitHub
```bash
# 确保在master分支
git checkout master

# 添加所有文件
git add .

# 提交更改
git commit -m "Configure GitHub Pages deployment"

# 推送到远程仓库
git push origin master
```

### 2. 检查GitHub Actions
1. 访问你的GitHub仓库
2. 点击 "Actions" 标签
3. 查看 "Build & Deploy (Webpack) to GitHub Pages" 工作流
4. 确保工作流执行成功

### 3. 配置GitHub Pages
1. 在仓库设置中找到 "Pages"
2. 确保 "Source" 设置为 "GitHub Actions"
3. 等待部署完成

## 🌐 部署后验证

### 1. 检查部署状态
- [ ] GitHub Actions 工作流执行成功
- [ ] 没有构建错误
- [ ] 部署状态显示为 "Deployed"

### 2. 访问在线页面
- [ ] 主页面: `https://[username].github.io/[repo-name]/demo/`
- [ ] 示波器界面: `https://[username].github.io/[repo-name]/demo/index.html`
- [ ] 内部原理: `https://[username].github.io/[repo-name]/demo/internal.html`

### 3. 功能测试
- [ ] 页面加载正常
- [ ] 示波器功能正常
- [ ] FFT频谱分析正常
- [ ] 3D可视化正常
- [ ] 页面切换功能正常

## 🚨 常见问题解决

### 1. 构建失败
```bash
# 本地测试构建
npm run build

# 检查错误信息
# 修复导入路径问题
# 确保所有依赖已安装
```

### 2. 部署失败
- 检查 `.github/workflows/` 目录结构
- 确保 `deploy-pages.yml` 语法正确
- 检查分支名称是否为 `master`

### 3. 页面404错误
- 检查 `webpack.config.js` 中的 `BASE_PATH` 配置
- 确保构建输出包含 `demo/` 目录
- 验证GitHub Pages设置

### 4. 资源加载失败
- 检查静态资源路径
- 确保CDN资源可访问
- 验证 `publicPath` 配置

## 📊 性能优化建议

### 1. 构建优化
- 启用代码分割
- 压缩和混淆代码
- 优化图片和字体资源

### 2. 运行时优化
- 延迟加载非关键组件
- 使用Web Workers处理复杂计算
- 实现虚拟滚动优化长列表

### 3. 缓存策略
- 设置适当的HTTP缓存头
- 使用Service Worker实现离线功能
- 优化资源加载顺序

## 🔍 调试技巧

### 1. 本地调试
```bash
# 启动开发服务器
npm run dev

# 检查浏览器控制台
# 使用开发者工具调试
```

### 2. 生产环境调试
- 启用source map
- 添加错误监控
- 使用性能分析工具

### 3. 日志记录
- 添加关键操作的日志
- 记录错误和异常
- 监控用户行为

## 📞 获取帮助

如果遇到问题，请：

1. 检查GitHub Actions日志
2. 查看浏览器控制台错误
3. 提交Issue到GitHub仓库
4. 参考项目README文档

---

**注意**: 部署成功后，每次推送到master分支都会自动触发重新部署。
