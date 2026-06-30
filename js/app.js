/* ============================================================
   APP — orchestration for the modern Airawat site.
   Depends on GSAP + ScrollTrigger + Lenis (loaded via CDN as
   globals). Everything degrades gracefully if those are missing.
   ============================================================ */

import { injectChrome } from './components.js';
import { initShaderHero } from './shader.js';

const gsap = window.gsap;
const ScrollTrigger = window.ScrollTrigger;
const Lenis = window.Lenis;
const hasGSAP = !!gsap;
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = window.matchMedia('(pointer: fine)').matches;

if (hasGSAP && ScrollTrigger) gsap.registerPlugin(ScrollTrigger);

const PARTNERS = [
  { name: 'IIT Kanpur', img: 'images/partners/IIT Kanpur.png' },
  { name: 'IIT Delhi', img: 'images/partners/IIT Delhi.png' },
  { name: 'IIT Madras', img: 'images/partners/IIT Madras.png' },
  { name: 'IIT Gandhinagar', img: 'images/partners/IIT Gandhinagar.png' },
  { name: 'IISc', img: 'images/partners/IISc.jpg' },
  { name: 'NIT Calicut', img: 'images/partners/NIT Calicut.png' },
  { name: 'VSSUT', img: 'images/partners/VSSUT.png' },
  { name: 'PCI India', img: 'images/partners/PCI India.jpg' },
  { name: 'TCS', img: 'images/partners/Tata Consultancy Services.png' },
];

/* ---------- Lenis smooth scroll (synced to the GSAP ticker) ---------- */
let lenis = null;
function initLenis() {
  if (!Lenis || reduced) return;
  lenis = new Lenis({ lerp: 0.1, smoothWheel: true, wheelMultiplier: 1 });
  // Keep ScrollTrigger in sync, but drive Lenis from its OWN continuous rAF loop.
  // (Tying lenis.raf to gsap.ticker lets it stall when GSAP has no active tweens,
  //  so wheel input wouldn't register until some other event forced a tick.)
  if (hasGSAP && ScrollTrigger) {
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.lagSmoothing(0);
  }
  const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
  requestAnimationFrame(raf);
}

/* ---------- Same-page anchor links → smooth Lenis scroll ---------- */
function initAnchors() {
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href*="#"]');
    if (!a) return;
    const href = a.getAttribute('href') || '';
    const hash = href.slice(href.indexOf('#') + 1);
    const path = href.split('#')[0];
    const current = location.pathname.split('/').pop() || 'index.html';
    if (path && path !== current) return;          // different page → let the transition run
    const target = hash && document.getElementById(hash);
    if (!target) return;
    e.preventDefault();
    if (lenis) lenis.scrollTo(target, { offset: -100, duration: 1.1 });
    else target.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
    history.replaceState(null, '', '#' + hash);
  });
}

/* ---------- Word splitter for line reveals ---------- */
function splitLines(el) {
  const words = el.textContent.trim().split(/\s+/);
  el.innerHTML = words.map((w) => `<span class="line"><span>${w}</span></span>`).join(' ');
  return el.querySelectorAll('.line > span');
}

/* ---------- Preloader ---------- */
function runPreloader(onDone) {
  const pre = document.getElementById('preloader');
  const visited = sessionStorage.getItem('arf-visited');

  if (!pre) { onDone(); return; }

  if (visited || !hasGSAP || reduced) {
    // Skip the counter on internal navigations / no-gsap
    pre.remove();
    document.body.classList.remove('loading');
    onDone();
    return;
  }

  sessionStorage.setItem('arf-visited', '1');
  const num = pre.querySelector('.n');
  const bar = pre.querySelector('.preloader__bar i');
  const counter = { v: 0 };
  const tl = gsap.timeline();
  tl.to(counter, {
    v: 100, duration: 1.6, ease: 'power2.inOut',
    onUpdate: () => {
      num.textContent = Math.round(counter.v);
      bar.style.transform = `scaleX(${counter.v / 100})`;
    },
  })
    .to('.preloader__inner', { y: -30, opacity: 0, duration: 0.5, ease: 'power2.in' }, '+=0.15')
    .to(pre, {
      yPercent: -100, duration: 0.9, ease: 'expo.inOut',
      onComplete: () => { pre.remove(); document.body.classList.remove('loading'); },
    }, '-=0.1')
    .add(onDone, '-=0.5');
}

