/* =============================================
   home.js — video window interactions
   ============================================= */
(function () {
  'use strict';

  const win        = document.getElementById('vid-win');
  const handle     = document.getElementById('vid-drag-handle');
  const resizeHdl  = document.getElementById('resize-handle');
  const video      = document.getElementById('main-video');
  const timecode   = document.getElementById('vid-timecode');
  const chH        = document.getElementById('ch-h');
  const chV        = document.getElementById('ch-v');
  const page       = document.getElementById('page');

  // ── Centre initial (après le transform CSS) ──────────────────────────
  // On retire le transform CSS et on positionne via left/top
  function initWindow() {
    const pr = page.getBoundingClientRect();
    const wr = win.getBoundingClientRect();
    win.style.transform = 'none';
    win.style.left = ((pr.width  - wr.width)  / 2) + 'px';
    win.style.top  = ((pr.height - wr.height) / 2) + 'px';
  }
  // petit délai pour laisser le navigateur calculer la taille
  setTimeout(initWindow, 30);

  // ── Drag ─────────────────────────────────────────────────────────────
  let dragging = false;
  let dragOffX = 0, dragOffY = 0;

  handle.addEventListener('mousedown', e => {
    dragging = true;
    const r = win.getBoundingClientRect();
    const pr = page.getBoundingClientRect();
    dragOffX = e.clientX - r.left;
    dragOffY = e.clientY - (r.top - pr.top);
    win.style.boxShadow = '0 0 0 1px rgba(255,255,255,0.25), 0 40px 100px rgba(0,0,0,0.9), 0 0 80px rgba(255,255,255,0.06)';
    window.voidCursor && window.voidCursor.drag();
    e.preventDefault();
  });

  document.addEventListener('mousemove', e => {
    if (!dragging) return;
    const pr = page.getBoundingClientRect();
    let nx = e.clientX - dragOffX;
    let ny = e.clientY - pr.top - dragOffY;
    // Garder dans les limites de la page
    nx = Math.max(0, Math.min(nx, pr.width  - win.offsetWidth));
    ny = Math.max(0, Math.min(ny, pr.height - win.offsetHeight));
    win.style.left = nx + 'px';
    win.style.top  = ny + 'px';
  });

  document.addEventListener('mouseup', () => {
    if (!dragging) return;
    dragging = false;
    win.style.boxShadow = '';
    window.voidCursor && window.voidCursor.drop();
  });

  // ── Resize ───────────────────────────────────────────────────────────
  let resizing = false;
  let resizeStartX = 0, resizeStartY = 0;
  let resizeStartW = 0, resizeStartH = 0;

  resizeHdl.addEventListener('mousedown', e => {
    resizing = true;
    resizeStartX = e.clientX;
    resizeStartY = e.clientY;
    resizeStartW = win.offsetWidth;
    resizeStartH = win.offsetHeight;
    window.voidCursor && window.voidCursor.drag();
    e.preventDefault();
    e.stopPropagation();
  });

  document.addEventListener('mousemove', e => {
    if (!resizing) return;
    const dw = e.clientX - resizeStartX;
    const dh = e.clientY - resizeStartY;
    const nw = Math.max(240, resizeStartW + dw);
    const nh = Math.max(160, resizeStartH + dh);
    win.style.width  = nw + 'px';
    // height is driven by aspect-ratio on .vid-body, override:
    win.querySelector('.vid-body').style.aspectRatio = 'unset';
    win.querySelector('.vid-body').style.height = (nh - 33) + 'px';
    // Update size label
    const lbl = document.getElementById('vid-size-label');
    if (lbl) lbl.textContent = `${Math.round(nw)}×${Math.round(nh - 33)}`;
  });

  document.addEventListener('mouseup', () => {
    if (!resizing) return;
    resizing = false;
    window.voidCursor && window.voidCursor.drop();
  });

  // ── Parallax (mouse → window tilt) ───────────────────────────────────
  // La fenêtre suit légèrement la souris quand on ne drag pas
  let mouseX = 0, mouseY = 0;
  let parallaxX = 0, parallaxY = 0;
  const PARALLAX_STRENGTH = 14; // px max de déplacement

  document.addEventListener('mousemove', e => {
    const pr = page.getBoundingClientRect();
    // Normalize -1 → 1
    mouseX = (e.clientX / pr.width  - 0.5) * 2;
    mouseY = ((e.clientY - pr.top) / pr.height - 0.5) * 2;

    // Crosshair
    if (chH) chH.style.top  = (e.clientY - pr.top) + 'px';
    if (chV) chV.style.left = e.clientX + 'px';
  });

  // Smooth parallax via rAF
  function animateParallax() {
    if (!dragging && !resizing) {
      parallaxX += (mouseX * PARALLAX_STRENGTH - parallaxX) * 0.06;
      parallaxY += (mouseY * PARALLAX_STRENGTH - parallaxY) * 0.06;

      const rotX = -mouseY * 3; // deg tilt
      const rotY =  mouseX * 3;

      win.style.transform = `translate(${parallaxX}px, ${parallaxY}px) perspective(800px) rotateX(${rotX}deg) rotateY(${rotY}deg)`;
    } else {
      // reset transform when dragging (position is via left/top)
      win.style.transform = 'none';
      parallaxX = 0; parallaxY = 0;
    }
    requestAnimationFrame(animateParallax);
  }
  animateParallax();

  // ── Timecode display ─────────────────────────────────────────────────
  function toTC(t) {
    const h  = Math.floor(t / 3600);
    const m  = Math.floor((t % 3600) / 60);
    const s  = Math.floor(t % 60);
    const fr = Math.floor((t % 1) * 25); // 25fps
    return [h,m,s,fr].map(n => String(n).padStart(2,'0')).join(':');
  }

  if (video && timecode) {
    video.addEventListener('timeupdate', () => {
      timecode.textContent = toTC(video.currentTime);
    });
  }

  // ── Dot buttons behaviour ─────────────────────────────────────────────
  const dotRed = win.querySelector('.dot.red');
  const dotYellow = win.querySelector('.dot.yellow');
  const dotGreen  = win.querySelector('.dot.green');

  // Red = minimize (shrink to titlebar)
  let minimized = false;
  dotRed && dotRed.addEventListener('click', () => {
    const body = win.querySelector('.vid-body');
    minimized = !minimized;
    body.style.display = minimized ? 'none' : '';
  });

  // Yellow = toggle mute
  dotYellow && dotYellow.addEventListener('click', () => {
    if (video) video.muted = !video.muted;
  });

  // Green = fullscreen
  dotGreen && dotGreen.addEventListener('click', () => {
    if (video) {
      if (document.fullscreenElement) document.exitFullscreen();
      else video.requestFullscreen();
    }
  });

})();
