/* ============================================================
   SHARED CHROME — preloader, cursor, topbar, fullscreen menu,
   footer, page-transition overlay. One source of truth, injected
   into every page. Set the active item with <body data-page="…">.
   ============================================================ */

const LOGO = 'images/header/Airawat%20Logo%20copy.png';
const MARK = 'images/header/Airawat%20Logo.png';
const IITK = 'images/header/iitk%20logo.png';
const MOE = 'images/header/Ministry_of_Education_India.svg';

const PRIMARY = [
  { label: 'Home', href: 'index.html', key: 'home' },
  { label: 'About', href: 'about.html', key: 'about' },
  { label: 'Solutions', href: 'solutions.html', key: 'solutions' },
  { label: 'Media', href: 'news.html', key: 'media' },
  { label: 'Contact', href: 'contact.html', key: 'contact' },
];

const EXPLORE = [
  { label: 'Board of Directors', href: 'board-of-directors.html' },
  { label: 'Core Team', href: 'core-team.html' },
  { label: 'News & Updates', href: 'news.html' },
  { label: 'Blog', href: 'blog.html' },
];

const OPPS = [
  { label: 'Career', href: 'career.html' },
  { label: 'Tender', href: 'tender.html' },
  { label: 'Collaboration', href: 'collaboration.html' },
];

const SOCIALS = [
  { label: 'LinkedIn', href: 'https://www.linkedin.com/company/107833803/', icon: 'bi-linkedin' },
  { label: 'X', href: 'https://x.com/AirawatRF', icon: 'bi-twitter-x' },
  { label: 'Facebook', href: 'https://www.facebook.com/profile.php?id=61578955062059', icon: 'bi-facebook' },
  { label: 'Instagram', href: 'https://www.instagram.com/airawatrf', icon: 'bi-instagram' },
];

function once(id, html, where) {
  if (document.getElementById(id)) return;
  document.body.insertAdjacentHTML(where || 'beforeend', html);
}

function preloaderHTML() {
  return `
  <div class="preloader" id="preloader">
    <div class="preloader__inner">
      <img class="preloader__logo" src="${MARK}" alt="">
      <div class="preloader__count"><span class="n">0</span><span class="pct">%</span></div>
      <div class="preloader__bar"><i></i></div>
    </div>
  </div>`;
}

function cursorHTML() {
  return `
  <div class="cursor" id="cursor" aria-hidden="true">
    <div class="cursor__ring"><span class="cursor__label">View</span></div>
    <div class="cursor__dot"></div>
  </div>`;
}

function transitionHTML() {
  return `<div class="transition" id="transition" aria-hidden="true"><img src="${MARK}" alt=""></div>`;
}

function topbarHTML() {
  return `
  <a href="#main" class="skip">Skip to content</a>
  <div class="scroll-progress" id="scrollProgress" aria-hidden="true"><i></i></div>
  <header class="topbar" id="topbar">
    <a href="index.html" class="topbar__brand" data-cursor aria-label="Airawat — home">
      <img src="${LOGO}" alt="Airawat Research Foundation">
      <span class="divider"></span>
      <img src="${MOE}" alt="Ministry of Education, Government of India" style="height:32px">
    </a>
    <div class="topbar__right">
      <nav class="topbar__links" aria-label="Primary">
        ${PRIMARY.filter((p) => p.key !== 'home').map((p) => `<a href="${p.href}" data-key="${p.key}">${p.label}</a>`).join('')}
      </nav>
      <button class="menu-btn" id="menuBtn" aria-expanded="false" aria-controls="menu" data-cursor>
        <span class="label">Menu</span>
        <span class="bars" aria-hidden="true"><span></span><span></span></span>
      </button>
    </div>
  </header>`;
}

