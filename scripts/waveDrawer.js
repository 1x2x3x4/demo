window.WaveDrawer = (function() {
  // 绘制网格（使用共享工具模块）
  function drawGrid(ctx) {
    // 使用共享工具函数绘制网格
    WaveformUtilities.drawGrid(ctx);
  }

  // 绘制波形（参考物理示波器的真实显示原理）
  function drawWave(ctx, params) {
    try {
      const { 
        line, color, expStep, signalType, calibrationParams, timeDiv, 
        frequencies, peakValues, voltsDiv, phase, displayAdjustFactors, calibrationFactor,
        horizontalPosition, verticalPosition, displayMode, phaseDiff
      } = params;

      // 使用共享常量
      const { CONSTANTS } = WaveformUtilities;
      const horizontalDivCount = CONSTANTS.GRID.HORIZONTAL_DIV;
      const verticalDivCount = CONSTANTS.GRID.VERTICAL_DIV;
      const canvasWidth = CONSTANTS.CANVAS.WIDTH;
      const canvasHeight = CONSTANTS.CANVAS.HEIGHT;
      
      // 确定波形类型和参数
      const useCalibration = expStep === 'calibration';
      let waveType = useCalibration ? calibrationParams.waveTypes[line] : signalType;
      
      // 确定真实频率和振幅
      const frequency = useCalibration ? calibrationParams.frequencies[line] : frequencies[line];
      const amplitude = useCalibration ? calibrationParams.peakValues[line] / 2 : peakValues[line] / 2;
      
      // 使用通用函数计算有效调整因子
      const effectiveTimeDiv = timeDiv * WaveformUtilities.calculateEffectiveFactor(
        useCalibration, calibrationFactor, displayAdjustFactors
      );
      
      // 使用通用函数计算有效电压分度值
      const effectiveVoltsDiv = WaveformUtilities.calculateEffectiveVoltsDiv(
        useCalibration, voltsDiv, line, calibrationFactor, displayAdjustFactors
      );
      
      // 1) 计算屏幕总时间(秒) = timeDiv × 横向总格数
      const totalTime = effectiveTimeDiv * horizontalDivCount;
      
      // 2) 每像素对应的时间 dt (秒/像素)
      const dt = totalTime / canvasWidth;
      
      // 3) 纵向像素与电压的比例
      const pxPerVolt = (canvasHeight / verticalDivCount) / effectiveVoltsDiv;
      
      // 垂直位置偏移，一个分度值对应50像素
      const verticalOffset = verticalPosition * CONSTANTS.GRID.SIZE;
      
      // 使用通用函数计算中心Y坐标
      const centerY = WaveformUtilities.calculateCenterY(displayMode, line, canvasHeight, verticalOffset);
      
      // 通道2增加相位偏移
      const phaseOffsetDegrees = line === 2 ? phaseDiff || 0 : 0;
      const phaseOffsetRadians = (phaseOffsetDegrees * Math.PI) / 180;
      const globalPhase = phase + phaseOffsetRadians;

      // 水平位置偏移，单位：秒，一个分度值对应50像素，对应实际时间
      const horizontalOffsetSeconds = horizontalPosition * timeDiv;
      
      // 开始绘制
      ctx.beginPath();
      ctx.strokeStyle = color || WaveformUtilities.CHANNEL_COLORS[line];
      ctx.lineWidth = 2.5;

      for (let x = 0; x < canvasWidth; x++) {
        // 当前像素对应的物理时间 t(秒)，应用水平位置偏移
        const t = x * dt - horizontalOffsetSeconds;
        // 波形相位(弧度) = 2π f t + 额外相位
        const phaseVal = CONSTANTS.MATH.TWO_PI * frequency * t + globalPhase;
        
        // 使用共享工具函数计算电压值
        let yVolts = WaveformUtilities.calculateVoltage(waveType, phaseVal, amplitude);
        
        // 电压 -> 像素 (1V=pxPerVolt 像素)，并且 Y 轴中心在 centerY
        const yPixel = centerY - (yVolts * pxPerVolt);
        
        if (x === 0) {
          ctx.moveTo(x, yPixel);
        } else {
          ctx.lineTo(x, yPixel);
        }
      }
      
      ctx.stroke();
    } catch (error) {
      console.error('Wave drawing failed:', error);
    }
  }

  // 绘制触发电平线（1伏=40像素，中心200像素）
  function drawTriggerLevel(ctx, triggerLevelPosition) {
    try {
      const y = triggerLevelPosition;
      ctx.beginPath();
      ctx.strokeStyle = '#FFEB3B';
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 3]);
      ctx.moveTo(0, y);
      ctx.lineTo(WaveformUtilities.CONSTANTS.CANVAS.WIDTH, y);
      ctx.stroke();
      ctx.setLineDash([]);
    } catch (error) {
      console.error('Trigger level drawing failed:', error);
    }
  }

  // 根据触发电平调整相位，使波形稳定
  function adjustPhaseForTrigger(params) {
    const { 
      triggerActive, triggerSource, inputActive, voltsDiv, peakValues, 
      frequencies, timeDiv, expStep, calibrationParams, signalType, phase, 
      triggerLevel, triggerSlope, displayAdjustFactors, calibrationFactor 
    } = params;

    if (!triggerActive) return phase;
    
    // 早退出优化
    const actualChannel = inputActive[triggerSource] ? 
      triggerSource : (inputActive[1] ? 1 : 2);
    
    // 获取波形类型和参数
    const useCalibration = expStep === 'calibration';
    const waveType = useCalibration ? 
      calibrationParams.waveTypes[actualChannel] : signalType;
    const frequency = useCalibration ? 
      calibrationParams.frequencies[actualChannel] : frequencies[actualChannel];
    const amplitude = useCalibration ? 
      calibrationParams.peakValues[actualChannel] / 2 : peakValues[actualChannel] / 2;

    // 获取显示调整因子（使用通用函数）
    const voltAdjustFactor = displayAdjustFactors ? 
      calibrationFactor * displayAdjustFactors.volts[actualChannel] : calibrationFactor;
      
    // 每分度对应的像素
    const pxPerVolt = (WaveformUtilities.CONSTANTS.GRID.SIZE / voltsDiv[actualChannel]) * voltAdjustFactor;
    
    // 在触发点附近检查波形
    const checkPoint = 0.25; // 检查波形的位置
    const phaseOffset = actualChannel === 2 ? Math.PI / 2 : 0;
    const phaseVal = WaveformUtilities.CONSTANTS.MATH.TWO_PI * frequency * checkPoint + phase + phaseOffset;
    const nextPhaseVal = phaseVal + 0.1;
    
    // 计算当前点和下一点的电压值
    const voltage = WaveformUtilities.calculateVoltage(waveType, phaseVal, amplitude);
    const nextVoltage = WaveformUtilities.calculateVoltage(waveType, nextPhaseVal, amplitude);
    
    // 转换为像素值
    const waveValue = voltage * pxPerVolt;
    const nextValue = nextVoltage * pxPerVolt;
    
    // 检测斜率
    const isRising = nextValue > waveValue;
    const matchesSlope = (triggerSlope === 'rising' && isRising) || 
                         (triggerSlope === 'falling' && !isRising);
    
    const triggerValue = triggerLevel * pxPerVolt;
    
    // 如果波形接近触发电平且斜率匹配，稳定显示
    if (Math.abs(waveValue - triggerValue) < 5 && matchesSlope) {
      // 调整相位以使触发点保持稳定
      return phase % (WaveformUtilities.CONSTANTS.MATH.TWO_PI);
    }
    
    return phase;
  }

  // 绘制同向叠加波形
  function drawOverlayWave(ctx, params) {
    try {
      const { 
        expStep, signalType, calibrationParams, timeDiv, 
        frequencies, peakValues, voltsDiv, phase, 
        displayAdjustFactors, calibrationFactor,
        horizontalPosition, verticalPosition, inputActive, phaseDiff
      } = params;

      // 使用共享常量和颜色
      const { CONSTANTS, CHANNEL_COLORS } = WaveformUtilities;
      const horizontalDivCount = CONSTANTS.GRID.HORIZONTAL_DIV;
      const verticalDivCount = CONSTANTS.GRID.VERTICAL_DIV;
      const canvasWidth = CONSTANTS.CANVAS.WIDTH;
      const canvasHeight = CONSTANTS.CANVAS.HEIGHT;
      
      // 清空当前画布内容
      ctx.clearRect(0, 0, canvasWidth, canvasHeight);
      
      // 绘制背景网格
      drawGrid(ctx);
      
      // 存储活跃通道
      const activeChannels = [];
      if (inputActive[1]) activeChannels.push(1);
      if (inputActive[2]) activeChannels.push(2);
      
      // 如果没有活跃通道，直接返回
      if (activeChannels.length === 0) return;
      
      // 计算每个通道的参数
      const channelParams = {};
      const useCalibration = expStep === 'calibration';
      
      activeChannels.forEach(line => {
        // 使用通用函数计算调整因子
        channelParams[line] = {
          waveType: useCalibration ? calibrationParams.waveTypes[line] : signalType,
          frequency: useCalibration ? calibrationParams.frequencies[line] : frequencies[line],
          amplitude: useCalibration ? calibrationParams.peakValues[line] / 2 : peakValues[line] / 2,
          voltsDiv: voltsDiv[line],
          verticalOffset: (verticalPosition ? verticalPosition[line] || 0 : 0) * CONSTANTS.GRID.SIZE,
          phaseOffset: line === 2 ? (phaseDiff || 0) * Math.PI / 180 : 0
        };
      });
      
      // 然后绘制叠加波形
      if (activeChannels.length > 0) {
        // 确定基准电压分度值（使用所有通道中的最大值）
        const baseVoltsDiv = Math.max(...activeChannels.map(line => voltsDiv[line]));
        
        // 绘制叠加波形
        drawSummedWaveform(ctx, activeChannels, channelParams, CHANNEL_COLORS.OVERLAY, 
                         canvasWidth, canvasHeight, horizontalDivCount, verticalDivCount,
                         timeDiv, phase, horizontalPosition, baseVoltsDiv, calibrationFactor, 
                         displayAdjustFactors, useCalibration);
      }
      
      // 在同向叠加模式下，显示频率和初相差信息
      if (activeChannels.length === 2) {
        // 添加信息面板
        drawInfoPanel(ctx, channelParams, phaseDiff, CHANNEL_COLORS);
      }
    } catch (error) {
      console.error('Overlay wave drawing failed:', error);
    }
  }
  
  // 辅助函数：绘制信息面板
  function drawInfoPanel(ctx, channelParams, phaseDiff, colors) {
    ctx.font = '14px Arial';
    ctx.textAlign = 'right';
    
    // 添加简单半透明背景
    ctx.fillStyle = 'rgba(0, 0, 0, 0)';
    ctx.fillRect(650, 10, 140, 70);
    
    // 显示频率信息
    ctx.fillStyle = colors[1]; 
    ctx.fillText(`CH1: ${channelParams[1].frequency}Hz`, 780, 30);
    
    ctx.fillStyle = colors[2]; 
    ctx.fillText(`CH2: ${channelParams[2].frequency}Hz`, 780, 50);
    
    // 显示初相差信息
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(`初相差: ${phaseDiff}°`, 780, 70);
  }
  
  // 辅助函数：绘制叠加波形（真正的数学叠加）
  function drawSummedWaveform(ctx, channels, channelParams, color, canvasWidth, canvasHeight, 
                            horizontalDivCount, verticalDivCount, timeDiv, phase, horizontalPosition, 
                            baseVoltsDiv, calibrationFactor, displayAdjustFactors, useCalibration) {
    // 计算时间因子
    const twoPI = WaveformUtilities.CONSTANTS.MATH.TWO_PI;
    const effectiveTimeDiv = timeDiv * WaveformUtilities.calculateEffectiveFactor(
      useCalibration, calibrationFactor, displayAdjustFactors
    );
    const totalTime = effectiveTimeDiv * horizontalDivCount;
    const dt = totalTime / canvasWidth;
    
    // 使用基准电压分度值计算像素比例
    const pxPerVolt = (canvasHeight / verticalDivCount) / baseVoltsDiv;
    
    // 中心Y坐标（使用画布中心，不考虑各通道的垂直偏移）
    const centerY = canvasHeight / 2;
    
    // 水平位置偏移
    const horizontalOffsetSeconds = horizontalPosition * timeDiv;
    
    // 开始绘制
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.0;
    ctx.globalAlpha = 1.0;
    
    for (let x = 0; x < canvasWidth; x++) {
      // 当前像素对应的时间
      const t = x * dt - horizontalOffsetSeconds;
      
      // 计算在此时间点所有通道的叠加电压值
      let summedVoltage = 0;
      
      channels.forEach(line => {
        const { waveType, frequency, amplitude, phaseOffset } = channelParams[line];
        
        // 计算该通道在此时间点的相位和电压值
        const adjustedPhase = phase + phaseOffset;
        const phaseVal = twoPI * frequency * t + adjustedPhase;
        
        // 计算该通道的电压值并累加
        const channelVoltage = WaveformUtilities.calculateVoltage(waveType, phaseVal, amplitude);
        summedVoltage += channelVoltage;
      });
      
      // 电压 -> 像素
      const yPixel = centerY - (summedVoltage * pxPerVolt);
      
      if (x === 0) {
        ctx.moveTo(x, yPixel);
      } else {
        ctx.lineTo(x, yPixel);
      }
    }
    
    ctx.stroke();
  }

  // 辅助函数：根据波形类型计算电压值 - 使用共享模块
  function calculateVoltage(waveType, phaseVal, amplitude) {
    return WaveformUtilities.calculateVoltage(waveType, phaseVal, amplitude);
  }

  /**
   * 更新波形类型和设置
   * @param {Object} renderParams - 渲染参数和设置
   * @param {string} waveType - 波形类型
   * @returns {Object} - 更新后的渲染参数
   */
  function updateWaveformType(renderParams, waveType) {
    // 验证波形类型
    const validTypes = ['sine', 'square', 'triangle', 'sawtooth', 'pulse', 'noise'];
    const type = validTypes.includes(waveType) ? waveType : 'sine';
    
    // 更新渲染参数中的波形类型
    renderParams.signalType = type;
    
    // 标记需要重绘
    renderParams.needsRedraw = true;
    
    return renderParams;
  }
  
  /**
   * 重置触发系统设置
   * @param {Object} triggerSettings - 触发系统设置
   * @returns {Object} - 重置后的触发系统设置
   */
  function resetTriggerSystem(triggerSettings) {
    return WaveformUtilities.resetTriggerSystem(triggerSettings);
  }
  
  /**
   * 切换触发斜率
   * @param {string} currentSlope - 当前触发斜率
   * @returns {string} - 新的触发斜率
   */
  function toggleTriggerSlope(currentSlope) {
    return WaveformUtilities.toggleTriggerSlope(currentSlope);
  }
  
  /**
   * 调整时间和电压分度值
   * @param {Object} settings - 当前设置
   * @param {string} paramType - 参数类型 ('timeDiv', 'voltsDiv')
   * @param {number} step - 调整步长
   * @param {number} [channel] - 通道号（仅用于电压调整）
   * @returns {Object} - 更新后的设置
   */
  function adjustScopeSettings(settings, paramType, step, channel) {
    const result = { ...settings };
    
    switch (paramType) {
      case 'timeDiv':
        result.timeDiv = WaveformUtilities.clamp(settings.timeDiv + step, 0.1, 100);
        result.timeDiv = Number(result.timeDiv.toFixed(1));
        break;
      case 'voltsDiv':
        if (channel) {
          result.voltsDiv = { ...settings.voltsDiv };
          result.voltsDiv[channel] = WaveformUtilities.clamp(settings.voltsDiv[channel] + step, 0.1, 10);
          result.voltsDiv[channel] = Number(result.voltsDiv[channel].toFixed(2));
        }
        break;
      case 'freqX':
        result.freqX = Math.max(0.1, settings.freqX + step);
        break;
      case 'freqY':
        result.freqY = Math.max(0.1, settings.freqY + step);
        break;
      case 'phaseDiff':
        result.phaseDiff = (settings.phaseDiff + step + 360) % 360;
        break;
    }
    
    result.needsRedraw = true;
    return result;
  }
  
  /**
   * 验证输入参数是否在有效范围内
   * @param {Object} settings - 当前设置
   * @param {string} type - 参数类型 ('time', 'volts')
   * @param {number} [channel] - 通道号（仅用于电压）
   * @returns {Object} - 验证并调整后的设置
   */
  function validateInputSettings(settings, type, channel) {
    const result = { ...settings };
    
    if (type === 'time') {
      result.timeDiv = WaveformUtilities.clamp(settings.timeDiv, 0.1, 100);
      result.timeDiv = Number(result.timeDiv.toFixed(1));
    } else if (type === 'volts' && channel) {
      // 确保输入是有效数字
      if (isNaN(settings.voltsDiv[channel]) || settings.voltsDiv[channel] === null) {
        result.voltsDiv = { ...settings.voltsDiv };
        result.voltsDiv[channel] = 1; // 恢复为默认值
      } else {
        // 限制在有效范围内
        result.voltsDiv = { ...settings.voltsDiv };
        result.voltsDiv[channel] = WaveformUtilities.clamp(settings.voltsDiv[channel], 0.1, 10);
        result.voltsDiv[channel] = Number(result.voltsDiv[channel].toFixed(2));
      }
    }
    
    result.needsRedraw = true;
    return result;
  }

  // 返回公开的API
  return {
    drawGrid,
    drawWave,
    drawTriggerLevel,
    drawOverlayWave,
    adjustPhaseForTrigger,
    calculateVoltage,
    // 新增的功能性方法
    updateWaveformType,
    resetTriggerSystem,
    toggleTriggerSlope,
    adjustScopeSettings,
    validateInputSettings
  };
})();
