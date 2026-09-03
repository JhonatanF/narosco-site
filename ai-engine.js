/**
 * NAROSCO — AI ENGINE 3D VISUAL
 * Pipeline: Tokenizador → Multi-Head Attention → Feed-Forward
 * Stack: Three.js (CDN) — dark background, orange neon #FF5500
 * Lazy-loaded via IntersectionObserver
 */

(function () {
  'use strict';

  /* ───────── CONSTANTS ───────── */
  const ORANGE  = 0xFF5500;
  const ORANGE2 = 0xFF7733;
  const DARK    = 0x050507;
  const GRID_COLOR = 0x0f0800;

  /* ───────── LAZY INIT ───────── */
  const canvas = document.getElementById('ai-engine-canvas');
  if (!canvas) return;

  let initialized = false;

  function lazyInit() {
    if (initialized) return;
    initialized = true;
    if (typeof THREE === 'undefined') {
      console.warn('[AI Engine] THREE.js not loaded');
      return;
    }
    buildEngine();
  }

  // Use IntersectionObserver for lazy loading
  if ('IntersectionObserver' in window) {
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          lazyInit();
          obs.disconnect();
        }
      });
    }, { rootMargin: '200px' });
    obs.observe(canvas);
  } else {
    // Fallback: init after delay
    setTimeout(lazyInit, 3000);
  }

  function buildEngine() {
    const W = canvas.clientWidth;
    const H = canvas.clientHeight;
    const isMobile = window.innerWidth < 768;

    /* ── Renderer ── */
    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: !isMobile, alpha: false });
      renderer.setSize(W, H);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.5 : 2));
      renderer.setClearColor(DARK, 1);
    } catch (e) {
      console.warn('[AI Engine] WebGL not available');
      canvas.style.background = `linear-gradient(135deg, #0a0800 0%, #050507 100%)`;
      return;
    }

    /* ── Scene ── */
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(DARK, 0.04);

    /* ── Camera ── */
    const camera = new THREE.PerspectiveCamera(55, W / H, 0.1, 200);
    camera.position.set(0, 4, 18);
    camera.lookAt(0, 0, 0);

    /* ── Manual Orbit Controls ── */
    let isDragging = false, prevMouse = { x: 0, y: 0 };
    let spherical = { theta: 0, phi: Math.PI / 4, r: 18 };

    canvas.addEventListener('mousedown', e => { isDragging = true; prevMouse = { x: e.clientX, y: e.clientY }; });
    canvas.addEventListener('touchstart', e => { isDragging = true; const t = e.touches[0]; prevMouse = { x: t.clientX, y: t.clientY }; }, { passive: true });
    window.addEventListener('mouseup', () => { isDragging = false; });
    window.addEventListener('touchend', () => { isDragging = false; });

    function onMove(dx, dy) {
      spherical.theta -= dx * 0.005;
      spherical.phi = Math.max(0.15, Math.min(Math.PI / 2.2, spherical.phi - dy * 0.005));
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

    /* ───────── GRID ───────── */
    const grid = new THREE.GridHelper(60, 30, GRID_COLOR, GRID_COLOR);
    grid.position.y = -3.5;
    grid.material.opacity = 0.4;
    grid.material.transparent = true;
    scene.add(grid);

    /* ───────── LIGHTS ───────── */
    scene.add(new THREE.AmbientLight(0x111111, 1));
    const light1 = new THREE.PointLight(ORANGE, 3, 25);
    light1.position.set(-6, 3, 0);
    scene.add(light1);
    const light2 = new THREE.PointLight(ORANGE2, 3, 25);
    light2.position.set(0, 3, 0);
    scene.add(light2);
    const light3 = new THREE.PointLight(ORANGE, 3, 25);
    light3.position.set(6, 3, 0);
    scene.add(light3);

    /* ───────── STAGE POSITIONS ───────── */
    const STAGE_X = [-6, 0, 6];

    /* ═════════════════════════════════════
       STAGE 1 — TOKENIZER (Torus Ring)
    ═════════════════════════════════════ */
    const torus = new THREE.Mesh(
      new THREE.TorusGeometry(1.5, 0.22, 20, 80),
      new THREE.MeshStandardMaterial({
        color: ORANGE, emissive: ORANGE, emissiveIntensity: 0.4,
        metalness: 0.8, roughness: 0.2,
      })
    );
    torus.position.set(STAGE_X[0], 0, 0);
    torus.rotation.x = Math.PI / 2.5;
    scene.add(torus);

    const torusInner = new THREE.Mesh(
      new THREE.TorusGeometry(0.85, 0.06, 12, 60),
      new THREE.MeshStandardMaterial({ color: ORANGE2, emissive: ORANGE2, emissiveIntensity: 0.7 })
    );
    torusInner.position.copy(torus.position);
    torusInner.rotation.x = Math.PI / 3;
    scene.add(torusInner);

    /* ═════════════════════════════════════════
       STAGE 2 — ATTENTION CORE (Icosahedron)
    ═════════════════════════════════════════ */
    const ico = new THREE.Mesh(
      new THREE.IcosahedronGeometry(1.3, 1),
      new THREE.MeshStandardMaterial({
        color: ORANGE, emissive: ORANGE, emissiveIntensity: 0.3,
        metalness: 0.9, roughness: 0.1,
      })
    );
    ico.position.set(STAGE_X[1], 0, 0);
    scene.add(ico);

    const icoWire = new THREE.Mesh(
      new THREE.IcosahedronGeometry(1.32, 1),
      new THREE.MeshBasicMaterial({ color: ORANGE2, wireframe: true, opacity: 0.25, transparent: true })
    );
    icoWire.position.copy(ico.position);
    scene.add(icoWire);

    // Satellites
    const SAT_COUNT = 6;
    const satMat = new THREE.MeshStandardMaterial({
      color: ORANGE2, emissive: ORANGE2, emissiveIntensity: 0.6, metalness: 0.6, roughness: 0.3
    });
    const satellites = [];
    for (let i = 0; i < SAT_COUNT; i++) {
      const sat = new THREE.Mesh(new THREE.SphereGeometry(0.14, 10, 10), satMat);
      sat.userData = { angle: (i / SAT_COUNT) * Math.PI * 2, radius: 2.4, speed: 0.5 + i * 0.06 };
      satellites.push(sat);
      scene.add(sat);
    }

    // Orbital ring
    const orbRing = new THREE.Mesh(
      new THREE.TorusGeometry(2.4, 0.02, 8, 64),
      new THREE.MeshBasicMaterial({ color: ORANGE, opacity: 0.15, transparent: true })
    );
    orbRing.position.copy(ico.position);
    orbRing.rotation.x = Math.PI / 2;
    scene.add(orbRing);

    /* ═══════════════════════════════════════
       STAGE 3 — FEED-FORWARD (Cylinder)
    ═══════════════════════════════════════ */
    const cylinder = new THREE.Mesh(
      new THREE.CylinderGeometry(0.7, 0.9, 3.2, 8, 4, false),
      new THREE.MeshStandardMaterial({
        color: ORANGE, emissive: ORANGE, emissiveIntensity: 0.35,
        metalness: 0.85, roughness: 0.15,
      })
    );
    cylinder.position.set(STAGE_X[2], 0, 0);
    scene.add(cylinder);

    // Stacked discs
    const discMat = new THREE.MeshStandardMaterial({
      color: ORANGE2, emissive: ORANGE2, emissiveIntensity: 0.5,
      metalness: 0.7, roughness: 0.2, side: THREE.DoubleSide,
    });
    [-1.2, -0.4, 0.4, 1.2].forEach(yOff => {
      const disc = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.0, 0.05, 32), discMat);
      disc.position.set(STAGE_X[2], yOff, 0);
      scene.add(disc);
    });

    /* ───────── LASER CONNECTIONS ───────── */
    const laserGroup = new THREE.Group();
    scene.add(laserGroup);
    let laserMeshes = [];

    function makeLaser(from, to, opacity) {
      const dir = new THREE.Vector3().subVectors(to, from);
      const mid = new THREE.Vector3().addVectors(from, to).multiplyScalar(0.5);
      const len = dir.length();
      const geo = new THREE.CylinderGeometry(0.015, 0.015, len, 6);
      const mat = new THREE.MeshBasicMaterial({ color: ORANGE2, transparent: true, opacity });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.copy(mid);
      mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
      return mesh;
    }

    function rebuildLasers() {
      laserMeshes.forEach(m => laserGroup.remove(m));
      laserMeshes = [];
      satellites.forEach(sat => {
        const m = makeLaser(ico.position, sat.position, 0.15 + Math.random() * 0.1);
        laserGroup.add(m);
        laserMeshes.push(m);
      });
    }

    /* ───────── CURVED ARCS ───────── */
    function makeCurvedArrow(fromX, toX, y) {
      const points = [];
      for (let i = 0; i <= 30; i++) {
        const t = i / 30;
        const x = fromX + (toX - fromX) * t;
        const py = y + Math.sin(t * Math.PI) * 0.8;
        points.push(new THREE.Vector3(x, py, 0));
      }
      const geo = new THREE.BufferGeometry().setFromPoints(points);
      const mat = new THREE.LineBasicMaterial({ color: ORANGE, opacity: 0.25, transparent: true });
      return new THREE.Line(geo, mat);
    }

    scene.add(makeCurvedArrow(STAGE_X[0] + 1.7, STAGE_X[1] - 1.5, 0.6));
    scene.add(makeCurvedArrow(STAGE_X[1] + 1.5, STAGE_X[2] - 0.9, 0.6));

    /* ───────── FLOWING PARTICLES ───────── */
    const P_COUNT = isMobile ? 100 : 200;
    const pPositions = new Float32Array(P_COUNT * 3);
    const pVelocities = [];
    const pPhases = [];

    function resetParticle(i) {
      pPositions[i * 3] = STAGE_X[0] - 4 + Math.random() * 0.5;
      pPositions[i * 3 + 1] = (Math.random() - 0.5) * 1.5;
      pPositions[i * 3 + 2] = (Math.random() - 0.5) * 1.5;
      pVelocities[i] = 0.025 + Math.random() * 0.04;
      pPhases[i] = Math.random() * Math.PI * 2;
    }

    for (let i = 0; i < P_COUNT; i++) {
      resetParticle(i);
      pPositions[i * 3] = STAGE_X[0] - 4 + Math.random() * (STAGE_X[2] + 6);
    }

    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPositions, 3));

    const particles = new THREE.Points(pGeo, new THREE.PointsMaterial({
      color: ORANGE, size: 0.1, sizeAttenuation: true, transparent: true, opacity: 0.8,
    }));
    scene.add(particles);

    /* ───────── LABELS ───────── */
    const labelsEl = document.getElementById('ai-engine-labels');
    const labelData = [
      { x: STAGE_X[0] },
      { x: STAGE_X[1] },
      { x: STAGE_X[2] },
    ];

    const v3 = new THREE.Vector3();
    function projectToScreen(worldX, worldY, worldZ) {
      v3.set(worldX, worldY, worldZ).project(camera);
      const rect = canvas.getBoundingClientRect();
      return {
        x: (v3.x * 0.5 + 0.5) * rect.width,
        y: (-v3.y * 0.5 + 0.5) * rect.height,
      };
    }

    /* ───────── USER INPUT ───────── */
    const inputEl = document.getElementById('ae-input');
    const triggerBtn = document.getElementById('ae-trigger');
    const activeLabel = document.getElementById('ae-active-label');
    let userText = '';
    let boost = 1.0;

    if (inputEl) inputEl.addEventListener('input', () => { userText = inputEl.value.trim(); });
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
      if (w === 0 || h === 0) return;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    });
    resizeObserver.observe(canvas);

    /* ───────── ANIMATION LOOP ───────── */
    let clock = 0;
    let laserTimer = 0;

    function animate() {
      requestAnimationFrame(animate);
      clock += 0.016;
      laserTimer += 0.016;

      // Camera orbit
      const cx = spherical.r * Math.sin(spherical.phi) * Math.sin(spherical.theta);
      const cy = spherical.r * Math.cos(spherical.phi);
      const cz = spherical.r * Math.sin(spherical.phi) * Math.cos(spherical.theta);
      camera.position.set(cx, cy + 1, cz);
      camera.lookAt(0, 0, 0);

      // Stage rotations
      torus.rotation.z += 0.007;
      torusInner.rotation.z -= 0.01;
      ico.rotation.y += 0.005;
      ico.rotation.x += 0.002;
      icoWire.rotation.copy(ico.rotation);
      cylinder.rotation.y += 0.008;

      // Satellites
      satellites.forEach(sat => {
        sat.userData.angle += sat.userData.speed * 0.016;
        const a = sat.userData.angle;
        const r = sat.userData.radius;
        sat.position.set(
          ico.position.x + Math.cos(a) * r,
          ico.position.y + Math.sin(a * 0.4) * 0.5,
          ico.position.z + Math.sin(a) * r
        );
      });

      // Lasers
      if (laserTimer > 0.2) { rebuildLasers(); laserTimer = 0; }

      // Light pulse
      const lp = Math.sin(clock * 1.3) * 0.5 + 2.5;
      light1.intensity = lp;
      light2.intensity = lp * 1.1;
      light3.intensity = lp;

      // Particle flow
      const pos = pGeo.attributes.position.array;
      for (let i = 0; i < P_COUNT; i++) {
        pos[i * 3] += pVelocities[i] * boost;
        pos[i * 3 + 1] += Math.sin(clock * 1.8 + pPhases[i]) * 0.003;

        const px = pos[i * 3];
        if (px > STAGE_X[0] - 0.5 && px < STAGE_X[0] + 0.5) {
          const angle = clock * 4 + pPhases[i];
          pos[i * 3 + 1] += (Math.sin(angle) * 0.6 - pos[i * 3 + 1]) * 0.08;
          pos[i * 3 + 2] += (Math.cos(angle) * 0.6 - pos[i * 3 + 2]) * 0.08;
        } else if (px > STAGE_X[1] - 0.5 && px < STAGE_X[1] + 0.5) {
          pos[i * 3 + 1] += (0 - pos[i * 3 + 1]) * 0.06;
          pos[i * 3 + 2] += (0 - pos[i * 3 + 2]) * 0.06;
        } else if (px > STAGE_X[2] - 0.5 && px < STAGE_X[2] + 0.5) {
          const stackY = (pPhases[i] - Math.PI) * 0.5;
          pos[i * 3 + 1] += (stackY - pos[i * 3 + 1]) * 0.07;
          pos[i * 3 + 2] += (0 - pos[i * 3 + 2]) * 0.1;
        }

        if (pos[i * 3] > STAGE_X[2] + 4) resetParticle(i);
      }
      pGeo.attributes.position.needsUpdate = true;

      // Labels
      if (labelsEl) {
        labelData.forEach((d, idx) => {
          const el = document.getElementById('ae-lbl-' + idx);
          if (!el) return;
          const sc = projectToScreen(d.x, -2.6, 0);
          el.style.left = sc.x + 'px';
          el.style.top = sc.y + 'px';
        });
      }

      renderer.render(scene, camera);
    }

    animate();
  }

})();
