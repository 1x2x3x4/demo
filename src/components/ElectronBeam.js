import * as THREE from 'three';
import { CONFIG } from '../config';

/**
 * 电子束类
 * 负责处理电子束的路径和显示
 */
export class ElectronBeam {
  /**
   * 构造函数
   * @param {THREE.Scene} scene - Three.js场景
   */
  constructor(scene) {
    this.scene = scene;
    this.beamLine = null;
    this.beamPoints = [];
    this.tracePoints = [];
    this.traceLines = [];
    
    // 电子束材质
    this.beamMaterial = new THREE.LineBasicMaterial({
      color: CONFIG.beam.color,
      opacity: CONFIG.beam.intensity,
      transparent: true
    });
    
    // 轨迹材质（淡一些）
    this.traceMaterial = new THREE.LineBasicMaterial({
      color: CONFIG.beam.color,
      opacity: CONFIG.electronBeam.trace.opacity,
      transparent: true
    });
    
    // 初始化电子束
    this.initBeam();
  }
  
  /**
   * 初始化电子束
   */
  initBeam() {
    // 默认电子束路径点
    this.beamPoints = CONFIG.electronBeam.pathPoints.map(point => 
      new THREE.Vector3(point.x, point.y, point.z)
    );
    
    // 创建电子束几何体和线条
    const beamGeometry = new THREE.BufferGeometry().setFromPoints(this.beamPoints);
    this.beamLine = new THREE.Line(beamGeometry, this.beamMaterial);
    this.scene.add(this.beamLine);
  }
  
  /**
   * 更新电子束路径
   * @param {Object} deflection - 偏转参数
   */
  updateBeamPath(deflection) {
    // 计算偏转量
    const verticalDeflection = deflection.vertical.voltage * (CONFIG.deflection.vertical.maxDeflection / 5);
    const horizontalDeflection = deflection.horizontal.voltage * (CONFIG.deflection.horizontal.maxDeflection / 5);
    
    // 更新路径点
    this.beamPoints[0] = new THREE.Vector3(-2.7, 0, 0);  // 电子枪出口（固定）
    this.beamPoints[1] = new THREE.Vector3(-1.5, verticalDeflection * 0.3, 0);  // 垂直偏转板出口（轻微偏转）
    this.beamPoints[2] = new THREE.Vector3(-0.2, verticalDeflection, horizontalDeflection * 0.3);  // 水平偏转板出口
    this.beamPoints[3] = new THREE.Vector3(3, verticalDeflection, horizontalDeflection);  // 荧光屏（完全偏转）
    
    // 更新几何体
    const beamGeometry = new THREE.BufferGeometry().setFromPoints(this.beamPoints);
    this.beamLine.geometry.dispose();
    this.beamLine.geometry = beamGeometry;
    
    // 更新材质颜色和强度
    this.beamMaterial.color.set(CONFIG.beam.color);
    this.beamMaterial.opacity = CONFIG.beam.intensity;
    
    // 记录轨迹点（只记录打在荧光屏上的点）
    this.addTracePoint(this.beamPoints[3].clone());
  }
  
  /**
   * 添加轨迹点
   * @param {THREE.Vector3} point - 轨迹点
   */
  addTracePoint(point) {
    // 添加新的轨迹点
    this.tracePoints.push(point);
    
    // 如果轨迹点过多，移除最早的点
    if (this.tracePoints.length > CONFIG.electronBeam.trace.maxPoints) {
      this.tracePoints.shift();
    }
    
    // 清除旧的轨迹线
    this.clearTraceLines();
    
    // 如果有足够的点，创建轨迹线
    if (this.tracePoints.length > 1) {
      const traceGeometry = new THREE.BufferGeometry().setFromPoints(this.tracePoints);
      const traceLine = new THREE.Line(traceGeometry, this.traceMaterial);
      this.traceLines.push(traceLine);
      this.scene.add(traceLine);
    }
  }
  
  /**
   * 清除轨迹线
   */
  clearTraceLines() {
    this.traceLines.forEach(line => {
      this.scene.remove(line);
      line.geometry.dispose();
    });
    this.traceLines = [];
  }
  
  /**
   * 更新材质
   */
  updateMaterial() {
    this.beamMaterial.color.set(CONFIG.beam.color);
    this.beamMaterial.opacity = CONFIG.beam.intensity;
    this.traceMaterial.color.set(CONFIG.beam.color);
  }
  
  /**
   * 清除所有轨迹
   */
  clearAllTraces() {
    this.clearTraceLines();
    this.tracePoints = [];
  }
} 