/* ---------- Intro (hero) ---------- */
function intro() {
  document.body.classList.add('ready');
  if (!hasGSAP || reduced) return;
  const hero = document.querySelector('[data-hero]');
  if (!hero) return;
  hero.querySelectorAll('[data-split]').forEach((el) => splitLines(el));
  const lines = hero.querySelectorAll('.line > span');
  const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
  tl.from(lines, { yPercent: 110, duration: 1.15, stagger: 0.07 }, 0);
  tl.from(hero.querySelectorAll('[data-hero-fade]'), { y: 24, opacity: 0, duration: 1, stagger: 0.1 }, 0.35);
}

/* ---------- Scroll reveals ---------- */
function initReveals() {
  if (!hasGSAP || !ScrollTrigger || reduced) return;   // reduced-motion → leave content static & visible

  // Whole-panel entrance: each dark/light band fades in as it enters the
  // viewport (the inner [data-reveal] content rises within it).
  gsap.utils.toArray('.tone').forEach((band) => {
    gsap.from(band, {
      autoAlpha: 0, duration: 0.95, ease: 'power2.out',
      scrollTrigger: { trigger: band, start: 'top 88%' },
    });
  });

  // generic blocks
  gsap.utils.toArray('[data-reveal]').forEach((el) => {
    const kids = el.hasAttribute('data-reveal-children') ? el.children : [el];
    gsap.from(kids, {
      y: 48, opacity: 0, duration: 1.15, ease: 'power3.out',
      stagger: el.hasAttribute('data-reveal-children') ? 0.1 : 0,
      scrollTrigger: { trigger: el, start: 'top 86%' },
    });
  });

  // headings split into rising words (not in the hero — that's the intro)
  gsap.utils.toArray('[data-split]:not([data-hero] [data-split])').forEach((el) => {
    const lines = splitLines(el);
    gsap.from(lines, {
      yPercent: 110, duration: 1.15, ease: 'expo.out', stagger: 0.07,
      scrollTrigger: { trigger: el, start: 'top 88%' },
    });
  });

  // image clip-reveal — feature media wipes up behind a mask as it enters
  gsap.utils.toArray('.media-frame').forEach((el) => {
    gsap.fromTo(el,
      { clipPath: 'inset(0% 0% 100% 0%)' },
      { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.1, ease: 'power3.inOut',
        scrollTrigger: { trigger: el, start: 'top 86%' } });
  });

  // parallax
  gsap.utils.toArray('[data-parallax]').forEach((el) => {
    const speed = parseFloat(el.dataset.parallax) || 0.2;
    gsap.to(el, {
      yPercent: -speed * 100, ease: 'none',
      scrollTrigger: { trigger: el.parentElement, start: 'top bottom', end: 'bottom top', scrub: true },
    });
  });

  // counters
  gsap.utils.toArray('[data-count]').forEach((el) => {
    const target = parseFloat(el.dataset.count);
    const suffix = el.dataset.suffix || '';
    const obj = { v: 0 };
    ScrollTrigger.create({
      trigger: el, start: 'top 88%', once: true,
      onEnter: () => gsap.to(obj, {
        v: target, duration: 1.6, ease: 'power2.out',
        onUpdate: () => { el.textContent = Math.round(obj.v) + suffix; },
      }),
    });
  });
}

/* ---------- Text marquees ---------- */
function initMarquees() {
  document.querySelectorAll('[data-marquee]').forEach((m) => {
    const row = m.querySelector('.marquee__row');
    if (!row) return;
    row.insertAdjacentHTML('afterend', `<div class="marquee__row" aria-hidden="true">${row.innerHTML}</div>`);
    if (!hasGSAP || reduced) return;
    const dir = m.dataset.marquee === 'right' ? 1 : -1;
    const speed = parseFloat(m.dataset.speed) || 30;
    gsap.to(m.querySelectorAll('.marquee__row'), {
      xPercent: dir * -100, duration: speed, ease: 'none', repeat: -1,
      modifiers: { xPercent: gsap.utils.wrap(-100, 0) },
    });
  });
}

