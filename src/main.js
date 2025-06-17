// ===== 基础导入 =====
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { TextureLoader } from 'three';

// ===== 场景 / 相机 / 渲染器 =====
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x20232a);

const camera = new THREE.PerspectiveCamera(
  45,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(6, 4, 10);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// ===== 光源 =====
scene.add(new THREE.AmbientLight(0xffffff, 0.6));
const pl = new THREE.PointLight(0xffffff, 0.8);
pl.position.set(10, 10, 10);
scene.add(pl);

// ===== 灰色网格地面 =====
      /**
       * GridHelper( size, divisions, colorCenterLine, colorGrid )
       * - size: 网格总长度 (单位: scene 单位)
       * - divisions: 划分多少格
       */
      const grid = new THREE.GridHelper(20, 40, 0x4a4a4a, 0x2f2f2f);
      grid.position.y = -1.6;      // 稍微放在组件下方
      scene.add(grid);


// ===== 材质 =====
const metalMat = new THREE.MeshStandardMaterial({
  color: 0xb0b0b0,
  metalness: 0.9,      // 接近镜面
  roughness: 0.2,      // 轻微磨砂
});

const plateMat = new THREE.MeshStandardMaterial({
  color: 0x1e88e5,     // 偏亮的板蓝色
  metalness: 0.05,     // 几乎绝缘体
  roughness: 0.7,      // 亚光
});

const screenMat = new THREE.MeshStandardMaterial({
  color: 0x001a00,     // 深绿底
  emissive: 0x00ff55,  // 发绿光
  emissiveIntensity: 0.6,
  roughness: 0.4,
  side: THREE.DoubleSide,
});


// ===== 电子枪 =====
const gun = new THREE.Mesh(
  new THREE.CylinderGeometry(0.15, 0.3, 2, 32),
  metalMat
);
gun.rotation.z = Math.PI / 2;
gun.position.set(-4, 0, 0);
scene.add(gun);

const gunHead = new THREE.Mesh(
  new THREE.CylinderGeometry(0.1, 0.1, 0.4, 32),
  metalMat
);
gunHead.rotation.z = Math.PI / 2;
gunHead.position.set(-2.9, 0, 0);
scene.add(gunHead);

// ==== 电子束（绿线）====
const beamMat = new THREE.LineBasicMaterial({color:0xffff00 });
const beamPoints = [

    new THREE.Vector3(-2.7,0,0),
    new THREE.Vector3(3,0,0)

];
const beamGeom = new THREE.BufferGeometry().setFromPoints(beamPoints);
const beam = new THREE.Line(beamGeom,beamMat);
scene.add(beam);


// ===== 垂直偏转板 =====
const vGeom = new THREE.BoxGeometry(0.05, 1.5, 1);
const v1    = new THREE.Mesh(vGeom, plateMat);
const v2    = v1.clone();

//让长边从 Y 轴 → 指向 X 轴：绕 Z 轴旋转 -90°（或 Math.PI / 2）
v1.rotation.z = -Math.PI / 2;
v2.rotation.z = -Math.PI / 2;

v1.position.set(-1.5, 0.8, 0);
v2.position.set(-1.5, -0.8, 0);
scene.add(v1, v2);



// ===== 水平偏转板 =====
const hGeom = new THREE.BoxGeometry(1.5, 0.05, 1);
const h1    = new THREE.Mesh(hGeom, plateMat);
const h2    = h1.clone();

h1.rotation.x = -Math.PI / 2;
h2.rotation.x = -Math.PI / 2;

h1.position.set(-0.2, 0, 0.55);
h2.position.set(-0.2, 0, -0.55);
scene.add(h1, h2);

//辅助线(测试专用)
// const helper = new THREE.BoxHelper(h1, 0xffff00);
// scene.add(helper);

// ===== 荧光屏 =====
const screen = new THREE.Mesh(new THREE.PlaneGeometry(4, 3), screenMat);
screen.position.set(3, 0, 0);
screen.rotation.y = -Math.PI / 2;
scene.add(screen);

// ===== 坐标轴辅助 =====(测试专用)
// scene.add(new THREE.AxesHelper(5));

// ===== 渲染循环 =====
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}
animate();

// ===== 窗口自适应 =====
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
