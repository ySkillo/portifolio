/* Fundo 3D minimalista (Three.js): um piso em grade, cinza escuro, que se perde na névoa.
   - a grade desliza devagar para frente; o mouse inclina levemente a câmera (parallax)
   - ao rolar a página a grade desliza para o lado e acelera (quanto mais rápido o scroll, mais rápido ela avança)
   Para mexer: cores e velocidade nas constantes abaixo. */
(() => {
  'use strict';
  const canvas = document.getElementById('bg');
  const BG = 0x141416;          // cinza escuro do fundo (igual ao --bg do CSS)
  const LINE = 0x3a3a40;        // cor das linhas da grade
  const LINE_OPACITY = 0.5;     // 0–1: quanto a grade aparece
  const CELL = 2;               // tamanho de cada quadrado
  const SPEED = 0.25;           // velocidade de avanço (unidades/segundo)
  const PAGE_SHIFT = 4;         // quanto a grade desliza de lado a cada seção rolada
  const SECTIONS = 6;           // número de seções do site (deslocamento total = SECTIONS × PAGE_SHIFT)
  const BOOST_GAIN = 0.015;     // quanto o scroll acelera a grade
  const BOOST_MAX = 5;          // aceleração máxima

  if (!window.THREE) { canvas.style.background = '#141416'; return; }
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true }); }
  catch (e) { canvas.style.background = '#141416'; return; }
  renderer.setClearColor(BG, 1);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(BG, 8, 40);   // as linhas somem no fundo cinza ao longe
  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);

  // Grade: linhas ao longo de X e de Z, uma célula a mais de cada lado para poder "rolar" sem emendas
  const HALF = 30;
  const pts = [];
  for (let i = -HALF; i <= HALF; i += CELL) {
    pts.push(i, 0, -HALF * 2, i, 0, 5);          // linhas que vão para o fundo (terminam antes da câmera)
    pts.push(-HALF, 0, i - HALF, HALF, 0, i - HALF); // linhas que cruzam
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
  const grid = new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color: LINE, transparent: true, opacity: LINE_OPACITY }));
  grid.position.y = -2.2;
  scene.add(grid);

  let mx = 0, my = 0, sx = 0, sy = 0;     // mouse alvo / suavizado
  let pageX = 0, curX = 0;                // deslocamento lateral alvo / atual
  let lastY = window.scrollY, boost = 0;  // aceleração causada pela rolagem
  let t0 = performance.now(), raf = 0;

  function resize() {
    const w = innerWidth, h = innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.fov = w / h < 1 ? 65 : 50;     // retrato (celular): mais aberto
    camera.updateProjectionMatrix();
    render();
  }

  function render() {
    camera.position.set(sx * 0.8, 1.6 - sy * 0.5, 7);
    camera.lookAt(0, -0.4, -12);
    renderer.render(scene, camera);
  }

  function frame(now) {
    const dt = Math.min((now - t0) / 1000, 0.1); t0 = now;
    sx += (mx - sx) * 0.05; sy += (my - sy) * 0.05;
    curX += (pageX - curX) * 0.05;
    boost *= Math.exp(-3 * dt);                                         // a aceleração do scroll vai se dissipando
    grid.position.z = (grid.position.z + (SPEED + boost) * dt) % CELL;  // avança em loop
    grid.position.x = -(curX % CELL);                                   // desliza com as páginas
    render();
    raf = requestAnimationFrame(frame);
  }

  window.addEventListener('resize', resize);
  window.addEventListener('pointermove', (e) => { mx = e.clientX / innerWidth - 0.5; my = e.clientY / innerHeight - 0.5; });
  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    const max = Math.max(1, document.documentElement.scrollHeight - innerHeight);
    pageX = Math.min(1, y / max) * SECTIONS * PAGE_SHIFT;
    boost = Math.min(boost + Math.abs(y - lastY) * BOOST_GAIN, BOOST_MAX);
    lastY = y;
    if (reduceMotion) { curX = pageX; grid.position.x = -(curX % CELL); render(); }
  }, { passive: true });
  document.addEventListener('visibilitychange', () => {
    cancelAnimationFrame(raf);
    if (!document.hidden && !reduceMotion) { t0 = performance.now(); raf = requestAnimationFrame(frame); }
  });

  resize();
  if (!reduceMotion) raf = requestAnimationFrame(frame);
})();
