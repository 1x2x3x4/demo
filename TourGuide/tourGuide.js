/**
 * TourGuide - 引导组件
 * 一个轻量级的引导组件，用于创建交互式引导教程
 */

export default class TourGuide {
  constructor(config) {
    this.steps          = config || [];
    this.index          = 0;
    this.overlayEl      = null;   // 根容器
    this.popEl          = null;   // .introduce-box
    this.titleEl        = null;
    this.descEl         = null;
    this.cloneEl        = null;   // 高亮克隆
    this.maskEl         = null;   // 蒙版元素
    this.DISTANCE       = 16;
    this.VW             = window.innerWidth  || document.documentElement.clientWidth;
    this.VH             = window.innerHeight || document.documentElement.clientHeight;
  }

  /* ---------- public ---------- */
  static async from(url = 'TourGuide/config.json') {
    const json = await fetch(url).then(r => r.json());
    return new TourGuide(json);
  }
  start()  { this.#render().#goto(0); }
  next()   { this.#goto(this.index + 1); }
  prev()   { this.#goto(this.index - 1); }
  skip()   { this.#destroy(); }

  /* ---------- private ---------- */
  #goto(i) {
    if (i < 0 || !this.steps[i]) return this.#destroy();
    
    // 清理当前高亮，确保在切换步骤前移除
    this.#clearHighlight();
    
    this.index = i;
    const step = this.steps[i];

    // 更新文案
    this.titleEl.textContent = step.title;
    this.descEl.innerHTML = step.content;

    // 定位 - 检查配置中是否有自定义位置
    const target = document.querySelector(step.target);
    
    if (step.position) {
      // 使用自定义位置
      this.#place(step.position.left, step.position.top);
      
      // 高亮处理
      if (!!step.clip && target) {
        // 检查是否有自定义高亮区域
        if (step.highlight) {
          this.#highlight(step.highlight);
        } else {
          const rect = target.getBoundingClientRect();
          this.#highlight(rect);
        }
      } else {
        this.overlayEl.style.background = 'none';
      }
    } else {
      // 使用自动计算位置
      target && step.click && target.click();
      
      // 添加这段代码 - 如果需要滚动，增加延迟
      if (target && !this.#inViewport(target)) {
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // 延迟定位，等待滚动完成
        setTimeout(() => {
          this.#position(target, !!step.clip);
        }, 500);
        return; // 提前返回，避免立即调用#position
      }
      
      this.#position(target, !!step.clip);
    }

    // 更新按钮
    const isLast = i === this.steps.length - 1;
    const isFirst = i === 0;
    this.overlayEl.querySelector('.next').textContent = isLast ? '完成' : '下一步';
    this.overlayEl.querySelector('.exit').style.display = isLast ? 'none' : '';
    this.overlayEl.querySelector('.prev').style.display = isFirst ? 'none' : '';

    // 处理特殊情况
    this.#handleSpecialCases(step);
  }

  #position(target, needClip, customHighlight) {
    // 清理上一步的高亮
    this.#clearHighlight();

    // 中心显示（找不到元素）
    if (!target) return this.#place(this.VW/2, this.VH/2);

    // 滚动到视口
    if (!this.#inViewport(target)) {
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    const rect = target.getBoundingClientRect();
    const pop  = this.popEl.getBoundingClientRect();

    const space = {
      left  : rect.left,
      right : this.VW - rect.right,
      top   : rect.top,
      bottom: this.VH - rect.bottom
    };

    let top = rect.top;
    let left;

    if (space.left >= pop.width || space.right >= pop.width) {
      const putRight = rect.x + rect.width/2 < this.VW/2 && space.right >= pop.width;
      left = putRight ? rect.right + this.DISTANCE
                      : rect.left  - pop.width - this.DISTANCE;
    } else if (space.bottom >= pop.height) {
      top  = rect.bottom + this.DISTANCE;
      left = Math.min(Math.max(this.DISTANCE, rect.left),
                      this.VW - pop.width - this.DISTANCE);
    } else {
      top  = this.VH - pop.height - this.DISTANCE;
      left = this.VW - pop.width  - this.DISTANCE;
    }

    this.#place(left, top);

    // 高亮蒙层
    if (needClip) {
      if (customHighlight) {
        this.#highlight(customHighlight);
      } else {
        this.#highlight(rect);
      }
    }
  }

  #place(l, t) {
    this.popEl.style.left = Math.max(this.DISTANCE,
                          Math.min(l, this.VW - this.popEl.offsetWidth  - this.DISTANCE)) + 'px';
    this.popEl.style.top  = Math.max(this.DISTANCE,
                          Math.min(t, this.VH - this.popEl.offsetHeight - this.DISTANCE)) + 'px';
  }

  #clearHighlight() {
    // 移除之前的高亮和蒙版
    this.cloneEl?.remove();
    this.cloneEl = null;
    
    if (this.maskEl) {
      this.maskEl.remove();
      this.maskEl = null;
    }
  }

  #highlight(rectOrConfig) {
    // 创建蒙版效果
    this.maskEl = document.createElement('div');
    this.maskEl.className = 'tour-guide-mask';
    document.body.appendChild(this.maskEl);
    
    let highlightRect;
    
    // 确定高亮区域的位置和大小
    if (typeof rectOrConfig === 'object') {
      // 处理所有可能的坐标属性情况
      highlightRect = {
        left: rectOrConfig.left !== undefined ? rectOrConfig.left : (rectOrConfig.x || 0),
        top: rectOrConfig.top !== undefined ? rectOrConfig.top : (rectOrConfig.y || 0),
        width: rectOrConfig.width || 100,
        height: rectOrConfig.height || 100
      };
    } else {
      // 默认位置
      highlightRect = {
        left: this.VW / 2 - 50,
        top: this.VH / 2 - 50,
        width: 100,
        height: 100
      };
    }
    
    // 创建唯一ID避免冲突
    const maskId = `tour-mask-${Date.now()}`;
    
    // 设置蒙版的SVG，创建中间透明的效果
    const maskHTML = `
      <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <mask id="${maskId}">
            <rect width="100%" height="100%" fill="white"/>
            <rect x="${highlightRect.left}" y="${highlightRect.top}" 
                  width="${highlightRect.width}" height="${highlightRect.height}" 
                  rx="4" ry="4" fill="black"/>
          </mask>
        </defs>
        <rect width="100%" height="100%" fill="rgba(0,0,0,0.5)" mask="url(#${maskId})"/>
      </svg>
    `;
    
    this.maskEl.innerHTML = maskHTML;
    
    // 创建高亮边框
    this.cloneEl = document.createElement('div');
    Object.assign(this.cloneEl.style, {
      position: 'fixed',
      top: highlightRect.top + 'px',
      left: highlightRect.left + 'px',
      width: highlightRect.width + 'px',
      height: highlightRect.height + 'px',
      border: '1px solid #1a73e8',
      borderRadius: '4px',
      boxShadow: '0 0 0 4px rgba(26, 115, 232, 0.3)',
      zIndex: 10000,
      pointerEvents: 'none'
    });
    document.body.appendChild(this.cloneEl);
  }

