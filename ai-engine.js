/**
 * NAROSCO — AI ENGINE 3D VISUAL
 * Narrativa Visual: Tokenizador → Atenção → Feed-Forward
 * Stack: Three.js (CDN) — fundo preto absoluto, laranja neon #FF5500
 */

(function () {
  'use strict';

  /* ───────── CONSTANTS ───────── */
  const ORANGE  = 0xFF5500;
  const ORANGE2 = 0xFF7733;
  const DARK    = 0x020202;
  const GRID_COLOR = 0x1a0800;

  /* ───────── INIT ───────── */
  const canvas = document.getElementById('ai-engine-canvas');
  if (!canvas) return;

  // Wait for Three.js to load
  if (typeof THREE === 'undefined') {
    // eslint-disable-next-line no-console -- intentional: warns dev when THREE.js fails to load
    console.warn('[AI Engine] THREE.js not loaded yet');
    return;
  }

  const W = canvas.clientWidth;
  const H = canvas.clientHeight;

  /* ── Renderer ── */
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
  renderer.setSize(W, H);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(DARK, 1);
  renderer.shadowMap.enabled = true;

  /* ── Scene ── */
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(DARK, 0.04);

  /* ── Camera ── */
  const camera = new THREE.PerspectiveCamera(55, W / H, 0.1, 200);
  camera.position.set(0, 4, 18);
  camera.lookAt(0, 0, 0);

  /* ── Orbit Controls (manual) ── */
  let isDragging = false, prevMouse = { x: 0, y: 0 };
  let spherical = { theta: 0, phi: Math.PI / 4, r: 18 };

  canvas.addEventListener('mousedown', e => { isDragging = true; prevMouse = { x: e.clientX, y: e.clientY }; });
  canvas.addEventListener('touchstart', e => { isDragging = true; const t = e.touches[0]; prevMouse = { x: t.clientX, y: t.clientY }; }, { passive: true });
  window.addEventListener('mouseup', () => { isDragging = false; });
  window.addEventListener('touchend', () => { isDragging = false; });

  function onMove(dx, dy) {
    spherical.theta -= dx * 0.005;
    spherical.phi   = Math.max(0.15, Math.min(Math.PI / 2.2, spherical.phi - dy * 0.005));
  }
  canvas.addEventListener('mousemove', e => {
    if (!isDragging) return;
    onMove(e.clientX - prevMouse.x, e.clientY - prevMouse.y);
    prevMouse = { x: e.clientX, y: e.clientY };
  });
  canvas.addEventListener('touchmove', e => {
    if (!isDragging) return;
    const t = e.touches[0];
    onMove(t.clientX - prevMouse.x, t.clientY - prevMouse.y);
    prevMouse = { x: t.clientX, y: t.clientY };
  }, { passive: true });

  /* ───────── GRID (datacenter floor) ───────── */
  (function buildGrid() {
    const size = 60, divisions = 30;
    const grid = new THREE.GridHelper(size, divisions, GRID_COLOR, GRID_COLOR);
    grid.position.y = -3.5;
    grid.material.opacity = 0.55;
    grid.material.transparent = true;
    scene.add(grid);
  })();

  /* ───────── AMBIENT + POINT LIGHTS ───────── */
  scene.add(new THREE.AmbientLight(0x111111, 1));

  function addPointLight(x, y, z, color, intensity) {
    const l = new THREE.PointLight(color, intensity, 25);
    l.position.set(x, y, z);
    scene.add(l);
    return l;
  }
  const light1 = addPointLight(-6, 3, 0, ORANGE,  3);
  const light2 = addPointLight( 0, 3, 0, ORANGE2, 3);
  const light3 = addPointLight( 6, 3, 0, ORANGE,  3);

  /* ───────── STAGE POSITIONS ───────── */
  // Three stages along X axis: left → center → right
  const STAGE_X = [-6, 0, 6];
  const STAGE_Y = 0;
  const STAGE_Z = 0;

  /* ═══════════════════════════════════════
     STAGE 1 — TOKENIZADOR (Anel / Torus)
  ═══════════════════════════════════════ */
  const torusMat = new THREE.MeshStandardMaterial({
    color: ORANGE, emissive: ORANGE, emissiveIntensity: 0.5,
    metalness: 0.8, roughness: 0.2, wireframe: false,
  });
  const torus = new THREE.Mesh(
    new THREE.TorusGeometry(1.5, 0.22, 20, 80),
    torusMat
  );
  torus.position.set(STAGE_X[0], STAGE_Y, STAGE_Z);
  torus.rotation.x = Math.PI / 2.5;
  scene.add(torus);

  // Inner ring
  const torusInner = new THREE.Mesh(
    new THREE.TorusGeometry(0.85, 0.06, 12, 60),
    new THREE.MeshStandardMaterial({ color: ORANGE2, emissive: ORANGE2, emissiveIntensity: 0.8, wireframe: false })
  );
  torusInner.position.copy(torus.position);
  torusInner.rotation.x = Math.PI / 3;
  scene.add(torusInner);

  /* ═══════════════════════════════════════════════════
     STAGE 2 — NÚCLEO DE ATENÇÃO (Icosaedro + Satélites)
  ═══════════════════════════════════════════════════ */
  const icoMat = new THREE.MeshStandardMaterial({
    color: ORANGE, emissive: ORANGE, emissiveIntensity: 0.35,
    metalness: 0.9, roughness: 0.1, wireframe: false,
  });
  const icoGeo = new THREE.IcosahedronGeometry(1.3, 1);
  const ico = new THREE.Mesh(icoGeo, icoMat);
  ico.position.set(STAGE_X[1], STAGE_Y, STAGE_Z);
  scene.add(ico);

  // Wireframe overlay
  const icoWire = new THREE.Mesh(
    new THREE.IcosahedronGeometry(1.32, 1),
    new THREE.MeshBasicMaterial({ color: ORANGE2, wireframe: true, opacity: 0.3, transparent: true })
  );
  icoWire.position.copy(ico.position);
  scene.add(icoWire);

  // Orbital satellites (Multi-Head Attention)
  const satellites = [];
  const SAT_COUNT = 6;
  const satMat = new THREE.MeshStandardMaterial({
    color: ORANGE2, emissive: ORANGE2, emissiveIntensity: 0.7, metalness: 0.6, roughness: 0.3
  });
  for (let i = 0; i < SAT_COUNT; i++) {
    const sat = new THREE.Mesh(new THREE.SphereGeometry(0.15, 12, 12), satMat);
    sat.userData = { angle: (i / SAT_COUNT) * Math.PI * 2, radius: 2.4, speed: 0.6 + i * 0.07 };
    satellites.push(sat);
    scene.add(sat);
  }

  // Orbital ring (decorative)
  const orbRing = new THREE.Mesh(
    new THREE.TorusGeometry(2.4, 0.025, 8, 80),
    new THREE.MeshBasicMaterial({ color: ORANGE, opacity: 0.25, transparent: true })
  );
  orbRing.position.copy(ico.position);
  orbRing.rotation.x = Math.PI / 2;
  scene.add(orbRing);

  /* ═══════════════════════════════════════════
     STAGE 3 — FEED-FORWARD (Pilar Cilíndrico)
  ═══════════════════════════════════════════ */
  const cylMat = new THREE.MeshStandardMaterial({
    color: ORANGE, emissive: ORANGE, emissiveIntensity: 0.4,
    metalness: 0.85, roughness: 0.15,
  });
  const cylinder = new THREE.Mesh(
    new THREE.CylinderGeometry(0.7, 0.9, 3.2, 8, 4, false),
    cylMat
  );
  cylinder.position.set(STAGE_X[2], STAGE_Y, STAGE_Z);
  scene.add(cylinder);

  // Stacked horizontal discs
  const discMat = new THREE.MeshStandardMaterial({
    color: ORANGE2, emissive: ORANGE2, emissiveIntensity: 0.6,
    metalness: 0.7, roughness: 0.2, side: THREE.DoubleSide,
  });
  [-1.2, -0.4, 0.4, 1.2].forEach(yOff => {
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.0, 0.06, 32), discMat);
    disc.position.set(STAGE_X[2], STAGE_Y + yOff, STAGE_Z);
    scene.add(disc);
  });

  /* ───────── LASER RAYS (Attention connections) ───────── */
  const laserGroup = new THREE.Group();
  scene.add(laserGroup);

  function makeLaser(from, to, opacity) {
    const dir = new THREE.Vector3().subVectors(to, from);
    const mid = new THREE.Vector3().addVectors(from, to).multiplyScalar(0.5);
    const len = dir.length();
    const geo = new THREE.CylinderGeometry(0.02, 0.02, len, 6);
    const mat = new THREE.MeshBasicMaterial({ color: ORANGE2, transparent: true, opacity });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(mid);
    mesh.quaternion.setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      dir.clone().normalize()
    );
    return mesh;
  }

  // Laser rays from ico to each satellite — rebuilt each frame
  let laserMeshes = [];

  function rebuildLasers() {
    laserMeshes.forEach(m => laserGroup.remove(m));
    laserMeshes = [];
    satellites.forEach(sat => {
      const m = makeLaser(ico.position, sat.position, 0.18 + Math.random() * 0.12);
      laserGroup.add(m);
      laserMeshes.push(m);
    });
  }

  /* ───────── CONNECTING ARCS (stage → stage) ───────── */
  function makeCurvedArrow(fromX, toX, y, z) {
    const points = [];
    for (let i = 0; i <= 30; i++) {
      const t = i / 30;
      const x = fromX + (toX - fromX) * t;
      const py = y + Math.sin(t * Math.PI) * 0.8;
      points.push(new THREE.Vector3(x, py, z));
    }
    const geo = new THREE.BufferGeometry().setFromPoints(points);
    const mat = new THREE.LineBasicMaterial({ color: ORANGE, opacity: 0.35, transparent: true });
    return new THREE.Line(geo, mat);
  }

  scene.add(makeCurvedArrow(STAGE_X[0] + 1.7, STAGE_X[1] - 1.5, 0.6, 0));
  scene.add(makeCurvedArrow(STAGE_X[1] + 1.5, STAGE_X[2] - 0.9, 0.6, 0));

  /* ───────── FLOWING PARTICLES ───────── */
  const PARTICLE_COUNT = 220;
  const pPositions = new Float32Array(PARTICLE_COUNT * 3);
  const pVelocities = [];
  const pPhases = [];

  function resetParticle(i) {
    const spread = 1.5;
    pPositions[i * 3]     = STAGE_X[0] - 4 + Math.random() * 0.5;
    pPositions[i * 3 + 1] = (Math.random() - 0.5) * spread;
    pPositions[i * 3 + 2] = (Math.random() - 0.5) * spread;
    pVelocities[i] = 0.025 + Math.random() * 0.04;
    pPhases[i]     = Math.random() * Math.PI * 2;
  }

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    resetParticle(i);
    pPositions[i * 3] = STAGE_X[0] - 4 + Math.random() * (STAGE_X[2] + 6);
  }

  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute('position', new THREE.BufferAttribute(pPositions, 3));

  const pMat = new THREE.PointsMaterial({
    color: ORANGE, size: 0.12, sizeAttenuation: true,
    transparent: true, opacity: 0.85,
  });
  const particles = new THREE.Points(pGeo, pMat);
  scene.add(particles);

  /* ───────── STAGE LABELS (HTML overlay) ───────── */
  const labelsEl = document.getElementById('ai-engine-labels');
  const labelData = [
    { x: STAGE_X[0], label: '01 — Tokenizador', sub: 'Fragmenta o texto em tokens' },
    { x: STAGE_X[1], label: '02 — Multi-Head Attention', sub: 'Analisa contexto em paralelo' },
    { x: STAGE_X[2], label: '03 — Feed-Forward', sub: 'Transforma tokens em conhecimento' },
  ];

  /* ───────── USER INPUT SECTION ───────── */
  const inputEl    = document.getElementById('ae-input');
  const triggerBtn = document.getElementById('ae-trigger');
  const activeLabel = document.getElementById('ae-active-label');
  let   userText   = '';
  let   boost      = 1.0; // particle speed multiplier

  if (inputEl) {
    inputEl.addEventListener('input', () => { userText = inputEl.value.trim(); });
  }
  if (triggerBtn) {
    triggerBtn.addEventListener('click', () => {
      if (!userText) return;
      boost = 3.5;
      if (activeLabel) activeLabel.textContent = `"${userText}"`;
      setTimeout(() => { boost = 1.0; }, 3500);
    });
  }

  /* ───────── RESIZE ───────── */
  const resizeObserver = new ResizeObserver(() => {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  });
  resizeObserver.observe(canvas);

  /* ─────────── PROJECT 3D → 2D for labels ─────────── */
  const v3 = new THREE.Vector3();
  function projectToScreen(worldX, worldY, worldZ) {
    v3.set(worldX, worldY, worldZ);
    v3.project(camera);
    const rect = canvas.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;
    return {
      x: (v3.x * 0.5 + 0.5) * w,
      y: (-v3.y * 0.5 + 0.5) * h,
    };
  }

  /* ───────── ANIMATION LOOP ───────── */
  let clock = 0;
  let laserTimer = 0;

  function animate() {
    requestAnimationFrame(animate);
    clock += 0.016;
    laserTimer += 0.016;

    /* Camera orbit */
    const cx = spherical.r * Math.sin(spherical.phi) * Math.sin(spherical.theta);
    const cy = spherical.r * Math.cos(spherical.phi);
    const cz = spherical.r * Math.sin(spherical.phi) * Math.cos(spherical.theta);
    camera.position.set(cx, cy + 1, cz);
    camera.lookAt(0, 0, 0);

    /* Stage geometries rotation */
    torus.rotation.z      += 0.008;
    torusInner.rotation.z -= 0.012;
    ico.rotation.y         += 0.006;
    ico.rotation.x         += 0.003;
    icoWire.rotation.copy(ico.rotation);
    cylinder.rotation.y   += 0.01;

    /* Satellites orbit around ico */
    satellites.forEach(sat => {
      sat.userData.angle += sat.userData.speed * 0.016;
      const a = sat.userData.angle;
      const r = sat.userData.radius;
      sat.position.set(
        ico.position.x + Math.cos(a) * r,
        ico.position.y + Math.sin(a * 0.4) * 0.6,
        ico.position.z + Math.sin(a) * r
      );
    });

    /* Laser rebuild every ~0.18s */
    if (laserTimer > 0.18) {
      rebuildLasers();
      laserTimer = 0;
    }

    /* Oscillate lights */
    const lp = Math.sin(clock * 1.3) * 0.5 + 2.5;
    light1.intensity = lp;
    light2.intensity = lp * 1.1;
    light3.intensity = lp;

    /* Particle flow */
    const pos = pGeo.attributes.position.array;
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      pos[i * 3] += pVelocities[i] * boost;

      // Wave motion in Y
      pos[i * 3 + 1] += Math.sin(clock * 1.8 + pPhases[i]) * 0.003;

      // Funnel through each stage
      const px = pos[i * 3];
      let targetY = 0, targetZ = 0;
      if (px > STAGE_X[0] - 0.5 && px < STAGE_X[0] + 0.5) {
        // Through torus — spiral effect
        const angle = clock * 4 + pPhases[i];
        targetY = Math.sin(angle) * 0.6;
        targetZ = Math.cos(angle) * 0.6;
        pos[i * 3 + 1] += (targetY - pos[i * 3 + 1]) * 0.08;
        pos[i * 3 + 2] += (targetZ - pos[i * 3 + 2]) * 0.08;
      } else if (px > STAGE_X[1] - 0.5 && px < STAGE_X[1] + 0.5) {
        // Through ico — scatter then pull back
        pos[i * 3 + 1] += (0 - pos[i * 3 + 1]) * 0.06;
        pos[i * 3 + 2] += (0 - pos[i * 3 + 2]) * 0.06;
      } else if (px > STAGE_X[2] - 0.5 && px < STAGE_X[2] + 0.5) {
        // Through cylinder — stack vertically
        const stackY = (pPhases[i] - Math.PI) * 0.5;
        pos[i * 3 + 1] += (stackY - pos[i * 3 + 1]) * 0.07;
        pos[i * 3 + 2] += (0 - pos[i * 3 + 2]) * 0.1;
      }

      // Reset when past the end
      if (pos[i * 3] > STAGE_X[2] + 4) {
        resetParticle(i);
      }
    }
    pGeo.attributes.position.needsUpdate = true;

    /* Update HTML labels */
    if (labelsEl) {
      labelData.forEach((d, idx) => {
        const el = document.getElementById('ae-lbl-' + idx);
        if (!el) return;
        const sc = projectToScreen(d.x, -2.6, 0);
        el.style.left = sc.x + 'px';
        el.style.top  = sc.y + 'px';
      });
    }

    renderer.render(scene, camera);
  }

  animate();

})();