/* ---------- Partners marquee ---------- */
function initPartners() {
  document.querySelectorAll('[data-partners]').forEach((host) => {
    const item = (p) => `<div class="partner"><img src="${encodeURI(p.img)}" alt="${p.name}" loading="lazy"><span class="partner__name">${p.name}</span></div>`;
    const set = PARTNERS.map(item).join('');
    host.innerHTML = `<div class="partners__track">${set}${set}</div>`;
    const track = host.querySelector('.partners__track');
    if (!hasGSAP || reduced) { host.style.overflowX = 'auto'; return; }
    const tween = gsap.to(track, { xPercent: -50, duration: 32, ease: 'none', repeat: -1 });
    host.addEventListener('pointerenter', () => tween.timeScale(0.15));
    host.addEventListener('pointerleave', () => tween.timeScale(1));
  });
}

/* ---------- Custom cursor ---------- */
function initCursor() {
  const cursor = document.getElementById('cursor');
  if (!cursor || !finePointer || reduced) return;
  document.body.classList.add('has-cursor');
  const ring = cursor.querySelector('.cursor__ring');
  const dot = cursor.querySelector('.cursor__dot');
  const label = cursor.querySelector('.cursor__label');
  let x = innerWidth / 2, y = innerHeight / 2, rx = x, ry = y;

  window.addEventListener('pointermove', (e) => { x = e.clientX; y = e.clientY; }, { passive: true });
  function loop() {
    // ring is the sole pointer now → track tightly (0.35) so it feels precise
    rx += (x - rx) * 0.35; ry += (y - ry) * 0.35;
    if (dot) dot.style.transform = `translate(${x}px, ${y}px) translate(-50%,-50%)`;
    ring.style.transform = `translate(${rx}px, ${ry}px) translate(-50%,-50%)`;
    requestAnimationFrame(loop);
  }
  loop();

  // Text fields → native caret (custom ring hidden, see .cursor-text in CSS).
  const textSel = 'input:not([type=submit]):not([type=button]):not([type=checkbox]):not([type=radio]), textarea, [contenteditable="true"]';
  const hoverSel = 'a, button, select, [data-cursor], .card';
  document.addEventListener('pointerover', (e) => {
    const t = e.target.closest('[data-cursor-label]');
    if (t) { label.textContent = t.dataset.cursorLabel || 'View'; document.body.classList.add('cursor-label'); return; }
    if (e.target.closest(textSel)) { document.body.classList.add('cursor-text'); return; }
    if (e.target.closest(hoverSel)) document.body.classList.add('cursor-hover');
  });
  document.addEventListener('pointerout', (e) => {
    if (e.target.closest('[data-cursor-label]')) document.body.classList.remove('cursor-label');
    if (e.target.closest(textSel)) document.body.classList.remove('cursor-text');
    if (e.target.closest(hoverSel)) document.body.classList.remove('cursor-hover');
  });
}

/* Magnetic buttons were removed — the pull everywhere felt gimmicky.
   Buttons keep their clean fill-on-hover instead. */

/* ---------- Card spotlight ---------- */
function initCardGlow() {
  document.querySelectorAll('.card').forEach((card) => {
    card.addEventListener('pointermove', (e) => {
      const r = card.getBoundingClientRect();
      card.style.setProperty('--mx', `${((e.clientX - r.left) / r.width) * 100}%`);
      card.style.setProperty('--my', `${((e.clientY - r.top) / r.height) * 100}%`);
    });
  });
}

