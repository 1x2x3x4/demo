/**
 * WaveformUtilities.js
 * 波形绘制工具函数和常量
 */
window.WaveformUtilities = {
  // 使用全局常量
  CONSTANTS: OscilloscopeConstants,
  
  // 通道颜色
  CHANNEL_COLORS: {
    1: OscilloscopeConstants.COLORS.CHANNEL_1,
    2: OscilloscopeConstants.COLORS.CHANNEL_2
  },

  // 工具函数
  drawGrid(ctx) {
    const { GRID, CANVAS, COLORS } = OscilloscopeConstants;
    
    // 绘制背景
    ctx.fillStyle = COLORS.BACKGROUND;
    ctx.fillRect(0, 0, CANVAS.WIDTH, CANVAS.HEIGHT);
    
    // 设置网格线样式
    ctx.strokeStyle = COLORS.GRID;
    ctx.lineWidth = 0.5;
    
    // 绘制垂直线
    for (let i = 0; i <= GRID.HORIZONTAL_DIVS; i++) {
      const x = (i * CANVAS.WIDTH) / GRID.HORIZONTAL_DIVS;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, CANVAS.HEIGHT);
      ctx.stroke();
    }
    
    // 绘制水平线
    for (let i = 0; i <= GRID.VERTICAL_DIVS; i++) {
      const y = (i * CANVAS.HEIGHT) / GRID.VERTICAL_DIVS;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(CANVAS.WIDTH, y);
      ctx.stroke();
    }
  },

  calculateVoltage(waveType, phaseVal, amplitude) {
    switch (waveType) {
      case 'sine':
        return amplitude * Math.sin(phaseVal);
      case 'square':
        return amplitude * Math.sign(Math.sin(phaseVal));
      case 'triangle':
        return amplitude * (2 * Math.abs((phaseVal % OscilloscopeConstants.MATH.TWO_PI) / OscilloscopeConstants.MATH.TWO_PI - 0.5) - 1);
      case 'sawtooth':
        return amplitude * (((phaseVal % OscilloscopeConstants.MATH.TWO_PI) / OscilloscopeConstants.MATH.TWO_PI) * 2 - 1);
      case 'pulse':
        return amplitude * (Math.sin(phaseVal) > 0.7 ? 1 : -1);
      case 'noise':
        return amplitude * (Math.random() * 2 - 1);
      default:
        return 0;
    }
  },

  calculateEffectiveFactor(useCalibration, calibrationFactor, displayAdjustFactors) {
    if (!useCalibration) return 1.0;
    return calibrationFactor * (displayAdjustFactors?.time || 1.0);
  },

  calculateEffectiveVoltsDiv(useCalibration, voltsDiv, line, calibrationFactor, displayAdjustFactors) {
    if (!useCalibration) return voltsDiv[line];
    const voltAdjustFactor = displayAdjustFactors?.volts?.[line] || 1.0;
    return voltsDiv[line] * calibrationFactor * voltAdjustFactor;
  },

  calculateCenterY(displayMode, line, canvasHeight, verticalOffset) {
    if (displayMode === 'overlay') {
      return canvasHeight / 2 + verticalOffset;
    }
    return line === 1 ? 
      canvasHeight / 4 + verticalOffset : 
      (3 * canvasHeight) / 4 + verticalOffset;
  },

  clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }
}; 