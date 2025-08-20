// 统一工程化入口：外部（面板/示波器）页面

// 第三方依赖：Vue（仍由 CDN 提供，以保持体积和升级灵活性）
// 这里不直接 import 'vue'，页面通过 <script src="...vue.min.js"></script> 提供全局 Vue

// ESM 静态导入（与 main.js 风格一致）
import '../scripts/constants.js';
import '../scripts/OscilloscopeState.js';
import GLWaveformRenderer from '../scripts/GLWaveformRenderer.js';
import WaveformRenderer from '../scripts/WaveformRenderer.js';
import { WaveDrawer } from '../scripts/waveDrawer.js';
import LissajousDrawer from '../scripts/lissajousDrawer.js';
import CalibrationLogic from '../scripts/calibrationLogic.js';
// import App from '../app.js'; // 暂时注释掉，因为app.js在根目录

// 注入右上角切换控件（样式与脚本已通过 CopyWebpackPlugin 输出到 public/ 下）
// 在 external.html 中仍保留：
//   <link rel="stylesheet" href="<%= BASE_PATH %>public/switcher.css" />
//   <script src="<%= BASE_PATH %>public/switcher.js"></script>
// 并在页面调用 window.renderSwitcher('external')


