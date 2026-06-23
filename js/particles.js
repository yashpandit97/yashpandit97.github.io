/**
 * Enhanced Three.js hero background — layered particles, soft connections,
 * smooth mouse parallax. Pauses off-screen; respects reduced motion.
 */
(function () {
  'use strict';

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (typeof THREE === 'undefined') return;

  const canvas = document.getElementById('particle-canvas');
  const hero = document.getElementById('hero');
  if (!canvas || !hero) return;

  const isMobile = window.innerWidth < 768;

  const LAYERS = isMobile
    ? [
        { count: 70, size: 0.22, opacity: 0.12, speed: 0.006, spread: 100 },
        { count: 45, size: 0.45, opacity: 0.28, speed: 0.012, spread: 80 },
        { count: 15, size: 0.75, opacity: 0.45, speed: 0.018, spread: 60 },
      ]
    : [
        { count: 140, size: 0.2, opacity: 0.1, speed: 0.005, spread: 130 },
        { count: 90, size: 0.42, opacity: 0.22, speed: 0.01, spread: 100 },
        { count: 35, size: 0.85, opacity: 0.42, speed: 0.016, spread: 75 },
      ];

  const CONNECT_DISTANCE = isMobile ? 12 : 16;
  const MAX_CONNECTIONS = isMobile ? 80 : 160;

  let renderer, scene, camera, clock;
  let particleGroups = [];
  let connectionLines = null;
  let connectionPositions = null;
  let animationId = null;
  let isVisible = true;

  let targetMouseX = 0;
  let targetMouseY = 0;
  let smoothMouseX = 0;
  let smoothMouseY = 0;

  let elapsed = 0;

  function getParticleColor() {
    const isLight = document.documentElement.getAttribute('data-theme') === 'light';
    return isLight ? 0x1a1a1a : 0xffffff;
  }

  function getLineOpacity() {
    const isLight = document.documentElement.getAttribute('data-theme') === 'light';
    return isLight ? 0.04 : 0.07;
  }

  function createLayer(config) {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(config.count * 3);
    const velocities = [];
    const phases = [];

    for (let i = 0; i < config.count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * config.spread;
      positions[i * 3 + 1] = (Math.random() - 0.5) * config.spread * 0.65;
      positions[i * 3 + 2] = (Math.random() - 0.5) * config.spread * 0.5;

      velocities.push({
        x: (Math.random() - 0.5) * config.speed,
        y: (Math.random() - 0.5) * config.speed,
        z: (Math.random() - 0.5) * config.speed * 0.6,
      });
      phases.push(Math.random() * Math.PI * 2);
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
      color: getParticleColor(),
      size: config.size,
      transparent: true,
      opacity: config.opacity,
      sizeAttenuation: true,
      depthWrite: false,
      blending: document.documentElement.getAttribute('data-theme') === 'light'
        ? THREE.NormalBlending
        : THREE.AdditiveBlending,
    });

    const points = new THREE.Points(geometry, material);
    points.userData = { velocities, phases, config };
    return points;
  }

  function createConnectionLines() {
    const maxSegments = MAX_CONNECTIONS * 2;
    connectionPositions = new Float32Array(maxSegments * 3);
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(connectionPositions, 3));

    const material = new THREE.LineBasicMaterial({
      color: getParticleColor(),
      transparent: true,
      opacity: getLineOpacity(),
      depthWrite: false,
      blending: document.documentElement.getAttribute('data-theme') === 'light'
        ? THREE.NormalBlending
        : THREE.AdditiveBlending,
    });

    connectionLines = new THREE.LineSegments(geometry, material);
    connectionLines.frustumCulled = false;
    scene.add(connectionLines);
  }

  function updateConnections(mainLayer) {
    if (!connectionLines || !mainLayer) return;

    const positions = mainLayer.geometry.attributes.position.array;
    const count = mainLayer.userData.config.count;
    const linePos = connectionPositions;
    let seg = 0;

    for (let i = 0; i < count && seg < MAX_CONNECTIONS; i++) {
      const ix = i * 3;
      const px = positions[ix];
      const py = positions[ix + 1];
      const pz = positions[ix + 2];

      for (let j = i + 1; j < count && seg < MAX_CONNECTIONS; j++) {
        const jx = j * 3;
        const dx = px - positions[jx];
        const dy = py - positions[jx + 1];
        const dz = pz - positions[jx + 2];
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

        if (dist < CONNECT_DISTANCE) {
          const idx = seg * 6;
          linePos[idx] = px;
          linePos[idx + 1] = py;
          linePos[idx + 2] = pz;
          linePos[idx + 3] = positions[jx];
          linePos[idx + 4] = positions[jx + 1];
          linePos[idx + 5] = positions[jx + 2];
          seg++;
        }
      }
    }

    for (let i = seg * 6; i < linePos.length; i++) {
      linePos[i] = 0;
    }

    connectionLines.geometry.attributes.position.needsUpdate = true;
    connectionLines.geometry.setDrawRange(0, seg * 2);
  }

  function wrapPosition(value, limit) {
    if (value > limit) return -limit;
    if (value < -limit) return limit;
    return value;
  }

  function updateLayer(group, delta) {
    const positions = group.geometry.attributes.position.array;
    const { velocities, phases, config } = group.userData;
    const limitX = config.spread * 0.55;
    const limitY = config.spread * 0.38;
    const limitZ = config.spread * 0.28;

    for (let i = 0; i < config.count; i++) {
      const idx = i * 3;
      const phase = phases[i];

      const driftX = Math.sin(elapsed * 0.3 + phase) * config.speed * 0.4;
      const driftY = Math.cos(elapsed * 0.25 + phase * 1.3) * config.speed * 0.4;

      positions[idx] += velocities[i].x + driftX + smoothMouseX * config.speed * 0.15;
      positions[idx + 1] += velocities[i].y + driftY - smoothMouseY * config.speed * 0.15;
      positions[idx + 2] += velocities[i].z + Math.sin(elapsed * 0.2 + phase) * config.speed * 0.2;

      positions[idx] = wrapPosition(positions[idx], limitX);
      positions[idx + 1] = wrapPosition(positions[idx + 1], limitY);
      positions[idx + 2] = wrapPosition(positions[idx + 2], limitZ);
    }

    group.geometry.attributes.position.needsUpdate = true;
    group.rotation.y = Math.sin(elapsed * 0.08) * 0.04;
    group.rotation.x = Math.cos(elapsed * 0.06) * 0.02;
  }

  function onThemeChange() {
    const color = getParticleColor();
    const isLight = document.documentElement.getAttribute('data-theme') === 'light';
    const blend = isLight ? THREE.NormalBlending : THREE.AdditiveBlending;

    particleGroups.forEach(function (g) {
      g.material.color.setHex(color);
      g.material.blending = blend;
      g.material.needsUpdate = true;
    });
    if (connectionLines) {
      connectionLines.material.color.setHex(color);
      connectionLines.material.opacity = getLineOpacity();
      connectionLines.material.blending = blend;
      connectionLines.material.needsUpdate = true;
    }
  }

  function init() {
    scene = new THREE.Scene();
    clock = new THREE.Clock();

    camera = new THREE.PerspectiveCamera(55, hero.offsetWidth / hero.offsetHeight, 0.1, 1000);
    camera.position.z = 55;

    renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(hero.offsetWidth, hero.offsetHeight);
    renderer.setClearColor(0x000000, 0);

    LAYERS.forEach(function (cfg) {
      const layer = createLayer(cfg);
      particleGroups.push(layer);
      scene.add(layer);
    });

    createConnectionLines();

    window.addEventListener('themechange', onThemeChange);
    document.addEventListener('mousemove', onMouseMove, { passive: true });
    document.addEventListener('touchmove', onTouchMove, { passive: true });

    const visibilityObserver = new IntersectionObserver(
      function (entries) {
        isVisible = entries[0].isIntersecting;
        if (isVisible && !animationId) {
          clock.start();
          animate();
        }
      },
      { threshold: 0 }
    );
    visibilityObserver.observe(hero);

    window.addEventListener('resize', onResize, { passive: true });

    animate();
  }

  function onMouseMove(e) {
    targetMouseX = (e.clientX / window.innerWidth - 0.5) * 2;
    targetMouseY = (e.clientY / window.innerHeight - 0.5) * 2;
  }

  function onTouchMove(e) {
    if (!e.touches.length) return;
    targetMouseX = (e.touches[0].clientX / window.innerWidth - 0.5) * 2;
    targetMouseY = (e.touches[0].clientY / window.innerHeight - 0.5) * 2;
  }

  function onResize() {
    if (!renderer || !camera) return;
    camera.aspect = hero.offsetWidth / hero.offsetHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(hero.offsetWidth, hero.offsetHeight);
  }

  function animate() {
    if (!isVisible) {
      animationId = null;
      return;
    }

    animationId = requestAnimationFrame(animate);

    const delta = Math.min(clock.getDelta(), 0.05);
    elapsed += delta;

    smoothMouseX += (targetMouseX - smoothMouseX) * 0.04;
    smoothMouseY += (targetMouseY - smoothMouseY) * 0.04;

    camera.position.x += (smoothMouseX * 4 - camera.position.x) * 0.03;
    camera.position.y += (-smoothMouseY * 3 - camera.position.y) * 0.03;
    camera.lookAt(0, 0, 0);

    particleGroups.forEach(function (group) {
      updateLayer(group, delta);
    });

    if (particleGroups[1]) {
      updateConnections(particleGroups[1]);
      connectionLines.rotation.copy(particleGroups[1].rotation);
    }

    renderer.render(scene, camera);
  }

  init();
})();