/* ---------- Fullscreen menu ---------- */
function initMenu() {
  const btn = document.getElementById('menuBtn');
  const menu = document.getElementById('menu');
  if (!btn || !menu) return;
  const links = menu.querySelectorAll('.menu__link a');
  const aside = menu.querySelectorAll('.menu__aside > *');
  let open = false;
  let tl = null;

  if (hasGSAP) gsap.set(links, { yPercent: 110 });

  function openMenu() {
    open = true;
    document.body.classList.add('menu-open');
    btn.setAttribute('aria-expanded', 'true');
    btn.querySelector('.label').textContent = 'Close';
    menu.setAttribute('aria-hidden', 'false');
    menu.classList.add('open');
    if (lenis) lenis.stop();
    if (!hasGSAP) { menu.style.clipPath = 'inset(0 0 0 0)'; links.forEach((l) => (l.style.transform = 'none')); return; }
    tl = gsap.timeline();
    tl.to(menu, { clipPath: 'inset(0 0 0% 0)', duration: 0.8, ease: 'expo.inOut' })
      .to(links, { yPercent: 0, duration: 0.9, stagger: 0.07, ease: 'expo.out' }, '-=0.4')
      .from(aside, { y: 20, opacity: 0, duration: 0.6, stagger: 0.08, ease: 'power2.out' }, '-=0.7');
  }
  function closeMenu() {
    open = false;
    document.body.classList.remove('menu-open');
    btn.setAttribute('aria-expanded', 'false');
    btn.querySelector('.label').textContent = 'Menu';
    if (lenis) lenis.start();
    if (!hasGSAP) { menu.style.clipPath = 'inset(0 0 100% 0)'; menu.classList.remove('open'); menu.setAttribute('aria-hidden', 'true'); return; }
    gsap.timeline({ onComplete: () => { menu.classList.remove('open'); menu.setAttribute('aria-hidden', 'true'); gsap.set(links, { yPercent: 110 }); } })
      .to(links, { yPercent: -40, opacity: 0, duration: 0.4, stagger: 0.03, ease: 'power2.in' })
      .to(menu, { clipPath: 'inset(0 0 100% 0)', duration: 0.7, ease: 'expo.inOut' }, '-=0.1')
      .set(links, { opacity: 1 });
  }
  btn.addEventListener('click', () => (open ? closeMenu() : openMenu()));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && open) closeMenu(); });
  links.forEach((a) => a.addEventListener('click', () => { if (open) closeMenu(); }));
}

/* ---------- MPA page transitions ----------
   The overlay only covers when the visitor ACTUALLY navigates between pages
   (a flag is set right before leaving). A plain reload, a direct visit or a
   back/forward restore never covers — and a hard failsafe guarantees the
   overlay can never stay on screen. */
