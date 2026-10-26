/* Site em rolagem vertical com animações de scroll.
   - barra de progresso, menu e bolinhas acompanham a seção atual
   - itens aparecem (fade + deslize) quando entram na tela, em sequência
   - hero: texto e foto se afastam enquanto você rola
   - Experiência: imagens com parallax
   - Projetos: cartões se empilham e o anterior encolhe/escurece quando o próximo chega
   O fundo 3D (background.js) também reage à rolagem. */
(() => {
  const pages = [...document.querySelectorAll('.page')];
  const navLinks = [...document.querySelectorAll('.nav a')];
  const dotsBox = document.getElementById('dots');
  const header = document.getElementById('header');
  const progress = document.getElementById('progress');
  const hero = document.getElementById('inicio');
  const heroImg = document.getElementById('heroImg');
  const logoImg = document.getElementById('logoImg');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Imagens que faltam: mostra o espaço reservado ---------- */
  const markMissing = (img, el, cls = 'is-missing') => {
    img.addEventListener('error', () => el.classList.add(cls));
    if (img.complete && !img.naturalWidth) el.classList.add(cls);
  };
  markMissing(logoImg, logoImg);
  markMissing(heroImg, heroImg);
  document.querySelectorAll('.post').forEach((post) => { const i = post.querySelector('img'); if (i) markMissing(i, post); });
  document.querySelectorAll('.shot').forEach((shot) => { const i = shot.querySelector('img'); if (i) markMissing(i, shot); });

  /* ---------- Navegação ---------- */
  const goTo = (i) => pages[i] && pages[i].scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });

  const dots = pages.map((_, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.setAttribute('aria-label', `Ir para seção ${i + 1}`);
    b.addEventListener('click', () => goTo(i));
    dotsBox.appendChild(b);
    return b;
  });

  document.querySelectorAll('[data-goto]').forEach((el) =>
    el.addEventListener('click', (e) => { e.preventDefault(); goTo(Number(el.dataset.goto)); })
  );

  let current = -1;
  function setActive(i) {
    if (i === current) return;
    current = i;
    dots.forEach((d, k) => d.classList.toggle('active', k === i));
    navLinks.forEach((a, k) => a.classList.toggle('active', k === i));
    history.replaceState(null, '', '#' + pages[i].id);
  }

  /* ---------- Aparecer ao rolar ---------- */
  const endReveal = (el) => {          // terminou a entrada: tira as classes para não atrapalhar hover/transições do elemento
    el.addEventListener('transitionend', (e) => {
      if (e.target !== el || e.propertyName !== 'opacity') return;
      [...el.classList].filter((c) => c.startsWith('reveal')).forEach((c) => el.classList.remove(c));
      el.style.removeProperty('--d');
    }, { once: false });
  };
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.classList.add('is-in');
      io.unobserve(e.target);
    });
  }, { rootMargin: '0px 0px -10% 0px', threshold: 0.12 });

  function tag(sel, { variant = '', base = 0, step = 90 } = {}) {
    document.querySelectorAll(sel).forEach((el) => {
      const idx = [...el.parentElement.children].filter((c) => c.matches(sel)).indexOf(el);
      el.classList.add('reveal');
      if (variant) el.classList.add('reveal--' + variant);
      el.style.setProperty('--d', (base + idx * step) + 'ms');
      if (reduce) { el.classList.add('is-in'); return; }
      endReveal(el);
      io.observe(el);
    });
  }
  tag('.title');
  tag('.lead', { base: 100 });
  tag('.item', { base: 80, step: 120 });
  tag('.group', { base: 150, step: 120 });
  tag('.post', { variant: 'zoom', step: 0 });
  tag('.proj', { step: 0 });
  tag('.proj__info > *', { base: 200, step: 100 });
  tag('.shot', { variant: 'zoom', base: 350, step: 130 });
  tag('.tags li', { variant: 'zoom', step: 55 });
  tag('.stack li', { variant: 'zoom', step: 60 });
  tag('.content > .hero__buttons', { base: 200 });
  tag('.proj__more');

  /* ---------- Parallax das imagens da Experiência ---------- */
  const posts = [...document.querySelectorAll('.post')];
  function parallax(vh) {
    posts.forEach((po) => {
      const r = po.getBoundingClientRect();
      if (r.bottom < 0 || r.top > vh) return;
      const t = (r.top + r.height / 2 - vh / 2) / (vh / 2 + r.height / 2);   // -1 (saindo por cima) … 1 (entrando por baixo)
      po.style.setProperty('--py', (-t * 6).toFixed(2) + '%');
    });
  }

  /* ---------- Projetos: pilha de cartões ---------- */
  const cards = [...document.querySelectorAll('.proj')];
  const stackMQ = matchMedia('(min-width: 1001px) and (min-height: 700px)');
  let tops = [], heights = [];
  function measure() {
    cards.forEach((c) => { c.style.removeProperty('scale'); c.style.removeProperty('filter'); });
    tops = cards.map((c) => parseFloat(getComputedStyle(c).top) || 0);
    heights = cards.map((c) => c.offsetHeight);
    update();
  }
  function stack() {
    if (!stackMQ.matches) return;
    cards.forEach((card, k) => {
      const next = cards[k + 1];
      if (!next) return;
      const start = tops[k] + heights[k];                       // o próximo encosta no fim deste
      const end = tops[k + 1];                                  // o próximo fica totalmente empilhado
      const nextTop = next.getBoundingClientRect().top;
      const p = Math.min(1, Math.max(0, (start - nextTop) / Math.max(1, start - end)));
      card.style.scale = (1 - p * 0.05).toFixed(4);
      card.style.filter = `brightness(${(1 - p * 0.4).toFixed(3)})`;
    });
  }

  /* ---------- Loop de rolagem ---------- */
  let ticking = false;
  function update() {
    ticking = false;
    const y = window.scrollY;
    const vh = window.innerHeight;
    const max = document.documentElement.scrollHeight - vh;

    progress.style.setProperty('--p', (max > 0 ? Math.min(1, y / max) : 0).toFixed(4));
    header.classList.toggle('is-scrolled', y > 20);

    hero.style.setProperty('--hs', Math.min(1, y / (vh * 0.9)).toFixed(3));
    hero.classList.toggle('is-active', y < vh * 0.6);

    let idx = 0;
    const mid = y + vh * 0.4;
    pages.forEach((pg, i) => { if (pg.offsetTop <= mid) idx = i; });
    if (max > 0 && y >= max - 4) idx = pages.length - 1;
    setActive(idx);

    if (!reduce) { parallax(vh); stack(); }
  }
  const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', () => { measure(); });
  stackMQ.addEventListener && stackMQ.addEventListener('change', measure);
  window.addEventListener('load', measure);

  measure();
})();
