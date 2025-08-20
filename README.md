# 示波器仿真系统

一个基于Web技术的示波器仿真系统，包含波形显示、李萨如图、FFT频谱分析等功能。

## 🚀 功能特性

- **示波器仿真** - 完整的示波器操作界面
- **波形显示** - 支持多种波形类型（正弦、方波、三角波等）
- **李萨如图** - 双通道信号的李萨如图显示
- **FFT频谱分析** - 实时频谱分析和峰值检测
- **1:2:5步长调节** - 符合实际示波器标准的参数调节
- **三维可视化** - 基于Three.js的电子束轨迹显示

## 🛠️ 技术栈

- **前端框架**: Vue.js
- **3D图形**: Three.js
- **构建工具**: Webpack 5
- **样式**: CSS3
- **部署**: GitHub Pages

## 📦 安装和运行

### 本地开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build
```

### 访问地址

- **本地开发**: http://localhost:8081/demo/
- **示波器界面**: http://localhost:8081/demo/index.html
- **内部原理**: http://localhost:8081/demo/internal.html

## 🌐 在线演示

项目已配置GitHub Actions自动部署到GitHub Pages：

- **主页面**: https://[your-username].github.io/[repo-name]/demo/
- **示波器**: https://[your-username].github.io/[repo-name]/demo/index.html
- **内部原理**: https://[your-username].github.io/[repo-name]/demo/internal.html

## 📁 项目结构

```
├── src/                    # 源代码
│   ├── components/         # 组件
│   ├── controllers/        # 控制器
│   ├── main.js            # 内部原理入口
│   └── external.js        # 示波器入口
├── scripts/                # 核心脚本
│   ├── constants.js        # 常量定义
│   ├── waveDrawer.js       # 波形绘制
│   ├── lissajousDrawer.js  # 李萨如图
│   └── StepAdjustmentUtils.js # 步长调节工具
├── public/                 # 静态资源
│   ├── external.html       # 示波器页面
│   ├── internal.html       # 内部原理页面
│   └── styles.css          # 样式文件
├── webpack.config.js       # Webpack配置
└── .github/workflows/      # GitHub Actions
    └── deploy-pages.yml    # 自动部署配置
```

## 🔧 配置说明

### Webpack配置

- **开发模式**: 本地使用根路径 `/`
- **生产模式**: 部署到GitHub Pages使用 `/demo/` 路径
- **自动检测**: 通过 `GITHUB_ACTIONS` 环境变量自动切换

### 部署配置

- **触发条件**: 推送到 `master` 分支或手动触发
- **构建环境**: Node.js 20 + npm
- **输出目录**: `dist/`
- **部署目标**: GitHub Pages

## 📝 使用说明

### 示波器操作

1. **通道控制** - 开启/关闭输入通道
2. **波形选择** - 选择信号类型
3. **参数调节** - 使用1:2:5步长调节频率、幅度等
4. **显示模式** - 独立显示、同向叠加、垂直叠加
5. **触发系统** - 设置触发电平和模式

### FFT频谱分析

1. **信号生成** - 设置多个频率分量
2. **窗口函数** - 选择汉宁窗、海明窗等
3. **实时分析** - 启动连续频谱分析
4. **峰值检测** - 自动识别频谱峰值

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 📄 许可证

本项目采用 ISC 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 📞 联系方式

如有问题或建议，请通过以下方式联系：

- 提交 Issue
- 发送 Pull Request
- 邮件联系

---

**注意**: 这是一个教学演示项目，主要用于学习和研究目的。
