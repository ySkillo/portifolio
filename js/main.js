(() => {
  const track = document.getElementById('track');
  const pages = [...document.querySelectorAll('.page')];
  const navLinks = [...document.querySelectorAll('.nav a')];
  const dotsBox = document.getElementById('dots');
  const heroImg = document.getElementById('heroImg');

  const LOCK_MS = 900;   // igual ao --speed do CSS
  const WHEEL_MIN = 20;  // sensibilidade do scroll
  const SWIPE_MIN = 50;  // sensibilidade do toque

  let current = -1;
  let locked = false;

  track.style.setProperty('--pages', pages.length);

  const dots = pages.map((_, i) => {
    const b = document.createElement('button');
    b.setAttribute('aria-label', `Ir para página ${i + 1}`);
    b.addEventListener('click', () => goTo(i));
    dotsBox.appendChild(b);
    return b;
  });

  // Sem imagem → mostra espaço reservado
  const logoImg = document.getElementById('logoImg');
  logoImg.addEventListener('error', () => logoImg.classList.add('is-missing'));
  heroImg.addEventListener('error', () => heroImg.classList.add('is-missing'));
  if (heroImg.complete && !heroImg.naturalWidth) heroImg.classList.add('is-missing');

  function goTo(index) {
    index = Math.max(0, Math.min(pages.length - 1, index));
    if (index === current) return;
    current = index;
    track.style.transform = `translateX(-${current * 100}vw)`;
    pages.forEach((p, i) => p.classList.toggle('is-active', i === current));
    dots.forEach((d, i) => d.classList.toggle('active', i === current));
    navLinks.forEach((a, i) => a.classList.toggle('active', i === current));
    history.replaceState(null, '', '#' + pages[current].id);
    window.dispatchEvent(new CustomEvent('pagechange', { detail: { index: current, total: pages.length } }));
    locked = true;
    setTimeout(() => (locked = false), LOCK_MS);
  }
  const next = () => goTo(current + 1);
  const prev = () => goTo(current - 1);

  // Página com rolagem interna (telas pequenas): rola antes de trocar
  function canScrollInside(dir) {
    const el = pages[current];
    const oy = getComputedStyle(el).overflowY;
    if (oy !== 'auto' && oy !== 'scroll') return false; // página sem rolagem interna
    if (el.scrollHeight <= el.clientHeight + 2) return false;
    return dir > 0 ? el.scrollTop + el.clientHeight < el.scrollHeight - 2 : el.scrollTop > 2;
  }

  window.addEventListener('wheel', (e) => {
    if (Math.abs(e.deltaY) < WHEEL_MIN && Math.abs(e.deltaX) < WHEEL_MIN) return;
    const delta = Math.abs(e.deltaY) >= Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
    const dir = delta > 0 ? 1 : -1;
    if (canScrollInside(dir)) return;
    e.preventDefault();
    if (!locked) dir > 0 ? next() : prev();
  }, { passive: false });

  window.addEventListener('keydown', (e) => {
    if (locked) return;
    if (['ArrowDown', 'ArrowRight', 'PageDown'].includes(e.key)) { e.preventDefault(); next(); }
    if (['ArrowUp', 'ArrowLeft', 'PageUp'].includes(e.key)) { e.preventDefault(); prev(); }
    if (e.key === 'Home') goTo(0);
    if (e.key === 'End') goTo(pages.length - 1);
  });

  let startY = 0, startX = 0;
  window.addEventListener('touchstart', (e) => { startY = e.touches[0].clientY; startX = e.touches[0].clientX; }, { passive: true });
  window.addEventListener('touchend', (e) => {
    const dy = startY - e.changedTouches[0].clientY;
    const dx = startX - e.changedTouches[0].clientX;
    const d = Math.abs(dy) > Math.abs(dx) ? dy : dx;
    if (Math.abs(d) < SWIPE_MIN || locked) return;
    const dir = d > 0 ? 1 : -1;
    if (canScrollInside(dir)) return;
    dir > 0 ? next() : prev();
  }, { passive: true });

  document.querySelectorAll('[data-goto]').forEach((el) =>
    el.addEventListener('click', (e) => { e.preventDefault(); goTo(Number(el.dataset.goto)); })
  );

  // Abre direto na seção do hash (ex.: #projetos), sem animação
  const start = pages.findIndex((p) => '#' + p.id === location.hash);
  track.style.transition = 'none';
  goTo(start >= 0 ? start : 0);
  requestAnimationFrame(() => requestAnimationFrame(() => (track.style.transition = '')));
})();
