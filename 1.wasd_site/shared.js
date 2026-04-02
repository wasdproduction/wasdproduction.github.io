/* =============================================
   VOID.STUDIO — shared.js
   Nav, cursor, contact panel, clock
   ============================================= */
(function () {
  'use strict';

  /* --- Cursor --- */
  const cursor = document.getElementById('cursor');
  if (cursor) {
    document.addEventListener('mousemove', e => {
      cursor.style.left = e.clientX + 'px';
      cursor.style.top  = e.clientY + 'px';
    });
  }

  function addHover(selector) {
    document.querySelectorAll(selector).forEach(el => {
      el.addEventListener('mouseenter', () => cursor && cursor.classList.add('hovering'));
      el.addEventListener('mouseleave', () => cursor && cursor.classList.remove('hovering'));
    });
  }
  addHover('a, button, .nav-link, .cp-close, #contact-trigger, .nav-arrow, .nav-arrow-prev, .hoverable');

  /* --- Clock --- */
  function tick() {
    const el = document.getElementById('nav-clock');
    if (!el) return;
    const now = new Date();
    const hh = String(now.getHours()).padStart(2,'0');
    const mm = String(now.getMinutes()).padStart(2,'0');
    const ss = String(now.getSeconds()).padStart(2,'0');
    el.textContent = `${hh}:${mm}:${ss}`;
  }
  tick();
  setInterval(tick, 1000);

  /* --- Active nav link --- */
  const page = document.body.dataset.page || '';
  document.querySelectorAll('.nav-link').forEach(l => {
    if (l.dataset.page === page) l.classList.add('active');
    else l.classList.remove('active');
  });
  const pathSpan = document.getElementById('active-page');
  if (pathSpan) pathSpan.textContent = page || 'Home';

  /* --- Contact panel --- */
  const panel   = document.getElementById('contact-panel');
  const trigger = document.getElementById('contact-trigger');
  const close   = document.getElementById('cp-close');
  if (trigger && panel) {
    trigger.addEventListener('click', () => panel.classList.toggle('open'));
  }
  if (close && panel) {
    close.addEventListener('click', () => panel.classList.remove('open'));
  }

  /* --- Expose cursor class helpers globally --- */
  window.voidCursor = {
    drag: () => cursor && cursor.classList.add('dragging'),
    drop: () => cursor && cursor.classList.remove('dragging'),
  };
})();
