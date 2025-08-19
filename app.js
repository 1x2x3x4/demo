/**
 * 创建并配置波形渲染器
 * @param {HTMLCanvasElement} canvas - 目标Canvas元素
 * @returns {WaveformRenderer} 配置好的渲染器实例
 */
function createWaveformRenderer(canvas) {
  return new WaveformRenderer(canvas, {
    colors: {
      background: '#121212',
      grid: '#2a2a2a',
      axes: '#3a3a3a',
      waveform: '#4CAF50',
      text: '#909090'
    },
    viewport: {
      timeScale: 0.5,      // 时间轴缩放比例
      voltScale: 1.0,      // 电压轴缩放比例
      offsetX: 0           // 时间轴偏移量
    },
    grid: {
      showMajor: true      // 显示网格
    },
    axes: {
      showLabels: true     // 显示标签
    }
  });
}

/**
 * 初始化波形数据并启动渲染
 * @param {WaveformRenderer} renderer - 波形渲染器实例
 */
function initializeWaveform(renderer) {
  // 生成测试数据
  const waveType = 'sine';
  const dataLength = 1000;
  const frequency = 1;
  const amplitude = 2;
  
  const testData = renderer.generateTestData(
    waveType, 
    dataLength, 
    frequency, 
    amplitude
  );
  
  // 更新渲染器数据
  renderer.update(testData);
  
  // 启动渲染循环
  renderer.start();
}

/**
 * 设置UI控制和交互事件
 * @param {WaveformRenderer} renderer - 波形渲染器实例
 */
function setupControls(renderer) {
  // 这里实现UI控制逻辑，从原始的setupControls函数中提取
  // 示例：为波形类型选择添加事件处理
  document.querySelectorAll('.wave-select button').forEach(button => {
    button.addEventListener('click', (e) => {
      const waveType = e.target.dataset.type || 'sine';
      updateWaveform(renderer, waveType);
    });
  });
  
  // 其他控制实现...
}

/**
 * 更新波形类型
 * @param {WaveformRenderer} renderer - 波形渲染器实例
 * @param {string} waveType - 波形类型
 */
function updateWaveform(renderer, waveType) {
  // 重新生成指定类型的波形数据
  const dataLength = 1000;
  const frequency = 1;
  const amplitude = 2;
  
  const newData = renderer.generateTestData(
    waveType,
    dataLength,
    frequency,
    amplitude
  );
  
  // 更新渲染器数据
  renderer.update(newData);
}

