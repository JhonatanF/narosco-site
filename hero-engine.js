/**
 * NAROSCO — HERO ENGINE 3D (Substituto do Spline)
 * Efeito visual premium: Rede Neural / Fluxo de Dados (Particle Wave & Core)
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

/* ─── Elementos DOM ─────────────────────────────── */
const heroEl = document.getElementById('hero');
const canvas = document.getElementById('hero-canvas');
if (!heroEl || !canvas) {
  console.warn('[HeroEngine] #hero ou #hero-canvas não encontrado.');
}

/* ─── Scene & Camera ────────────────────────────── */
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x020202);
scene.fog = new THREE.FogExp2(0x020202, 0.08);

const getW = () => canvas.clientWidth;
const getH = () => canvas.clientHeight;

const camera = new THREE.PerspectiveCamera(45, getW() / getH(), 0.1, 100);
camera.position.set(0, 3, 12);

/* ─── WebGL Renderer ────────────────────────────── */
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setSize(getW(), getH());
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

/* ─── OrbitControls ─────────────────────────────── */
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.autoRotate = true;
controls.autoRotateSpeed = 0.5;
controls.enablePan = false;
controls.enableZoom = false; // Desabilitar zoom para não atrapalhar o scroll

/* ─── Luzes ─────────────────────────────────────── */
scene.add(new THREE.AmbientLight(0x222222));

const directionalLight = new THREE.DirectionalLight(0xff5500, 2);
directionalLight.position.set(5, 5, 5);
scene.add(directionalLight);

const blueLight = new THREE.DirectionalLight(0x0044ff, 1.5);
blueLight.position.set(-5, -5, 2);
scene.add(blueLight);

/* ═══════════════════════════════════════════════════
   EFEITO: NÚCLEO (Abstract Shape)
═══════════════════════════════════════════════════ */
const coreGeometry = new THREE.IcosahedronGeometry(2, 1);
const coreMaterial = new THREE.MeshPhysicalMaterial({
  color: 0x0a0a0a,
  emissive: 0xff5500,
  emissiveIntensity: 0.2,
  metalness: 0.9,
  roughness: 0.1,
  wireframe: true,
  transparent: true,
  opacity: 0.6
});

const core = new THREE.Mesh(coreGeometry, coreMaterial);
core.position.set(4, 0, -2); // Deslocado para a direita (o texto fica na esquerda)
scene.add(core);

const coreInner = new THREE.Mesh(
  new THREE.IcosahedronGeometry(1.4, 0),
  new THREE.MeshStandardMaterial({
    color: 0xff5500,
    emissive: 0xff3300,
    emissiveIntensity: 0.5,
    roughness: 0.2,
    metalness: 0.8
  })
);
core.add(coreInner);

/* ═══════════════════════════════════════════════════
   EFEITO: REDE NEURAL (Particle Wave)
═══════════════════════════════════════════════════ */
const particleCount = 2000;
const particlesGeo = new THREE.BufferGeometry();
const posArray = new Float32Array(particleCount * 3);
const scales = new Float32Array(particleCount);

for (let i = 0; i < particleCount; i++) {
  // Distribuição em um cilindro/anel
  const radius = 6 + Math.random() * 8;
  const theta = Math.random() * Math.PI * 2;
  const y = (Math.random() - 0.5) * 8;
  
  posArray[i * 3] = Math.cos(theta) * radius;
  posArray[i * 3 + 1] = y;
  posArray[i * 3 + 2] = Math.sin(theta) * radius;
  
  scales[i] = Math.random();
}

particlesGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
particlesGeo.setAttribute('aScale', new THREE.BufferAttribute(scales, 1));