const NAV_FLAG = 'arf-nav';
function initTransitions() {
  const overlay = document.getElementById('transition');
  if (!overlay) return;

  const hide = () => {
    if (hasGSAP) { gsap.killTweensOf(overlay); gsap.set(overlay, { autoAlpha: 0 }); }
    else { overlay.style.opacity = '0'; overlay.style.visibility = 'hidden'; }
  };

  const arrivedViaNav = sessionStorage.getItem(NAV_FLAG) === '1';
  sessionStorage.removeItem(NAV_FLAG);

  let safety;

  // Arrived from an in-site navigation: hold the opaque cover until the new
  // page is actually READY (window load + fonts + a painted frame), THEN
  // cross-fade it away — revealing a fully-rendered page, no slide artefact.
  if (hasGSAP && !reduced && arrivedViaNav) {
    gsap.set(overlay, { autoAlpha: 1 });        // hold the cover (opaque)
    let done = false;
    const reveal = () => {
      if (done) return;
      done = true;
      clearTimeout(safety);
      if (ScrollTrigger) ScrollTrigger.refresh();   // measure now that layout is settled
      gsap.to(overlay, { autoAlpha: 0, duration: 0.55, ease: 'power2.inOut', onComplete: hide });
    };
    // two rAFs after the page is ready guarantee a correct first paint
    const whenReady = () => requestAnimationFrame(() => requestAnimationFrame(reveal));
    if (document.readyState === 'complete') whenReady();
    else window.addEventListener('load', whenReady, { once: true });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(whenReady).catch(() => {});
    safety = setTimeout(reveal, 2500);          // cap so it can never stay stuck
  } else {
    hide(); // reload / direct visit / reduced motion → never cover
    safety = setTimeout(hide, 1200);
  }

  // back/forward cache restore (page was frozen mid-exit) → clear it
  window.addEventListener('pageshow', (e) => { if (e.persisted) hide(); });

  if (!hasGSAP || reduced) return;

  document.addEventListener('click', (e) => {
    if (e.defaultPrevented) return;                       // anchor handler already took it
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return; // new tab etc.
    const a = e.target.closest('a');
    if (!a) return;
    const href = a.getAttribute('href') || '';
    if (a.target === '_blank' || a.hasAttribute('download')) return;
    if (/^(https?:|mailto:|tel:)/.test(href) || href.startsWith('#') || href === '') return;
    if (!/\.html(?:[#?].*)?$/.test(href)) return;
    const url = href.split('#')[0];
    const current = location.pathname.split('/').pop() || 'index.html';
    if (url === current) return;                          // same page (anchor handled elsewhere)
    e.preventDefault();
    clearTimeout(safety);
    sessionStorage.setItem(NAV_FLAG, '1');                // tell the next page to reveal-out
    // Fade the cover in, then navigate.
    gsap.to(overlay, { autoAlpha: 1, duration: 0.4, ease: 'power2.inOut', onComplete: () => { window.location.href = href; } });
  });
}

/* ---------- Capabilities read-out (sticky index that tracks scroll) ----------
   A thin band at the vertical centre decides which capability is "active";
   the sticky aside updates its number, name and progress bar to match.
   IntersectionObserver-based so it works even if GSAP fails. */
function initCapabilities() {
  const list = document.getElementById('capsList');
  const aside = document.querySelector('.caps__aside');
  if (!list || !aside) return;
  const cur = aside.querySelector('.cur');
  const now = aside.querySelector('.caps__now');
  const bar = aside.querySelector('.caps__bar i');
  const caps = Array.from(list.querySelectorAll('.cap'));
  const total = caps.length;
  if (!total) return;                       // nothing to track — never throw on empty
  let active = -1;

  function setActive(i) {
    if (i < 0 || i === active) return;
    active = i;
    const cap = caps[i];
    if (!cap) return;
    if (cur) cur.textContent = cap.dataset.n;
    if (now) now.textContent = cap.dataset.name;
    if (bar) bar.style.transform = `scaleX(${(i + 1) / total})`;
  }

  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) setActive(caps.indexOf(e.target)); });
    }, { rootMargin: '-48% 0px -48% 0px', threshold: 0 });
    caps.forEach((c) => io.observe(c));
  }
  setActive(0);
}

/* ---------- Testimonials (rotating quotes; visible auto-advance timer) ---------- */
function initTestimonials() {
  const root = document.querySelector('[data-tmonials]');
  if (!root) return;
  const items = Array.from(root.querySelectorAll('.tmonial'));
  const dots = Array.from(root.querySelectorAll('.tmonials__dot'));
  const fills = dots.map((d) => d.querySelector('i'));
  if (items.length < 2) return;
  const DUR = 6;
  let i = 0, tween = null;

  function paint(n) {
    dots.forEach((d, k) => {
      d.classList.toggle('is-active', k === n);
      d.setAttribute('aria-current', k === n ? 'true' : 'false');
    });
  }
  function show(n) {
    if (n === i) return;
    const prev = items[i], next = items[n];
    i = n; paint(n);
    if (hasGSAP && !reduced) {
      // gentle, mostly-crossfade transition (minimal travel) for a soft, premium feel
      gsap.to(prev, { autoAlpha: 0, y: -8, duration: 0.7, ease: 'power2.inOut' });
      gsap.fromTo(next, { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 1.0, ease: 'power2.out' });
    } else {
      items.forEach((it, k) => it.classList.toggle('is-active', k === n));
    }
  }
  // The fill inside the ACTIVE pill IS the timer — it drives the auto-advance.
  function start() {
    if (!hasGSAP || reduced) return;
    if (tween) tween.kill();
    fills.forEach((f) => f && gsap.set(f, { scaleX: 0 }));
    const fill = fills[i];
    if (!fill) return;
    tween = gsap.fromTo(fill, { scaleX: 0 }, {
      scaleX: 1, duration: DUR, ease: 'none',
      onComplete: () => { show((i + 1) % items.length); start(); },
    });
  }

  if (hasGSAP && !reduced) items.forEach((it, k) => { if (k) gsap.set(it, { autoAlpha: 0 }); });
  dots.forEach((d, k) => d.addEventListener('click', () => { show(k); start(); }));
  root.addEventListener('pointerenter', () => tween && tween.pause());   // pause on hover
  root.addEventListener('pointerleave', () => tween && tween.resume());
  paint(0);
  start();
}