new Vue({
  el: '#app',
  data: {
    // 当前模式，'wave'表示波形模式
    currentMode: 'wave',

    // 可选波形类型列表
    waveTypes: [
      { type: 'sine', name: '正弦波' },
      { type: 'square', name: '方波' },
      { type: 'triangle', name: '三角波' },
      { type: 'sawtooth', name: '锯齿波' },
      { type: 'noise', name: '噪声' },
      { type: 'pulse', name: '脉冲波' }
    ],

    // 当前波形类型，默认为正弦波
    signalType: 'sine',
    // 1号和2号输入通道激活状态
    inputActive: { 1: false, 2: false },
    // 显示模式: 'independent'（独立显示）, 'overlay'（同向叠加）, 'vertical'（垂直叠加）
    displayMode: 'independent',
    // 时间分度值（例如，1表示1个单位时间，每单位时间在显示上按8格计算）
    timeDiv: 1,
    // 电压分度值（单位：伏），分别对应1号和2号通道
    voltsDiv: { 1: 1, 2: 1 },
    // X轴和Y轴频率（单位：Hz），用于李萨如图
    freqX: 1,
    freqY: 1,
    // 相位差（单位：度），用于李萨如图
    phaseDiff: 90,
    // Canvas上下文，绘制波形使用
    ctx: null,
    // 动画帧ID，用于控制动画循环
    animationId: null,
    // 当前相位，随时间变化（单位：弧度）
    phase: 0,
    // 存储点历史记录，用于绘制波形
    pointsHistory: [],
    // 精细时间分度值
    timeDivFine: 1,
    // 精细电压分度值，分别对应1号和2号通道
    voltsDivFine: { 1: 1, 2: 1 },
    // 滑块是否被拖动
    isDragging: false,
    // 上一次有效值，用于验证输入
    lastValidValue: {
      time: 1,
      volts: { 1: 1, 2: 1 }
    },
    // 滑块值，用于调整时间和电压分度
    sliderValues: {
      time: 1,
      volts: { 1: 0, 2: 0 }
    },
    // 峰值电压，分别对应1号和2号通道（单位：伏）
    peakValues: { 1: 1, 2: 1 },
    // 频率值，分别对应1号和2号通道（单位：Hz）
    frequencies: { 1: 1, 2: 1 },
    // 当前峰值电压
    peakValue: 1,
    // 当前频率
    frequency: 1,
    // 当前激活的滑块
    sliderActive: null,
    // 滑块偏移值
    sliderOffset: 0,
    // 是否需要重绘
    needsRedraw: false,
    // 是否正在运行（运行状态）
    isRunning: true,
    // 触发电平，范围-5到5伏（1伏=40像素，中心点200px）
    triggerLevel: 0,
    // 触发模式：auto, normal, single
    triggerMode: 'auto',
    // 暂停时显示的帧
    lastCapturedFrame: null,
    // 实验步骤控制
    expStep: 'calibration', // 'calibration', 'normal', 'lissajous'
    calibrationFactor: 1.0, // 校准系数，1.0为标准校准

    // 自检模式专用数据 - 调整频率单位表示
    calibrationParams: {
      frequencies: { 1: 1, 2: 1 },  // 修改为1赫兹以匹配界面显示
      peakValues: { 1: 4, 2: 4 },    // 保持5V峰值
      waveTypes: { 1: 'square', 2: 'square' } // 两个通道都使用方波信号
    },

    // 添加校准状态
    calibrationComplete: false,

    // 添加显示微调系数
    displayAdjustFactors: {
      time: 1.0,
      volts: { 1: 1.0, 2: 1.0 }
    },

    // 保存自检页面的校准参数（新增）
    savedCalibrationSettings: {
      displayAdjustFactors: {
        time: 1.0,
        volts: { 1: 1.0, 2: 1.0 }
      },
      calibrationFactor: 1.0
    },

    // 添加水平和垂直位置控制
    horizontalPosition: 0, // 水平位置偏移，单位：格
    verticalPosition: { 1: 0, 2: 0 }, // 垂直位置偏移，单位：格，分别对应1号和2号通道

    triggerActive: true,      // 触发系统是否激活
    triggerSource: 1,         // 触发源通道（1或2）
    triggerSlope: 'rising',   // 触发斜率：rising（上升）或falling（下降）

    // 添加李萨如图优化相关属性
    lissajousOptimization: {
      maxPoints: 5000,      // 最大渲染点数
      highFrequencyThreshold: 20 // 高频率阈值
      // autoSimplifyRatio 属性用于判断是否自动简化频率比例，
      // 默认开启时将自动简化高频率比例
      , autoSimplifyRatio: true
    },
  },
  mounted() {
    try {
      const canvas = this.$refs.oscilloscope;
      // 动态设置Canvas像素尺寸（避免CSS缩放失真）
      canvas.width = OscilloscopeConstants.CANVAS.WIDTH;
      canvas.height = OscilloscopeConstants.CANVAS.HEIGHT;
      this.ctx = canvas.getContext('2d');
      if (!this.ctx) {
        throw new Error('Failed to get canvas context');
      }
      
      // 初始化值
      this.peakValues = { 1: this.peakValue, 2: this.peakValue };
      this.frequencies = { 1: this.frequency, 2: this.frequency };

      // 默认将校准系数设置为0.85，模拟需要校准的初始状态
      this.calibrationFactor = 0.85;

      // 默认开启通道1，这样画面上就会有波形显示
      this.$set(this.inputActive, 1, false);
      this.$set(this.inputActive, 2, false);
      
      // 开始绘制循环
      this.drawLoop();

      // 添加事件监听
      document.addEventListener('mousemove', this.handleMouseMove);
      document.addEventListener('mouseup', this.handleMouseUp);

    } catch (error) {
      console.error('Canvas initialization failed:', error);
      // 可以添加错误提示信息到页面上
    }
  },
  beforeDestroy() {
    // 取消动画帧
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    
    // 移除所有事件监听器
    document.removeEventListener('mousemove', this.handleMouseMove);
    document.removeEventListener('mouseup', this.handleMouseUp);
    document.removeEventListener('mousemove', this.handleSliderMove);
    document.removeEventListener('mouseup', this.handleSliderEnd);
  },
  computed: {
    // 计算滑块的最小值，最大值和步进值
    sliderRanges() {
      return {
        time: {
          min: Math.max(0.2, this.timeDiv - this.timeDiv / 5),
          max: this.timeDiv + this.timeDiv / 5,
          step: this.timeDiv / 100
        },
        volts1: {
          min: Math.max(0.02, this.voltsDiv[1] - this.voltsDiv[1] / 5),
          max: this.voltsDiv[1] + this.voltsDiv[1] / 5,
          step: this.voltsDiv[1] / 100
        },
        volts2: {
          min: Math.max(0.02, this.voltsDiv[2] - this.voltsDiv[2] / 5),
          max: this.voltsDiv[2] + this.voltsDiv[2] / 5,
          step: this.voltsDiv[2] / 100
        }
      }
    },
    // 计算触发电平在屏幕上的位置（中心200像素，1伏=40像素）
    triggerLevelPosition() {
      return 200 - (this.triggerLevel * 40);
    },
    // 当前模式下的有效参数
    effectiveParams() {
      if (this.expStep === 'calibration') {
        return {
          frequencies: this.calibrationParams.frequencies,
          peakValues: this.calibrationParams.peakValues,
          waveTypes: this.calibrationParams.waveTypes
        };
      } else {
        return {
          frequencies: this.frequencies,
          peakValues: this.peakValues,
          waveType: this.signalType
        };
      }
    },
    // 校准状态指示（使用CalibrationLogic模块）
    calibrationStatus() {
      return CalibrationLogic.checkCalibrationStatus(this.calibrationFactor);
    },
    // 计算简化后的频率比例（使用LissajousDrawer模块）
    simplifiedRatio() {
      const gcd = LissajousDrawer.gcdPrecise(this.freqX, this.freqY);
      if (gcd < 0.001) return { x: this.freqX, y: this.freqY };

      let simplifiedX = this.freqX / gcd;
      let simplifiedY = this.freqY / gcd;

      if (Math.abs(Math.round(simplifiedX) - simplifiedX) < 0.01) {
        simplifiedX = Math.round(simplifiedX);
      } else {
        simplifiedX = parseFloat(simplifiedX.toFixed(2));
      }
      
      if (Math.abs(Math.round(simplifiedY) - simplifiedY) < 0.01) {
        simplifiedY = Math.round(simplifiedY);
      } else {
        simplifiedY = parseFloat(simplifiedY.toFixed(2));
      }
      
      return { x: simplifiedX, y: simplifiedY };
    },
    // 判断是否需要显示简化比例（如果原始比例和简化比例不同）
    needsSimplification() {
      return this.freqX !== this.simplifiedRatio.x || this.freqY !== this.simplifiedRatio.y;
    }
  },
  watch: {
    // 同步时间分度和滑块状态
    timeDiv(val) {
      this.timeDivFine = val;
      this.lastValidValue.time = val;
      this.sliderValues.time = 0;
    },
    'voltsDiv.1'(val) {
      this.voltsDivFine[1] = val;
      this.lastValidValue.volts[1] = val;
      this.sliderValues.volts[1] = 0;
    },
    'voltsDiv.2'(val) {
      this.voltsDivFine[2] = val;
      this.lastValidValue.volts[2] = val;
      this.sliderValues.volts[2] = 0;
    },
    // 监听校准系数变化
    calibrationFactor(newVal) {
      this.needsRedraw = true;
      this.calibrationComplete = Math.abs(newVal - 1.0) < 0.02;
      
      // 同步保存到savedCalibrationSettings
      this.savedCalibrationSettings.calibrationFactor = newVal;
    }
  },
  methods: {
    // 计算滑块位置的辅助函数
    calculateSliderPosition(type, line) {
      if (type === 'time') {
        // 将0.1-2.0范围映射到0-1范围
        return (this.displayAdjustFactors.time - 0.1) / 1.9;
      } else if (type === 'volts' && line) {
        // 将0.1-2.0范围映射到0-1范围
        return (this.displayAdjustFactors.volts[line] - 0.1) / 1.9;
      }
      return 0;
    },
    
    // 模式控制
    switchMode(mode) {
      if (mode === 'lissajous') {
        // 使用LissajousDrawer模块化函数切换到李萨如图模式
        Object.assign(this, LissajousDrawer.switchToLissajousMode(this));
      } else {
        // 使用LissajousDrawer模块化函数切换回波形模式
        Object.assign(this, LissajousDrawer.switchToWaveMode(this));
      }
    },

    // 实验步骤控制
    setExpStep(step) {
      // 使用CalibrationLogic模块化函数设置实验步骤
      Object.assign(this, CalibrationLogic.setExperimentStep(this, step));
      
      // 如果切换到标准测量模式，输出当前校准参数到控制台
      if (step === 'normal') {
        console.log('当前校准参数 (仅控制台显示)', 
          'background:#42b983; color:white; padding:4px 6px; border-radius:3px; font-weight:bold', 
          'font-weight:normal');
        console.log('校准系数: ' + this.savedCalibrationSettings.calibrationFactor.toFixed(2));
        console.log('时间微调: ' + this.savedCalibrationSettings.displayAdjustFactors.time.toFixed(2));
        console.log('通道1电压微调: ' + this.savedCalibrationSettings.displayAdjustFactors.volts[1].toFixed(2));
        console.log('通道2电压微调: ' + this.savedCalibrationSettings.displayAdjustFactors.volts[2].toFixed(2));
      }
    },

    // 波形控制
    setSignalType(type) {
      // 使用WaveDrawer模块化函数更新波形类型
      Object.assign(this, WaveDrawer.updateWaveformType(this, type));
      this.refreshDisplay();
    },

    // 控制运行状态
    toggleRunning() {
      this.isRunning = !this.isRunning;
      if (this.isRunning) {
        this.drawLoop();
      } else {
        cancelAnimationFrame(this.animationId);
        this.lastCapturedFrame = this.ctx.getImageData(0, 0, 800, 400);
      }
    },

    // 绘图工具方法：获取有效校准参数
    getEffectiveCalibrationParams() {
      const useCalibrationParams = this.expStep === 'calibration';
      
      return {
        useCalibrationParams,
        effectiveCalibrationFactor: useCalibrationParams ? 
                                    this.calibrationFactor : 
                                    this.savedCalibrationSettings.calibrationFactor,
        effectiveDisplayFactors: useCalibrationParams ? 
                                this.displayAdjustFactors : 
                                this.savedCalibrationSettings.displayAdjustFactors
      };
    },
    
    // 绘图工具方法：调整触发相位
    adjustTriggerPhase() {
      if (!this.inputActive[1] && !this.inputActive[2]) return this.phase;
      
      const { useCalibrationParams, effectiveCalibrationFactor, effectiveDisplayFactors } = 
        this.getEffectiveCalibrationParams();
      
      // 使用WaveDrawer模块处理触发器相位调整
      return WaveDrawer.adjustPhaseForTrigger({
        triggerActive: this.triggerActive,
        triggerSource: this.triggerSource,
        inputActive: this.inputActive,
        voltsDiv: this.voltsDiv,
        peakValues: this.peakValues,
        frequencies: this.frequencies,
        timeDiv: this.timeDiv,
        expStep: this.expStep,
        calibrationParams: this.calibrationParams,
        signalType: this.signalType,
        phase: this.phase,
        triggerLevel: this.triggerLevel,
        triggerSlope: this.triggerSlope,
        displayAdjustFactors: effectiveDisplayFactors,
        calibrationFactor: effectiveCalibrationFactor
      });
    },
    
    // 绘图工具方法：绘制波形
    renderWaveforms() {
      const { CONSTANTS, CHANNEL_COLORS } = WaveformUtilities;
      
      // 判断是否使用同向叠加模式且两个通道都激活
      if (this.displayMode === 'overlay' && this.inputActive[1] && this.inputActive[2]) {
        // 获取有效校准参数
        const { effectiveCalibrationFactor, effectiveDisplayFactors } = 
          this.getEffectiveCalibrationParams();
        
        // 绘制叠加波形
        WaveDrawer.drawOverlayWave(this.ctx, {
          expStep: this.expStep, 
          signalType: this.signalType,
          calibrationParams: this.calibrationParams,
          timeDiv: this.timeDiv,
          frequencies: this.frequencies,
          peakValues: this.peakValues,
          voltsDiv: this.voltsDiv,
          phase: this.phase,
          displayAdjustFactors: effectiveDisplayFactors,
          calibrationFactor: effectiveCalibrationFactor,
          horizontalPosition: this.horizontalPosition,
          verticalPosition: {
            1: this.verticalPosition[1],
            2: this.verticalPosition[2]
          },
          inputActive: this.inputActive,
          phaseDiff: this.phaseDiff
        });
      } else {
        // 非叠加模式或只有一个通道激活时，正常绘制各通道波形
        if (this.inputActive[1]) this.drawWave(1, CHANNEL_COLORS[1]);
        if (this.inputActive[2]) this.drawWave(2, CHANNEL_COLORS[2]);
      }
    },
    
    // 绘图工具方法：渲染李萨如图模式
    renderLissajousMode() {
      // 检查是否两个通道都开启
      if (this.inputActive[1] && this.inputActive[2]) {
        this.drawLissajous();
      } else {
        // 如有通道未开启，显示提示信息
        const { CONSTANTS } = WaveformUtilities;
        const ctx = this.ctx;
        
        ctx.font = '18px Arial';
        ctx.fillStyle = '#666';
        ctx.textAlign = 'center';
        ctx.fillText('请开启两个通道以显示李萨如图', 
                    CONSTANTS.CANVAS.WIDTH / 2, 
                    CONSTANTS.CANVAS.HEIGHT / 2);
      }
    },
    
    // 绘图工具方法：初始化画布
    setupCanvas() {
      const { CONSTANTS } = WaveformUtilities;
      const ctx = this.ctx;
      
      // 清除画布
      ctx.clearRect(0, 0, CONSTANTS.CANVAS.WIDTH, CONSTANTS.CANVAS.HEIGHT);
      
      // 绘制网格
      WaveformUtilities.drawGrid(ctx);
      
      // 波形模式下绘制触发电平线
      if (this.currentMode === 'wave' || this.expStep === 'calibration') {
        WaveDrawer.drawTriggerLevel(ctx, this.triggerLevelPosition);
      }
    },
    
    // 暂停状态下刷新显示
    refreshDisplay() {
      // 设置画布
      this.setupCanvas();
      
      if (this.currentMode === 'wave' || this.expStep === 'calibration') {
        // 调整相位
        if (this.inputActive[1] || this.inputActive[2]) {
          this.phase = this.adjustTriggerPhase();
        }
        
        // 绘制波形
        this.renderWaveforms();
      } else {
        // 李萨如图模式
        this.renderLissajousMode();
      }
      
      // 保存当前画布状态
      if (!this.isRunning) {
        const { CONSTANTS } = WaveformUtilities;
        this.lastCapturedFrame = this.ctx.getImageData(
          0, 0, CONSTANTS.CANVAS.WIDTH, CONSTANTS.CANVAS.HEIGHT
        );
      }
    },

    // 调整触发电平
    adjustLevel(delta) {
      this.triggerLevel = WaveformUtilities.clamp(this.triggerLevel + delta, -5, 5);
      this.needsRedraw = true;
      this.refreshDisplay();
    },

    // 绘图主循环
    drawLoop() {
      try {
        if (!this.isRunning) return;

        // 设置画布
        this.setupCanvas();

        if (this.currentMode === 'wave' || this.expStep === 'calibration') {
          // 调整相位
          if (this.inputActive[1] || this.inputActive[2]) {
            this.phase = this.adjustTriggerPhase();
          }
          
          // 绘制波形
          this.renderWaveforms();
        } else {
          // 李萨如图模式
          this.renderLissajousMode();
        }

        if (this.isRunning) {
          this.phase += 0.02;
          this.animationId = requestAnimationFrame(this.drawLoop);
        }
      } catch (error) {
        console.error('Draw loop error:', error);
      }
    },

    // 绘制波形（包装WaveDrawer模块的函数）
    drawWave(line, color) {
      try {
        // 获取有效校准参数
        const { effectiveCalibrationFactor, effectiveDisplayFactors } = 
          this.getEffectiveCalibrationParams();
        
        // 使用WaveDrawer模块绘制波形
        WaveDrawer.drawWave(this.ctx, {
          line, 
          color, 
          expStep: this.expStep, 
          signalType: this.signalType,
          calibrationParams: this.calibrationParams,
          timeDiv: this.timeDiv,
          frequencies: this.frequencies,
          peakValues: this.peakValues,
          voltsDiv: this.voltsDiv,
          phase: this.phase,
          displayAdjustFactors: effectiveDisplayFactors,
          calibrationFactor: effectiveCalibrationFactor,
          horizontalPosition: this.horizontalPosition,
          verticalPosition: this.verticalPosition[line],
          displayMode: this.displayMode,
          phaseDiff: this.phaseDiff
        });
      } catch (error) {
        console.error('Wave drawing failed:', error);
      }
    },

    // 绘制李萨如图（包装LissajousDrawer模块的函数）
    drawLissajous() {
      try {
        // 通道检查已在renderLissajousMode方法中处理，这里可直接绘制
        LissajousDrawer.drawLissajous(this.ctx, {
          freqX: this.freqX,
          freqY: this.freqY,
          phaseDiff: this.phaseDiff,
          phase: this.phase,
          lissajousOptimization: this.lissajousOptimization,
          peakValues: this.peakValues,
          horizontalPosition: this.horizontalPosition,
          verticalPosition: this.verticalPosition,
          voltsDiv: this.voltsDiv
        });
      } catch (error) {
        console.error('Lissajous drawing failed:', error);
      }
    },

    // 输入控制
    handleInput(type, value, line) {
      try {
        let parsedValue = Number(value);
        if (isNaN(parsedValue)) {
          throw new Error('Invalid input: Not a number');
        }

        if (type === 'time') {
          this.timeDiv = WaveformUtilities.clamp(parsedValue, 1, 100);
          this.timeDiv = Number(this.timeDiv.toFixed(1));
          this.sliderValues.time = 0;
        } else if (type === 'volts') {
          this.voltsDiv[line] = WaveformUtilities.clamp(parsedValue, 0.1, 10);
          this.voltsDiv[line] = Number(this.voltsDiv[line].toFixed(2));
          this.sliderValues.volts[line] = 0;
        }
        this.needsRedraw = true;
      } catch (error) {
        console.error('Input handling failed:', error);
      }
    },

    onSliderStart() {
      this.isDragging = true;
    },
    onSliderEnd() {
      this.isDragging = false;
    },
    handleSliderInput(type, line, event) {
      try {
        const percent = parseFloat(event.target.value);
        if (type === 'time') {
          this.displayAdjustFactors.time = 1.0 + percent * 0.2;
        } else if (type === 'volts') {
          this.displayAdjustFactors.volts[line] = 1.0 + percent * 0.2;
        }
        this.needsRedraw = true;
      } catch (error) {
        console.error('Slider input handling failed:', error);
      }
    },
    startSlider(type, line) {
      this.sliderActive = { type, line };
      this.sliderStartValue = type === 'time' 
        ? this.displayAdjustFactors.time 
        : this.displayAdjustFactors.volts[line];
      
      // 记录起始鼠标位置
      this.sliderStartMouseX = null;
      
      document.addEventListener('mousemove', this.handleSliderMove);
      document.addEventListener('mouseup', this.handleSliderEnd);
    },
    handleSliderMove(event) {
      if (!this.sliderActive) return;
      
      const { type, line } = this.sliderActive;
    
      // 获取滑块的 min/max 范围，动态计算灵敏度
      const range = type === 'time' 
        ? { min: 0.1, max: 2.0 } 
        : { min: 0.1, max: 2.0 };
      const valueRange = range.max - range.min;
      const sensitivity = valueRange / 300; // 鼠标移动1px，变动1/300的范围，适应新的300px宽度
    
      const adjustAmount = event.movementX * sensitivity;
    
      Object.assign(this, CalibrationLogic.updateAdjustFactor(this, type, line, adjustAmount));
      
      if (type === 'time'){
        console.log(`时间微调: ${this.displayAdjustFactors.time.toFixed(2)}`);
      } else if (type === 'volts') {
        console.log(`通道${line}电压微调: ${this.displayAdjustFactors.volts[line].toFixed(2)}`);
      }
      
      this.refreshDisplay();
    },
    handleSliderEnd() {
      this.sliderActive = null;
      document.removeEventListener('mousemove', this.handleSliderMove);
      document.removeEventListener('mouseup', this.handleSliderEnd);
    },
    handleMouseMove(event) {
      // 当前仅处理非滑块相关的鼠标移动
      if (this.someOtherDragOperation) {
        // 可扩展其他拖动操作
      }
    },
    toggleInput(line) {
      try {
        this.$set(this.inputActive, line, !this.inputActive[line]);
        this.needsRedraw = true;
        if (this.expStep === 'calibration' || !this.isRunning) {
          this.refreshDisplay();
        }
      } catch (error) {
        console.error('Toggle input failed:', error);
      }
    },
    calculateRange(type, line) {
      return {
        min: -1,
        max: 1,
        step: 0.01
      };
    },
    adjustParam(param, step, line) {
      try {
        if (['freqX', 'freqY', 'phaseDiff'].includes(param)) {
          // 使用LissajousDrawer模块化函数调整李萨如参数
          Object.assign(this, LissajousDrawer.adjustLissajousParam(this, param, step));
        } else {
          // 使用WaveDrawer模块化函数调整示波器参数
          Object.assign(this, WaveDrawer.adjustScopeSettings(this, param, step, line));
        }
        this.refreshDisplay();
      } catch (error) {
        console.error('Parameter adjustment failed:', error);
      }
    },
    validateInput(type, line) {
      try {
        // 使用WaveDrawer模块化函数验证输入
        Object.assign(this, WaveDrawer.validateInputSettings(this, type, line));
        this.refreshDisplay();
      } catch (error) {
        console.error('Input validation failed:', error);
      }
    },
    resetTrigger() {
      if (!this.isRunning) {
        console.log('暂停状态下无法重置触发电平，请先恢复运行');
        alert('暂停状态下无法重置触发电平，请先恢复运行');
        return;
      }
      
      // 使用WaveDrawer模块化函数重置触发系统
      Object.assign(this, WaveDrawer.resetTriggerSystem(this));
      console.log('触发电平已重置为0');
      this.needsRedraw = true;
    },
    toggleTriggerSlope() {
      // 使用WaveDrawer模块化函数切换触发斜率
      this.triggerSlope = WaveDrawer.toggleTriggerSlope(this.triggerSlope);
      this.needsRedraw = true;
      this.refreshDisplay();
    },
    setTriggerSource(channel) {
      if (channel === 1 || channel === 2) {
        this.triggerSource = channel;
        this.needsRedraw = true;
        this.refreshDisplay();
      }
    },
    // 调整位置参数（水平位置和垂直位置）
    adjustPosition(type, step, line) {
      try {
        if (type === 'horizontal') {
          // 水平位置的范围限制在-8到8格之间（一个屏幕宽度为16格）
          this.horizontalPosition = Math.min(8, Math.max(-8, this.horizontalPosition + step));
        } else if (type === 'vertical' && line) {
          // 垂直位置的范围限制在-4到4格之间（一个屏幕高度为8格）
          this.verticalPosition[line] = Math.min(4, Math.max(-4, this.verticalPosition[line] + step));
        }
        this.needsRedraw = true;
        this.refreshDisplay();
      } catch (error) {
        console.error('Position adjustment failed:', error);
      }
    },
    // 设置显示模式
    setDisplayMode(mode) {
      if (['independent', 'overlay', 'vertical'].includes(mode)) {
        // 如果是overlay或vertical模式，需要检查两个通道是否都已激活
        if (mode === 'overlay' || mode === 'vertical') {
          // 如果两个通道都激活，才设置为该模式
          if (this.inputActive[1] && this.inputActive[2]) {
            this.displayMode = mode;
          } else {
            // 如果有通道未激活，提示用户并保持原来的显示模式
            const modeName = mode === 'overlay' ? '同向叠加' : '垂直叠加';
            console.log(`请先激活两个通道后再使用${modeName}模式`);
            alert(`${modeName}模式需要两个通道都激活！请先开启通道1和通道2。`);
            return;
          }
        } else {
          // 非overlay和vertical模式，直接设置
          this.displayMode = mode;
        }
        
        // 当选择垂直叠加时，自动切换到李萨如图模式
        if (mode === 'vertical') {
          this.switchMode('lissajous');
        } else if (this.currentMode === 'lissajous' && mode !== 'vertical') {
          // 从垂直叠加切换回其他模式时，自动切换回波形模式
          this.switchMode('wave');
        }
        
        this.needsRedraw = true;
        this.refreshDisplay();
      }
    }
  }
});


