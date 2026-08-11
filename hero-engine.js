/**
 * NAROSCO — HERO ENGINE 3D
 * Visual: AI Agent Runtime — Computational core with orbital system nodes
 * Connected to CRM, ERP, WhatsApp, Email, Database, Calendar, BI, APIs
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

/* ─── DOM Elements ──────────────────────────────── */
const heroEl = document.getElementById('hero');
const canvas = document.getElementById('hero-canvas');
if (!heroEl || !canvas) {
  console.warn('[HeroEngine] #hero or #hero-canvas not found.');
}

/* ─── Mobile detection ──────────────────────────── */
const isMobile = window.innerWidth < 768;
const PARTICLE_COUNT = isMobile ? 800 : 2000;

/* ─── Scene & Camera ────────────────────────────── */
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x050507);
scene.fog = new THREE.FogExp2(0x050507, 0.06);

const getW = () => canvas.clientWidth;
const getH = () => canvas.clientHeight;

const camera = new THREE.PerspectiveCamera(45, getW() / getH(), 0.1, 100);
camera.position.set(0, 3, 14);

/* ─── WebGL Renderer ────────────────────────────── */
let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: !isMobile, alpha: true });
  renderer.setSize(getW(), getH());
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.5 : 2));
} catch (e) {
  console.warn('[HeroEngine] WebGL not available, using CSS fallback');
  canvas.style.background = 'radial-gradient(ellipse at 60% 50%, rgba(255,85,0,0.08) 0%, transparent 70%)';
}

/* ─── OrbitControls ─────────────────────────────── */
let controls;
if (renderer && !isMobile) {
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.autoRotate = true;
  controls.autoRotateSpeed = 0.4;
  controls.enablePan = false;
  controls.enableZoom = false;
  controls.maxPolarAngle = Math.PI / 1.8;
  controls.minPolarAngle = Math.PI / 4;
}

/* ─── Lights ────────────────────────────────────── */
scene.add(new THREE.AmbientLight(0x111111, 1));

const mainLight = new THREE.DirectionalLight(0xff5500, 2.5);
mainLight.position.set(5, 5, 5);
scene.add(mainLight);

const fillLight = new THREE.DirectionalLight(0xff3300, 1);
fillLight.position.set(-5, -3, 2);
scene.add(fillLight);

const rimLight = new THREE.PointLight(0xff7733, 1.5, 20);
rimLight.position.set(0, 4, -8);
scene.add(rimLight);

/* ═══════════════════════════════════════════════════
   CORE — Computational Nucleus (Icosahedron)
═══════════════════════════════════════════════════ */
const coreGroup = new THREE.Group();
coreGroup.position.set(4, 0, -2);
scene.add(coreGroup);

// Outer wireframe shell
const coreOuter = new THREE.Mesh(
  new THREE.IcosahedronGeometry(2, 1),
  new THREE.MeshPhysicalMaterial({
    color: 0x0a0a0a,
    emissive: 0xff5500,
    emissiveIntensity: 0.15,
    metalness: 0.9,
    roughness: 0.1,
    wireframe: true,
    transparent: true,
    opacity: 0.5
  })
);
coreGroup.add(coreOuter);

// Inner solid core
const coreInner = new THREE.Mesh(
  new THREE.IcosahedronGeometry(1.2, 0),
  new THREE.MeshStandardMaterial({
    color: 0xff5500,
    emissive: 0xff3300,
    emissiveIntensity: 0.4,
    roughness: 0.2,
    metalness: 0.8
  })
);
coreGroup.add(coreInner);

// Core glow sphere
const coreGlow = new THREE.Mesh(
  new THREE.SphereGeometry(2.5, 16, 16),
  new THREE.MeshBasicMaterial({
    color: 0xff5500,
    transparent: true,
    opacity: 0.03
  })
);
coreGroup.add(coreGlow);