  #render() {
    const tpl = document.createElement('div');
    tpl.innerHTML = `
      <div id="introduce" style="position:fixed;inset:0;">
        <div class="introduce-box">
          <p class="introduce-title"></p>
          <p class="introduce-desc"></p>
          <div class="introduce-operate">
            <button class="exit">跳过</button>
            <button class="prev">上一步</button>
            <button class="next">下一步</button>
          </div>
        </div>
      </div>`;
    this.overlayEl = tpl.firstElementChild;
    document.body.prepend(this.overlayEl);

    // 缓存节点
    this.popEl   = this.overlayEl.querySelector('.introduce-box');
    this.titleEl = this.overlayEl.querySelector('.introduce-title');
    this.descEl  = this.overlayEl.querySelector('.introduce-desc');

    // 事件
    this.overlayEl.querySelector('.next').onclick = () => this.next();
    this.overlayEl.querySelector('.prev').onclick = () => this.prev();
    this.overlayEl.querySelector('.exit').onclick = () => this.skip();

    return this;
  }

  #inViewport(el) {
    const r = el.getBoundingClientRect();
    return r.top >= 0 && r.left >= 0 && r.right <= this.VW && r.bottom <= this.VH;
  }

  #destroy() {
    this.#clearHighlight();
    this.overlayEl?.remove();
    
    // 添加引导结束时的状态还原
    this.#resetAppState();
  }

  #resetAppState() {
    const app = document.querySelector('#app')?.__vue__;
    if (!app) return;
    
    // 重置到初始校准模式
    app.setExpStep('calibration');
    
    // 重置波形参数
    if (app.signalType !== 'sine') {
      app.setSignalType('sine');
    }
    
    // 重置通道状态
    app.$set(app.inputActive, 1, false);
    app.$set(app.inputActive, 2, false);
    
    // 重置显示模式
    app.displayMode = 'independent';
    
    // 重置时间和电压分度值
    app.timeDiv = 1;
    app.voltsDiv = { 1: 1, 2: 1 };
    
    // 重置位置控制
    app.horizontalPosition = 0;
    app.verticalPosition = { 1: 0, 2: 0 };
    
    // 重置峰值和频率
    app.peakValues = { 1: 1, 2: 1 };
    app.frequencies = { 1: 1, 2: 1 };
    
    // 重置触发系统
    app.triggerLevel = 0;
    
    // 确保系统处于运行状态
    if (!app.isRunning) {
      app.toggleRunning();
    }
    
    // 刷新显示
    app.needsRedraw = true;
    if (typeof app.refreshDisplay === 'function') {
      app.refreshDisplay();
    }
  }

  #handleSpecialCases(step) {
    const app = document.querySelector('#app')?.__vue__;
    if (!app) return;
    
    // 准备通道开启的辅助函数
    const prepareChannels = () => {
      // 确保至少一个通道开启，以便看到波形
      if (!app.inputActive[1] && !app.inputActive[2]) {
        app.toggleInput(1);
      }
    };
    
    // 基于目标元素执行特定操作
    switch (step.target) {
      // 自检校准相关
      case '.calibration-panel':
      case '.slider-container':
        if (app.expStep !== 'calibration') {
          app.setExpStep('calibration');
        }
        prepareChannels();
        break;
        
      // 标准测量相关
      case '.wave-select':
      case '.parameter-control':
      case '.display-mode-switcher':
        if (app.expStep !== 'normal') {
          app.setExpStep('normal');
        }
        prepareChannels();
        break;
        
      // 李萨如图形相关
      case "#lissajous-mode-btn":
        if (app.expStep !== 'normal') {
          app.setExpStep('normal');
        }
        // 确保两个通道都开启
        if (!app.inputActive[1]) app.toggleInput(1);
        if (!app.inputActive[2]) app.toggleInput(2);
        
        // 点击按钮
        const lissajousBtn = document.querySelector('#lissajous-mode-btn');
        if (lissajousBtn) {
          lissajousBtn.click();
          
          // 延迟重新计算高亮区域
          setTimeout(() => {
            const updatedTarget = document.querySelector(step.target);
            if (updatedTarget) {
              this.#clearHighlight();
              const rect = updatedTarget.getBoundingClientRect();
              this.#highlight(rect);
            }
          }, 10);
        }
        break;
    }
    
    // 如果引导页面提到了某个特定参数，可以自动调整该参数
    if (step.content.includes('频率比') && step.content.includes('1:2')) {
      if (app.frequencies) {
        app.frequencies[1] = 1;
        app.frequencies[2] = 2;
        app.needsRedraw = true;
      }
    }
  }
}

// 为了向后兼容，保留原有的非模块化引用方式
window.TourGuide = {
  init: async function() {
    const guide = await TourGuide.from();
    guide.start();
  }
};

// 页面加载完成后自动初始化
document.addEventListener('DOMContentLoaded', function() {
  // 检查是否有自动启动标记
  const autoStart = localStorage.getItem('tourGuideAutoStart');
  if (autoStart === 'true' || autoStart === null) {
    setTimeout(async () => {
      const guide = await TourGuide.from();
      guide.start();
    }, 1000); // 延迟1秒启动，确保页面元素加载完成
  }
});
