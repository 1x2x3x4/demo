/**
 * TourGuide 组件入口文件
 * 将此文件引入到HTML中即可使用TourGuide功能
 */

// 加载CSS
const link = document.createElement('link');
link.rel = 'stylesheet';
link.href = 'TourGuide/tourGuide.css';
document.head.appendChild(link);

// 修改延迟初始化部分
document.addEventListener('DOMContentLoaded', async () => {
  // 首先加载脚本作为模块
  const script = document.createElement('script');
  script.type = 'module';
  script.textContent = `
    import TourGuide from './TourGuide/tourGuide.js';

    // 检查是否是首次打开页面（通过localStorage）
    const firstVisit = localStorage.getItem('oscFirstVisit');
    const lastVersion = localStorage.getItem('oscVersion');
    const currentVersion = '1.2.0'; // 当前系统版本
    
    // 首次访问或版本升级时显示引导
    if (firstVisit === null || lastVersion !== currentVersion) {
      // 标记为已访问且更新版本
      localStorage.setItem('oscFirstVisit', 'false');
      localStorage.setItem('oscVersion', currentVersion);
      
      // 延迟启动引导，确保页面元素完全加载
      setTimeout(async () => {
        try {
      const guide = await TourGuide.from();
          guide.start();
        } catch (err) {
          console.error('引导启动失败:', err);
        }
      }, 1500);
    }
    
    // 导出全局实例创建方法
    window.createTourGuide = async () => {
      const guide = await TourGuide.from();
      return guide;
    };
  `;
  document.head.appendChild(script);
  
  // 增强帮助按钮功能
  const helpButton = document.createElement('button');
  helpButton.id = 'help-button';
  helpButton.innerHTML = '引导教程';
  helpButton.className = 'help-button';
  helpButton.title = '查看示波器操作引导';
  helpButton.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    z-index: 9990;
    padding: 8px 16px;
    background-color: #4CAF50;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
    box-shadow: 0 2px 5px rgba(0,0,0,0.3);
    transition: all 0.3s ease;
  `;
  
  helpButton.addEventListener('mouseover', () => {
    helpButton.style.backgroundColor = '#3d8b40';
    helpButton.style.transform = 'translateY(-2px)';
  });
  
  helpButton.addEventListener('mouseout', () => {
    helpButton.style.backgroundColor = '#4CAF50';
    helpButton.style.transform = 'translateY(0)';
  });
  
  helpButton.addEventListener('click', async () => {
    // 滚动到顶部
    window.scrollTo(0, 0);
    
    // 获取Vue实例并全面重置所有状态
    const app = document.querySelector('#app')?.__vue__;
    if (app) {
      // 全面重置应用状态
      app.setExpStep('calibration');
      
      // 重置分度值和位置
      app.timeDiv = 1;
      app.voltsDiv = { 1: 1, 2: 1 };
      app.horizontalPosition = 0;
      app.verticalPosition = { 1: 0, 2: 0 };
      
      // 重置滑块值
      app.displayAdjustFactors = {
        time: 1.0,
        volts: { 1: 1.0, 2: 1.0 }
      };
      
      // 重置触发电平
      app.triggerLevel = 0;
      
      // 刷新显示
      if (typeof app.refreshDisplay === 'function') {
        app.refreshDisplay();
      }
      
      // 等待DOM更新
      setTimeout(async () => {
        const guide = await window.createTourGuide();
        guide.start();
      }, 100);
    } else {
      // 如果找不到Vue实例，直接启动引导
      const guide = await window.createTourGuide();
      guide.start();
    }
  });
  
  document.body.appendChild(helpButton);
});

// 向后兼容的API
window.TourGuideLoader = { 
  init: function() {
    console.log('使用新API: const guide = await window.createTourGuide(); guide.start();');
  } 
};
