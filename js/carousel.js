/* Carrossel de postagens (página Experiência).
   - troca automática com barra de progresso (pausa ao passar o mouse e quando a página não está aberta)
   - setas, barras de progresso clicáveis e arrastar com mouse/dedo
   - efeitos: revelação lateral, zoom lento, parallax e brilho que seguem o mouse, leve inclinação 3D
   Intervalo: atributo data-interval (ms) no <aside data-carousel>. */
(() => {
  document.querySelectorAll('[data-carousel]').forEach((root) => {
    const stage = root.querySelector('.carousel__stage');
    const slides = [...root.querySelectorAll('.slide')];
    const progress = root.querySelector('[data-progress]');
    const curEl = root.querySelector('[data-cur]');
    const totalEl = root.querySelector('[data-total]');
    const page = root.closest('.page');
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const fine = matchMedia('(pointer: fine)').matches;
    const pad = (n) => String(n).padStart(2, '0');
    const SWIPE_MIN = 40;
    const noun = root.dataset.noun || 'postagem';
    let i = -1;

    root.style.setProperty('--dur', (Number(root.dataset.interval) || 6500) + 'ms');
    totalEl.textContent = pad(slides.length);
    if (slides.length < 2) root.setAttribute('data-single', '');

    // imagem que não existir: mostra o espaço reservado
    slides.forEach((slide) => {
      const img = slide.querySelector('img');
      if (!img) return;
      img.addEventListener('error', () => slide.classList.add('is-missing'));
      if (img.complete && !img.naturalWidth) slide.classList.add('is-missing');
    });

    // fotos do projeto (várias por slide): foto que não existir mostra o espaço reservado
    root.querySelectorAll('.shot img').forEach((img) => {
      const fig = img.closest('.shot');
      img.addEventListener('error', () => fig.classList.add('is-missing'));
      if (img.complete && !img.naturalWidth) fig.classList.add('is-missing');
    });

    // barras de progresso
    const segs = slides.map((_, n) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'carousel__seg';
      b.setAttribute('aria-label', `Ir para ${noun === 'projeto' ? 'o' : 'a'} ${noun} ${n + 1}`);
      b.innerHTML = '<span class="fill"></span>';
      b.addEventListener('click', () => go(n));
      b.querySelector('.fill').addEventListener('animationend', () => { if (!reduce) go(i + 1, 'next'); });
      progress.appendChild(b);
      return b;
    });

    function paintSegs() {
      segs.forEach((s, k) => {
        s.classList.remove('active');
        s.classList.toggle('done', k < i);
      });
      void progress.offsetWidth;              // reinicia a animação da barra
      segs[i].classList.add('active');
    }

    function go(n, dir) {
      n = (n + slides.length) % slides.length;
      if (n === i) return;
      dir = dir || (i < 0 || n > i ? 'next' : 'prev');
      const old = slides[i];
      if (old) {
        old.classList.remove('is-active');
        old.classList.add('is-leaving');
        setTimeout(() => old.classList.remove('is-leaving'), 1000);
      }
      stage.dataset.dir = dir;
      slides[n].classList.remove('is-leaving');
      slides[n].classList.add('is-active');
      i = n;
      curEl.textContent = pad(i + 1);
      curEl.classList.remove('tick'); void curEl.offsetWidth; curEl.classList.add('tick');
      paintSegs();
    }

    // recomeça a animação do slide atual (quando a página Experiência abre)
    function replay() {
      const s = slides[i];
      s.classList.remove('is-active'); void s.offsetWidth; s.classList.add('is-active');
      paintSegs();
    }

    root.querySelector('[data-prev]').addEventListener('click', () => go(i - 1, 'prev'));
    root.querySelector('[data-next]').addEventListener('click', () => go(i + 1, 'next'));

    // pausa: mouse em cima ou foco dentro do carrossel
    root.addEventListener('pointerenter', () => root.classList.add('is-paused'));
    root.addEventListener('pointerleave', () => root.classList.remove('is-paused'));
    root.addEventListener('focusin', () => root.classList.add('is-paused'));
    root.addEventListener('focusout', () => root.classList.remove('is-paused'));

    // só roda enquanto a página Experiência está aberta
    if (page) {
      let was = page.classList.contains('is-active');
      root.classList.toggle('is-idle', !was);
      new MutationObserver(() => {
        const now = page.classList.contains('is-active');
        root.classList.toggle('is-idle', !now);
        if (now && !was) replay();
        was = now;
      }).observe(page, { attributes: true, attributeFilter: ['class'] });
    }

    // arrastar (mouse e toque) sem clicar no link por engano
    let startX = null, dragged = false;
    stage.addEventListener('pointerdown', (e) => { startX = e.clientX; dragged = false; });
    window.addEventListener('pointerup', (e) => {
      if (startX === null) return;
      const dx = e.clientX - startX; startX = null;
      if (Math.abs(dx) >= SWIPE_MIN) { dragged = true; go(dx < 0 ? i + 1 : i - 1, dx < 0 ? 'next' : 'prev'); }
    });
    window.addEventListener('pointercancel', () => { startX = null; });
    stage.addEventListener('click', (e) => { if (dragged) { e.preventDefault(); e.stopPropagation(); dragged = false; } }, true);
    // o deslize no carrossel não troca a página do site (main.js escuta o toque na janela)
    ['touchstart', 'touchend'].forEach((ev) => stage.addEventListener(ev, (e) => e.stopPropagation(), { passive: true }));

    // inclinação 3D, parallax da imagem e brilho seguindo o mouse
    if (fine && !reduce) {
      root.addEventListener('pointermove', (e) => {
        const r = stage.getBoundingClientRect();
        const px = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
        const py = Math.min(1, Math.max(0, (e.clientY - r.top) / r.height));
        stage.style.setProperty('--ry', ((px - .5) * 6).toFixed(2) + 'deg');
        stage.style.setProperty('--rx', (-(py - .5) * 5).toFixed(2) + 'deg');
        stage.style.setProperty('--sx', (px * 100).toFixed(1) + '%');
        stage.style.setProperty('--sy', (py * 100).toFixed(1) + '%');
        stage.style.setProperty('--mx', (-(px - .5) * 22).toFixed(1) + 'px');
        stage.style.setProperty('--my', (-(py - .5) * 16).toFixed(1) + 'px');
      });
      root.addEventListener('pointerleave', () => {
        ['--ry', '--rx', '--mx', '--my'].forEach((v) => stage.style.removeProperty(v));
      });
    }

    go(0);
  });
})();