/* ═══════════════════════════════════════════════════
   ORBITAL NODES — System Integration Points
═══════════════════════════════════════════════════ */
const systemNodes = [
  { label: 'CRM',      angle: 0,              radius: 4.5, speed: 0.3,  yOff: 0 },
  { label: 'ERP',      angle: Math.PI * 0.25,  radius: 5,   speed: 0.25, yOff: 0.5 },
  { label: 'WhatsApp', angle: Math.PI * 0.5,   radius: 4.2, speed: 0.35, yOff: -0.3 },
  { label: 'Email',    angle: Math.PI * 0.75,  radius: 4.8, speed: 0.28, yOff: 0.2 },
  { label: 'Database', angle: Math.PI,          radius: 4.5, speed: 0.32, yOff: -0.5 },
  { label: 'Calendar', angle: Math.PI * 1.25,  radius: 5.2, speed: 0.22, yOff: 0.4 },
  { label: 'BI',       angle: Math.PI * 1.5,   radius: 4.3, speed: 0.3,  yOff: -0.2 },
  { label: 'APIs',     angle: Math.PI * 1.75,  radius: 4.7, speed: 0.27, yOff: 0.1 },
];

const nodeMaterial = new THREE.MeshStandardMaterial({
  color: 0xff7733,
  emissive: 0xff5500,
  emissiveIntensity: 0.6,
  metalness: 0.6,
  roughness: 0.3
});

const nodeObjects = systemNodes.map(n => {
  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(0.18, 12, 12),
    nodeMaterial
  );
  mesh.userData = { ...n };
  scene.add(mesh);
  return mesh;
});

// Orbital rings (decorative)
[4.5, 5].forEach((r, i) => {
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(r, 0.01, 8, 64),
    new THREE.MeshBasicMaterial({
      color: 0xff5500,
      transparent: true,
      opacity: 0.06 + i * 0.02
    })
  );
  ring.position.copy(coreGroup.position);
  ring.rotation.x = Math.PI / 2 + i * 0.15;
  scene.add(ring);
});

/* ═══════════════════════════════════════════════════
   PARTICLE FIELD — Neural Data Flow
═══════════════════════════════════════════════════ */
const particlesGeo = new THREE.BufferGeometry();
const posArray = new Float32Array(PARTICLE_COUNT * 3);
const scales = new Float32Array(PARTICLE_COUNT);

for (let i = 0; i < PARTICLE_COUNT; i++) {
  const radius = 5 + Math.random() * 10;
  const theta = Math.random() * Math.PI * 2;
  const y = (Math.random() - 0.5) * 10;

  posArray[i * 3] = Math.cos(theta) * radius;
  posArray[i * 3 + 1] = y;
  posArray[i * 3 + 2] = Math.sin(theta) * radius;
  scales[i] = Math.random();
}

particlesGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
particlesGeo.setAttribute('aScale', new THREE.BufferAttribute(scales, 1));

