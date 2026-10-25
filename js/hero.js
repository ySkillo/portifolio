/* Animação interativa da foto da Home:
   a foto inclina em 3D seguindo o mouse e o círculo se move no sentido oposto (parallax).
   A flutuação, a entrada e o anel de luz são feitos em CSS. */
(() => {
  const photo = document.querySelector('.hero__photo');
  const img = document.getElementById('heroImg');
  const circle = document.querySelector('.hero__circle');
  if (!photo || !img) return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (!matchMedia('(pointer: fine)').matches) return;   // sem mouse (celular): só a animação CSS

  const MAX_ROT_Y = 9;   // graus (esquerda/direita)
  const MAX_ROT_X = 5;   // graus (cima/baixo)
  const MAX_SHIFT = 14;  // px que a foto desliza
  const CIRCLE_SHIFT = 26;

  let tx = 0, ty = 0, x = 0, y = 0;
  window.addEventListener('pointermove', (e) => {
    tx = e.clientX / innerWidth - 0.5;
    ty = e.clientY / innerHeight - 0.5;
  });
  window.addEventListener('pointerleave', () => { tx = ty = 0; });

  function tick() {
    x += (tx - x) * 0.07; y += (ty - y) * 0.07;           // suaviza
    img.style.setProperty('--ry', (x * MAX_ROT_Y).toFixed(2) + 'deg');
    img.style.setProperty('--rx', (-y * MAX_ROT_X).toFixed(2) + 'deg');
    img.style.setProperty('--px', (x * MAX_SHIFT).toFixed(1) + 'px');
    circle.style.setProperty('--cx', (-x * CIRCLE_SHIFT).toFixed(1) + 'px');
    circle.style.setProperty('--cy', (-y * CIRCLE_SHIFT * 0.6).toFixed(1) + 'px');
    requestAnimationFrame(tick);
  }
  tick();
})();