function menuHTML(active) {
  const big = PRIMARY.map((p, i) => `
        <div class="menu__link"><a href="${p.href}"${p.key === active ? ' aria-current="page"' : ''}>
          <span class="ix">0${i + 1}</span>${p.label}
        </a></div>`).join('');
  const group = (title, items) => `
      <div class="menu__group">
        <h4>${title}</h4>
        ${items.map((i) => `<a href="${i.href}">${i.label}</a>`).join('')}
      </div>`;
  return `
  <nav class="menu" id="menu" aria-label="Menu" aria-hidden="true">
    <div class="menu__primary">${big}</div>
    <div class="menu__aside">
      ${group('Explore', EXPLORE)}
      ${group('Opportunities', OPPS)}
      <div class="menu__group">
        <h4>Connect</h4>
        <a href="mailto:office@airawat.org">office@airawat.org</a>
        <a href="tel:+915122592621">+91 0512-2592621</a>
        <div class="menu__socials">${SOCIALS.map((s) => `<a href="${s.href}" target="_blank" rel="noopener">${s.label}</a>`).join('')}</div>
      </div>
    </div>
  </nav>`;
}

function footerHTML() {
  const col = (title, items) => `
        <div class="footer__col">
          <h4>${title}</h4>
          ${items.map((i) => `<a href="${i.href}">${i.label}</a>`).join('')}
        </div>`;
  return `
  <footer class="footer tone-dark" id="footer">
    <div class="wrap">
      <div class="footer__cta" data-reveal>
        <span class="eyebrow">Let's build sustainable cities</span>
        <a href="mailto:office@airawat.org" class="big" data-cursor-label="Email">Let's talk <i class="bi bi-arrow-up-right"></i></a>
      </div>
      <div class="footer__grid">
        <div class="footer__brand footer__col">
          <img src="${LOGO}" alt="Airawat Research Foundation" class="footer__logo" style="height:30px">
          <p>National Center of Excellence for AI in Sustainable Cities.</p>
          <div class="footer__led">
            <span>Led by</span>
            <img src="${IITK}" alt="IIT Kanpur">
            <span>IIT Kanpur</span>
          </div>
          <div class="footer__socials">
            ${SOCIALS.map((s) => `<a href="${s.href}" target="_blank" rel="noopener" aria-label="${s.label}"><i class="bi ${s.icon}"></i></a>`).join('')}
          </div>
        </div>
        ${col('Explore', [{ label: 'About', href: 'about.html' }, { label: 'Solutions', href: 'solutions.html' }, { label: 'News', href: 'news.html' }, { label: 'Blog', href: 'blog.html' }])}
        ${col('Opportunities', OPPS)}
        <div class="footer__col">
          <h4>Contact</h4>
          <address>
            <a href="https://maps.google.com/?q=Technopark+Phase-I+IIT+Kanpur+Kanpur+208016" target="_blank" rel="noopener">Technopark Phase-I, IIT Kanpur, Kanpur 208016</a>
            <a href="mailto:office@airawat.org">office@airawat.org</a>
            <a href="tel:+915122592621">+91 0512-2592621</a>
          </address>
        </div>
      </div>
      <div class="footer__bottom">
        <span>© 2026 Airawat Research Foundation</span>
        <span><a href="privacy.html">Privacy</a> &nbsp; <a href="terms.html">Terms</a> &nbsp; <a href="login.html">Member Login</a></span>
      </div>
      <div class="footer__wordmark" aria-hidden="true">AIRAWAT</div>
    </div>
  </footer>`;
}

export function injectChrome() {
  const active = (document.body && document.body.dataset.page) || '';

  once('preloader', preloaderHTML(), 'afterbegin');
  once('cursor', cursorHTML());
  once('transition', transitionHTML());

  const header = document.getElementById('site-header');
  const footer = document.getElementById('site-footer');
  if (header) header.innerHTML = topbarHTML() + menuHTML(active);
  if (footer) footer.innerHTML = footerHTML();

  document.querySelectorAll('.topbar__links a').forEach((a) => {
    if (a.dataset.key === active) a.classList.add('active');
  });

  const main = document.querySelector('main');
  if (main && !main.id) { main.id = 'main'; main.setAttribute('tabindex', '-1'); }
}