const particleMaterial = new THREE.ShaderMaterial({
  uniforms: {
    time: { value: 0 },
    color: { value: new THREE.Color(0xff5500) }
  },
  vertexShader: `
    uniform float time;
    attribute float aScale;
    void main() {
      vec3 pos = position;
      pos.y += sin(time * 0.4 + pos.x * 0.3) * 0.6;
      pos.x += cos(time * 0.25 + pos.y * 0.2) * 0.4;
      vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
      gl_PointSize = (12.0 * aScale) * (10.0 / -mvPosition.z);
      gl_Position = projectionMatrix * mvPosition;
    }
  `,
  fragmentShader: `
    uniform vec3 color;
    void main() {
      float dist = distance(gl_PointCoord, vec2(0.5));
      if(dist > 0.5) discard;
      float alpha = (0.5 - dist) * 2.0;
      gl_FragColor = vec4(color, alpha * 0.5);
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
   CONNECTION LINES — Data flow from nodes to core
═══════════════════════════════════════════════════ */
const lineMaterial = new THREE.LineBasicMaterial({
  color: 0xff5500,
  transparent: true,
  opacity: 0.12
});

const connectionLines = nodeObjects.map(() => {
  const geo = new THREE.BufferGeometry();
  const pts = new Float32Array(6);
  geo.setAttribute('position', new THREE.BufferAttribute(pts, 3));
  const line = new THREE.Line(geo, lineMaterial);
  scene.add(line);
  return line;
});

/* ═══════════════════════════════════════════════════
   MOUSE INTERACTION
═══════════════════════════════════════════════════ */
let mouseX = 0, mouseY = 0;

document.addEventListener('mousemove', (e) => {
  mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
  mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
});

/* ═══════════════════════════════════════════════════
   SIMULATION BUTTON
═══════════════════════════════════════════════════ */
const simBtn = document.getElementById('hero-sim-btn');
const statusBox = document.getElementById('hero-status');
const statusText = document.getElementById('hero-status-text');
const simInput = document.getElementById('hero-sim-input');

if (simBtn) {
  simBtn.addEventListener('click', () => {
    const text = simInput?.value.trim() || 'Processo genérico';

    if (statusText) statusText.textContent = `Processando: "${text}"`;
    if (statusBox) statusBox.classList.add('active');

    // Pulse effect
    coreOuter.material.emissiveIntensity = 1.5;
    coreInner.scale.set(1.4, 1.4, 1.4);
    if (controls) controls.autoRotateSpeed = 4;

    setTimeout(() => {
      coreOuter.material.emissiveIntensity = 0.15;
      coreInner.scale.set(1, 1, 1);
      if (controls) controls.autoRotateSpeed = 0.4;
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
  if (!renderer) return;

  const t = clock.getElapsedTime();

  // Shader time
  particleMaterial.uniforms.time.value = t;

  // Particle rotation
  particleSystem.rotation.y = t * 0.03;
  particleSystem.rotation.z = t * 0.01;

  // Core rotation
  coreOuter.rotation.x += 0.002;
  coreOuter.rotation.y += 0.004;
  coreInner.rotation.x -= 0.003;
  coreInner.rotation.y -= 0.005;

  // Glow pulse
  coreGlow.material.opacity = 0.02 + Math.sin(t * 1.5) * 0.015;

  // Orbital nodes
  nodeObjects.forEach((mesh, i) => {
    const d = mesh.userData;
    d.angle += d.speed * 0.008;
    const cx = coreGroup.position.x;
    const cy = coreGroup.position.y;
    const cz = coreGroup.position.z;

    mesh.position.set(
      cx + Math.cos(d.angle) * d.radius,
      cy + d.yOff + Math.sin(t * 0.5 + i) * 0.3,
      cz + Math.sin(d.angle) * d.radius
    );

    // Update connection line
    const lineGeo = connectionLines[i].geometry;
    const pts = lineGeo.attributes.position.array;
    pts[0] = cx; pts[1] = cy; pts[2] = cz;
    pts[3] = mesh.position.x; pts[4] = mesh.position.y; pts[5] = mesh.position.z;
    lineGeo.attributes.position.needsUpdate = true;
  });

  // Mouse parallax
  const tx = mouseX * 1.5;
  const ty = mouseY * 1.5;
  coreGroup.position.x += (4 + tx - coreGroup.position.x) * 0.03;
  coreGroup.position.y += (-ty - coreGroup.position.y) * 0.03;
  particleSystem.position.x += (2 + tx * 0.5 - particleSystem.position.x) * 0.02;
  particleSystem.position.y += (-ty * 0.5 - particleSystem.position.y) * 0.02;

  // Light pulsation
  rimLight.intensity = 1.5 + Math.sin(t * 1.2) * 0.5;

  if (controls) controls.update();
  renderer.render(scene, camera);
}

if (renderer) animate();

/* ─── Resize ────────────────────────────────────── */
window.addEventListener('resize', () => {
  if (!renderer || !heroEl) return;
  const w = heroEl.clientWidth;
  const h = heroEl.clientHeight;
  renderer.setSize(w, h);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
});