// Shader customizado para as partículas pulsar
const particleMaterial = new THREE.ShaderMaterial({
  uniforms: {
    time: { value: 0 },
    color: { value: new THREE.Color(0xff5500) }
  },
  vertexShader: `
    uniform float time;
    attribute float aScale;
    varying vec2 vUv;
    void main() {
      vUv = uv;
      vec3 pos = position;
      // Movimento ondulatório sutil
      pos.y += sin(time * 0.5 + pos.x) * 0.5;
      pos.x += cos(time * 0.3 + pos.y) * 0.5;
      
      vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
      gl_PointSize = (15.0 * aScale) * (10.0 / -mvPosition.z);
      gl_Position = projectionMatrix * mvPosition;
    }
  `,
  fragmentShader: `
    uniform vec3 color;
    void main() {
      // Criação de partículas circulares suaves
      float dist = distance(gl_PointCoord, vec2(0.5));
      if(dist > 0.5) discard;
      float alpha = (0.5 - dist) * 2.0;
      gl_FragColor = vec4(color, alpha * 0.6);
    }
  `,
  transparent: true,
  blending: THREE.AdditiveBlending,
  depthWrite: false
});

const particleSystem = new THREE.Points(particlesGeo, particleMaterial);
particleSystem.position.set(2, 0, -2);
scene.add(particleSystem);

/* ═══════════════════════════════════════════════════
   INTERAÇÃO COM O MOUSE
═══════════════════════════════════════════════════ */
let mouseX = 0;
let mouseY = 0;
let targetX = 0;
let targetY = 0;
const windowHalfX = window.innerWidth / 2;
const windowHalfY = window.innerHeight / 2;

document.addEventListener('mousemove', (event) => {
  mouseX = (event.clientX - windowHalfX) * 0.001;
  mouseY = (event.clientY - windowHalfY) * 0.001;
});

/* ═══════════════════════════════════════════════════
   BOTÃO DE SIMULAÇÃO (Integração)
═══════════════════════════════════════════════════ */
const simBtn = document.getElementById('hero-sim-btn');
const statusBox = document.getElementById('hero-status');
const statusText = document.getElementById('hero-status-text');
const simInput = document.getElementById('hero-sim-input');

if (simBtn) {
  simBtn.addEventListener('click', () => {
    const text = simInput?.value.trim() || 'Automação Genérica';
    
    // Mostra o status
    if (statusText) statusText.textContent = `"${text}"`;
    if (statusBox) statusBox.classList.add('active');

    // Efeito de pulso rápido
    coreMaterial.emissiveIntensity = 2.0;
    coreInner.scale.set(1.5, 1.5, 1.5);
    controls.autoRotateSpeed = 5.0; // Gira mais rápido
    
    setTimeout(() => {
      // Volta ao normal
      coreMaterial.emissiveIntensity = 0.2;
      coreInner.scale.set(1, 1, 1);
      controls.autoRotateSpeed = 0.5;
      if (statusBox) statusBox.classList.remove('active');
    }, 3000);
  });
}

/* ═══════════════════════════════════════════════════
   ANIMATION LOOP
═══════════════════════════════════════════════════ */
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const elapsedTime = clock.getElapsedTime();

  // Atualiza uniform do shader
  particleMaterial.uniforms.time.value = elapsedTime;

  // Rotação suave da wave
  particleSystem.rotation.y = elapsedTime * 0.05;
  particleSystem.rotation.z = elapsedTime * 0.02;

  // Animação do núcleo
  core.rotation.x += 0.002;
  core.rotation.y += 0.005;
  
  coreInner.rotation.x -= 0.004;
  coreInner.rotation.y -= 0.004;
  
  // Suavização do movimento com o mouse (Parallax)
  targetX = mouseX * 2;
  targetY = mouseY * 2;
  
  core.position.x += (4 + targetX - core.position.x) * 0.05;
  core.position.y += (-targetY - core.position.y) * 0.05;
  
  particleSystem.position.x += (2 + targetX - particleSystem.position.x) * 0.02;
  particleSystem.position.y += (-targetY - particleSystem.position.y) * 0.02;

  controls.update();
  renderer.render(scene, camera);
}
animate();

/* ─── Resize ────────────────────────────────────── */
window.addEventListener('resize', () => {
  const w = heroEl.clientWidth;
  const h = heroEl.clientHeight;
  renderer.setSize(w, h);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
});