/* ---------- Scroll progress indicator (premium wayfinding) ---------- */
function initScrollProgress() {
  const bar = document.querySelector('#scrollProgress i');
  if (!bar) return;
  function update() {
    const max = document.documentElement.scrollHeight - innerHeight;
    const p = max > 0 ? Math.min(1, Math.max(0, scrollY / max)) : 0;
    bar.style.transform = `scaleX(${p})`;
  }
  update();
  if (lenis) lenis.on('scroll', update);
  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
}

/* ---------- Graceful image fade-in (no pop as images decode) ---------- */
function initImageReveal() {
  document.querySelectorAll('main img, #site-footer img').forEach((img) => {
    if (img.complete && img.naturalWidth) return;     // already painted — leave it
    img.style.opacity = '0';
    img.style.transition = 'opacity 0.7s var(--ease)';
    const show = () => { img.style.opacity = '1'; };
    img.addEventListener('load', show, { once: true });
    img.addEventListener('error', show, { once: true });
    setTimeout(show, 4000);                            // safety: never stay invisible
  });
}

/* ---------- Navbar tone: flip nav colour when a dark band is behind it ---------- */
function initNavTone() {
  const topbar = document.getElementById('topbar');
  if (!topbar) return;
  let darks = Array.from(document.querySelectorAll('.tone-dark'));
  function update() {
    const y = 22;                 // a point inside the (fixed) navbar band
    let onDark = false;
    for (const el of darks) {
      const r = el.getBoundingClientRect();
      if (r.top <= y && r.bottom >= y) { onDark = true; break; }
    }
    topbar.classList.toggle('over-dark', onDark);
  }
  update();
  if (lenis) lenis.on('scroll', update);
  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', () => { darks = Array.from(document.querySelectorAll('.tone-dark')); update(); });
}

/* ---------- Hero depth (scroll-linked plasma zoom + headline parallax) ---------- */
function initScrollHero() {
  if (!hasGSAP || !ScrollTrigger || reduced) return;
  const hero = document.querySelector('.hero[data-hero]');
  if (!hero) return;
  const canvas = hero.querySelector('.hero__canvas');
  const inner = hero.querySelector('.hero__inner');
  if (canvas) gsap.to(canvas, {
    scale: 1.16, ease: 'none',
    scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true },
  });
  if (inner) gsap.to(inner, {
    yPercent: -12, autoAlpha: 0.25, ease: 'none',
    scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true },
  });
}

/* ---------- Scroll-velocity stretch on the capability photos (premium motion) ---------- */
function initVelocity() {
  if (!lenis || reduced) return;
  const imgs = document.querySelectorAll('.cap__media img');
  if (!imgs.length) return;
  let cur = 0;
  function loop() {
    const v = lenis.velocity || 0;
    const target = Math.max(-1, Math.min(1, v / 35));
    cur += (target - cur) * 0.08;
    const sy = (1 + Math.min(0.05, Math.abs(cur) * 0.05)).toFixed(3);
    for (let k = 0; k < imgs.length; k++) imgs[k].style.transform = `scaleY(${sy})`;
    requestAnimationFrame(loop);
  }
  loop();
}

/* ---------- Boot ---------- */
function boot() {
  injectChrome();
  initShaderHero();
  initLenis();
  initCursor();
  initMenu();
  initAnchors();
  initTransitions();
  initMarquees();
  initPartners();
  initCapabilities();
  initCardGlow();
  initTestimonials();
  initNavTone();
  initScrollProgress();
  initImageReveal();
  initVelocity();

  runPreloader(() => {
    intro();
    initReveals();
    initScrollHero();
    if (ScrollTrigger) {
      ScrollTrigger.refresh();
      // re-measure once everything (fonts, images, partner logos) has loaded
      window.addEventListener('load', () => ScrollTrigger.refresh());
      setTimeout(() => ScrollTrigger.refresh(), 600);
    }
  });
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
else boot();
