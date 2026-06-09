/* ═══════════════════════════════════════════════════
   Cocolashes Bielefeld — Main App Controller
   ═══════════════════════════════════════════════════ */

/* ══════════════════════
   Business Data
══════════════════════ */
const BUSINESS = {
  name:       'Cocolashes Bielefeld',
  owner:      'Claudia Gajda',
  phone:      '+4917643456902',
  email:      'cocolashes-bielefeld@gmx.de',
  address:    'Gerichtstraße 13',
  city:       '33602 Bielefeld',
  instagram:  'cocolashesbielefeld',
  bookingUrl: 'https://cocolashesbielefeld.simplybook.it/v2/',
  hours: [
    { day: 'monday',    open: '16:30', close: '20:00' },
    { day: 'tuesday',   open: '16:30', close: '20:00' },
    { day: 'wednesday', open: '16:30', close: '20:00' },
    { day: 'thursday',  open: '16:30', close: '20:00' },
    { day: 'friday',    open: '10:00', close: '14:00' },
    { day: 'saturday',  open: null,    close: null },
    { day: 'sunday',    open: null,    close: null },
  ],
};

/* ── Service categories & items ── */
const SERVICES = [
  {
    id: 'neumodellage',
    category: { de: 'Neumodellage', en: 'New Set' },
    categoryDesc: { de: 'Vollständige Neuanlage – Ersttermin', en: 'Full new set – first appointment' },
    emoji: '🌸',
    items: [
      {
        name: 'Neumodellage 1:1',
        desc: { de: 'Eine klassische Verlängerung. Verschafft mehr Biegung und eine Verlängerung der Naturwimpern.', en: 'Classic extension with more curl and length for your natural lashes.' },
        duration: 90, price: 80, styleId: 'classic',
      },
      {
        name: 'Neumodellage Light Volumen',
        desc: { de: 'Light Volumen für nicht nur mehr Länge, sondern auch mehr Volumen und Dichte.', en: 'Light volume for not just more length, but also more volume and density.' },
        duration: 90, price: 90, styleId: 'volume',
      },
      {
        name: 'Neumodellage Mega Volumen',
        desc: { de: 'Maximales Volumen für einen dramatischen, dichten Look.', en: 'Maximum volume for a dramatic, full look.' },
        duration: 90, price: 100, styleId: 'megaVolume',
      },
      {
        name: 'Bloom Eyes Neumodellage',
        desc: { de: 'Wispy, Wet mit Farbe deiner Wahl. Für den extravaganten natürlichen Look.', en: 'Wispy, wet with colour of your choice. For an extravagant natural look.' },
        duration: 120, price: 95, styleId: 'natural',
        badge: { de: 'Bestseller', en: 'Bestseller' },
      },
    ],
  },
  {
    id: 'auffuell-1-1',
    category: { de: 'Auffülltermin 1:1', en: 'Refill 1:1' },
    categoryDesc: { de: 'Classic – Nachfülltermin', en: 'Classic – refill appointment' },
    emoji: '✨',
    items: [
      {
        name: { de: 'Auffülltermin 1:1 (2–3 Wochen)', en: 'Refill 1:1 (2–3 weeks)' },
        desc: { de: 'Für Kunden, deren letzter Termin 2–3 Wochen zurückliegt.', en: 'For clients whose last appointment was 2–3 weeks ago.' },
        duration: 60, price: 40, styleId: 'classic',
      },
      {
        name: { de: 'Auffülltermin 1:1 (3–4 Wochen)', en: 'Refill 1:1 (3–4 weeks)' },
        desc: { de: 'Für Kunden, deren letzter Termin 3–4 Wochen zurückliegt.', en: 'For clients whose last appointment was 3–4 weeks ago.' },
        duration: 60, price: 50, styleId: 'classic',
      },
    ],
  },
  {
    id: 'auffuell-light',
    category: { de: 'Auffülltermin Light Volumen', en: 'Refill Light Volume' },
    categoryDesc: { de: 'Light Volume – Nachfülltermin', en: 'Light Volume – refill appointment' },
    emoji: '💫',
    items: [
      {
        name: { de: 'Auffülltermin Light Volumen (2–3 Wochen)', en: 'Refill Light Volume (2–3 weeks)' },
        duration: 60, price: 50, styleId: 'volume',
      },
      {
        name: { de: 'Auffülltermin Light Volumen (3–4 Wochen)', en: 'Refill Light Volume (3–4 weeks)' },
        duration: 60, price: 60, styleId: 'volume',
      },
    ],
  },
  {
    id: 'auffuell-mega',
    category: { de: 'Auffülltermin Mega Volumen', en: 'Refill Mega Volume' },
    categoryDesc: { de: 'Mega Volume – Nachfülltermin', en: 'Mega Volume – refill appointment' },
    emoji: '🌟',
    items: [
      {
        name: { de: 'Auffülltermin Mega Volumen (2–3 Wochen)', en: 'Refill Mega Volume (2–3 weeks)' },
        duration: 60, price: 60, styleId: 'megaVolume',
      },
      {
        name: { de: 'Auffülltermin Mega Volumen (3–4 Wochen)', en: 'Refill Mega Volume (3–4 weeks)' },
        duration: 60, price: 70, styleId: 'megaVolume',
      },
    ],
  },
  {
    id: 'bloom-auffuell',
    category: { de: 'Bloom Eyes Auffüllen', en: 'Bloom Eyes Refill' },
    categoryDesc: { de: 'Wispy Bloom Eyes – Nachfülltermin', en: 'Wispy Bloom Eyes – refill appointment' },
    emoji: '🌺',
    items: [
      {
        name: { de: 'Bloom Eyes (Auffüllen 2–3 Wochen)', en: 'Bloom Eyes Refill (2–3 weeks)' },
        duration: 60, price: 55, styleId: 'natural',
      },
      {
        name: { de: 'Bloom Eyes (Auffüllen 3–4 Wochen)', en: 'Bloom Eyes Refill (3–4 weeks)' },
        duration: 60, price: 65, styleId: 'natural',
      },
    ],
  },
  {
    id: 'sonstiges',
    category: { de: 'Sonstiges', en: 'Other Services' },
    categoryDesc: { de: 'Weitere Leistungen', en: 'Additional services' },
    emoji: '🔧',
    items: [
      {
        name: { de: 'Wimpern entfernen', en: 'Lash removal' },
        desc: { de: 'Professionelle und schonende Entfernung der Wimpernverlängerung.', en: 'Professional and gentle removal of lash extensions.' },
        duration: 30, price: 10, styleId: null,
      },
      {
        name: { de: 'Modellarbeit', en: 'Model work' },
        desc: { de: 'Du hast eine Anzeige gesehen, dass ich Modelle suche? Buch dich gerne dafür ein.', en: 'Saw our ad looking for models? Book yourself in here.' },
        duration: 120, price: 50, styleId: null,
      },
    ],
  },
];

/* ══════════════════════
   NRW Holidays
══════════════════════ */
function getEasterSunday(year) {
  const a = year % 19, b = Math.floor(year / 100), c = year % 100;
  const d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4), k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day   = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function getNRWHolidays(year) {
  const e = getEasterSunday(year);
  return [
    { date: new Date(year, 0, 1),   name: { de: 'Neujahr',                  en: "New Year's Day" } },
    { date: addDays(e, -2),          name: { de: 'Karfreitag',               en: 'Good Friday' } },
    { date: addDays(e,  1),          name: { de: 'Ostermontag',              en: 'Easter Monday' } },
    { date: new Date(year, 4, 1),   name: { de: 'Tag der Arbeit',           en: 'Labour Day' } },
    { date: addDays(e, 39),          name: { de: 'Christi Himmelfahrt',      en: 'Ascension Day' } },
    { date: addDays(e, 50),          name: { de: 'Pfingstmontag',            en: 'Whit Monday' } },
    { date: addDays(e, 60),          name: { de: 'Fronleichnam',             en: 'Corpus Christi' } },
    { date: new Date(year, 9, 3),   name: { de: 'Tag der deutschen Einheit',en: 'German Unity Day' } },
    { date: new Date(year, 10, 1),  name: { de: 'Allerheiligen',            en: "All Saints' Day" } },
    { date: new Date(year, 11, 25), name: { de: '1. Weihnachtstag',         en: '1st Christmas Day' } },
    { date: new Date(year, 11, 26), name: { de: '2. Weihnachtstag',         en: '2nd Christmas Day' } },
  ];
}

function getUpcomingHolidays(count = 6) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const years = [today.getFullYear(), today.getFullYear() + 1];
  return years
    .flatMap(y => getNRWHolidays(y))
    .filter(h => h.date >= today)
    .sort((a, b) => a.date - b.date)
    .slice(0, count);
}

function formatDate(date, lang) {
  return date.toLocaleDateString(lang === 'en' ? 'en-GB' : 'de-DE', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  });
}

function isHoliday(date) {
  const y = date.getFullYear();
  const str = `${y}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
  return getNRWHolidays(y).some(h => {
    const hs = `${h.date.getFullYear()}-${String(h.date.getMonth()+1).padStart(2,'0')}-${String(h.date.getDate()).padStart(2,'0')}`;
    return hs === str;
  });
}

/* ══════════════════════
   App State
══════════════════════ */
const state = {
  lang:              'de',
  stream:            null,
  capturedImage:     null,
  landmarks:         null,
  faceShape:         null,
  activeStyle:       null,
  recommendedStyle:  null,
  servicesBuilt:     false,
  infoBuilt:         false,
};

/* ── DOM refs ── */
const $ = id => document.getElementById(id);

const dom = {
  screens: {
    splash:    $('screen-splash'),
    camera:    $('screen-camera'),
    analyzing: $('screen-analyzing'),
    results:   $('screen-results'),
    services:  $('screen-services'),
    info:      $('screen-info'),
  },
  tabBar:         $('tab-bar'),
  progressBar:    $('progress-bar'),
  resultCanvas:   $('result-canvas'),
  captureCanvas:  $('capture-canvas'),
  video:          $('video'),
  toast:          $('toast'),
};

const TAB_SCREENS = ['results', 'services', 'info'];

const FACE_ICONS = {
  oval: '⬭', round: '⬤', square: '■', heart: '♡', diamond: '◆', oblong: '▭',
};

/* ══════════════════════
   Screen navigation
══════════════════════ */
function showScreen(name) {
  Object.entries(dom.screens).forEach(([key, el]) => {
    el.classList.toggle('active', key === name);
  });

  const showTab = TAB_SCREENS.includes(name);
  dom.tabBar.classList.toggle('hidden', !showTab);

  if (showTab) {
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.screen === name);
    });
  }

  if (name !== 'camera' && state.stream) stopCamera();
}

/* ══════════════════════
   Toast
══════════════════════ */
let _toastTimer;
function showToast(msg) {
  dom.toast.textContent = msg;
  dom.toast.classList.remove('hidden');
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => dom.toast.classList.add('hidden'), 3000);
}

/* ══════════════════════
   Language
══════════════════════ */
function initLang() {
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      state.lang = btn.dataset.lang;
      setLang(state.lang);
      refreshDynamicText();
    });
  });
}

function refreshDynamicText() {
  if (state.faceShape) {
    $('face-shape-text').textContent = t('faceShapes')[state.faceShape] || state.faceShape;
    // Refresh carousel slide labels and info text for new lang
    if (state.slides) {
      const container = $('swipe-container');
      state.slides.forEach((slide, i) => {
        const s = getAllStyles().find(x => x.id === slide.styleId);
        const nameEl = container.children[i]?.querySelector('.slide-name-text');
        if (nameEl) nameEl.textContent = s.name[state.lang] || s.name.de;
      });
      updateStyleInfo(state.currentSlide);
    }
  }
  if (state.servicesBuilt) buildServicesScreen();
  if (state.infoBuilt)     buildInfoScreen();
}

/* ══════════════════════
   Camera
══════════════════════ */
async function startCamera() {
  try {
    state.stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 960 } },
    });
    dom.video.srcObject = state.stream;
    $('camera-error').classList.add('hidden');
  } catch {
    $('camera-error').classList.remove('hidden');
  }
}

function stopCamera() {
  if (state.stream) {
    state.stream.getTracks().forEach(t => t.stop());
    state.stream = null;
  }
  dom.video.srcObject = null;
}

function captureFromVideo() {
  const v = dom.video;
  const c = dom.captureCanvas;
  const w = v.videoWidth || 640, h = v.videoHeight || 480;
  c.width = w; c.height = h;
  const ctx = c.getContext('2d');
  ctx.save(); ctx.translate(w, 0); ctx.scale(-1, 1);
  ctx.drawImage(v, 0, 0, w, h);
  ctx.restore();
  return c;
}

function loadImageFromFile(file) {
  return new Promise((res, rej) => {
    const reader = new FileReader();
    reader.onload = e => {
      const img = new Image();
      img.onload = () => res(img);
      img.onerror = rej;
      img.src = e.target.result;
    };
    reader.onerror = rej;
    reader.readAsDataURL(file);
  });
}

/* ══════════════════════
   MediaPipe
══════════════════════ */
let _faceMesh = null;

async function getFaceMesh() {
  if (_faceMesh) return _faceMesh;
  return new Promise((res, rej) => {
    if (typeof FaceMesh === 'undefined') { rej(new Error('FaceMesh not loaded')); return; }
    const fm = new FaceMesh({
      locateFile: f => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@0.4.1633559619/${f}`,
    });
    fm.setOptions({ maxNumFaces: 1, refineLandmarks: true, minDetectionConfidence: 0.5, minTrackingConfidence: 0.5 });
    fm.onResults(r => { fm._last = r; });
    fm.initialize().then(() => { _faceMesh = fm; res(fm); }).catch(rej);
  });
}

async function detectFaceLandmarks(src) {
  const fm = await getFaceMesh();
  return new Promise(async res => {
    fm.onResults(r => {
      res(r.multiFaceLandmarks && r.multiFaceLandmarks.length > 0
        ? r.multiFaceLandmarks[0] : null);
    });
    await fm.send({ image: src });
  });
}

/* ══════════════════════
   Analysis flow
══════════════════════ */
async function analyzeAndShow(imgSrc) {
  state.capturedImage = imgSrc;
  showScreen('analyzing');
  dom.progressBar.style.width = '0%';

  const [landmarks] = await Promise.all([
    detectFaceLandmarks(imgSrc).catch(() => null),
    animateProgress(2200),
  ]);

  state.landmarks = landmarks;

  const w = imgSrc.naturalWidth  || imgSrc.width  || 640;
  const h = imgSrc.naturalHeight || imgSrc.height || 480;

  if (landmarks) {
    state.faceShape = detectFaceShape(landmarks, w, h);
    $('no-face-msg').classList.add('hidden');
  } else {
    state.faceShape = 'oval';
    $('no-face-msg').classList.remove('hidden');
    showToast(t('noFaceToast'));
  }

  const rec = getRecommendation(state.faceShape);
  state.recommendedStyle = rec.primary;
  state.activeStyle      = rec.primary;

  buildCarousel();
  showScreen('results');
}

function animateProgress(ms) {
  return new Promise(done => {
    const bar = dom.progressBar;
    const start = performance.now();
    function step(now) {
      const pct = Math.min(100, ((now - start) / ms) * 100);
      bar.style.width = pct + '%';
      pct < 100 ? requestAnimationFrame(step) : done();
    }
    requestAnimationFrame(step);
  });
}

/* ══════════════════════
   Carousel / Swipe
══════════════════════ */

function getStyleOrder() {
  const all = getAllStyles().map(s => s.id);
  const rest = all.filter(id => id !== state.recommendedStyle);
  return [state.recommendedStyle, ...rest];
}

function buildCarousel() {
  const lang = state.lang;
  const rec  = getRecommendation(state.faceShape);

  // Face mini bar
  $('face-shape-icon').textContent = FACE_ICONS[state.faceShape] || '⬡';
  $('face-shape-text').textContent = t('faceShapes')[state.faceShape] || state.faceShape;

  // Pre-render every style to a data URL
  const styleOrder = getStyleOrder();
  state.styleOrder = styleOrder;
  state.slides = styleOrder.map(styleId => {
    const canvas = document.createElement('canvas');
    renderLashesOnCanvas(canvas, state.capturedImage, state.landmarks, styleId);
    return { styleId, dataUrl: canvas.toDataURL('image/jpeg', 0.93) };
  });

  // Build slides in DOM
  const container = $('swipe-container');
  container.innerHTML = '';
  state.slides.forEach((slide, i) => {
    const s   = getAllStyles().find(x => x.id === slide.styleId);
    const isRec = i === 0;
    const el  = document.createElement('div');
    el.className = 'swipe-slide';
    el.innerHTML = `
      <img src="${slide.dataUrl}" alt="${s.name[lang]||s.name.de}" draggable="false">
      ${isRec ? `<div class="slide-top-badge">✦ Top Pick</div>` : ''}
      <div class="slide-name-overlay">
        <span class="slide-name-emoji">${s.emoji}</span>
        <span class="slide-name-text">${s.name[lang]||s.name.de}</span>
      </div>`;
    container.appendChild(el);
  });

  // Dots
  const dotsEl = $('swipe-dots');
  dotsEl.innerHTML = '';
  state.slides.forEach((_, i) => {
    const dot = document.createElement('div');
    dot.className = 'swipe-dot' + (i === 0 ? ' active' : '');
    dot.addEventListener('click', () => goToSlide(i));
    dotsEl.appendChild(dot);
  });

  // Init state
  state.currentSlide = 0;
  updateStyleInfo(0);
  initSwipeEvents(container);
  updateArrows();
}

function goToSlide(index) {
  const container = $('swipe-container');
  const total = state.slides.length;
  index = Math.max(0, Math.min(total - 1, index));
  state.currentSlide = index;
  container.scrollTo({ left: index * container.offsetWidth, behavior: 'smooth' });
  updateDots(index);
  updateStyleInfo(index);
  updateArrows();
}

function updateDots(index) {
  document.querySelectorAll('.swipe-dot').forEach((d, i) => {
    d.classList.toggle('active', i === index);
  });
}

function updateArrows() {
  const prev = $('swipe-prev');
  const next = $('swipe-next');
  if (!prev || !next) return;
  const i = state.currentSlide;
  const n = state.slides ? state.slides.length : 0;
  prev.classList.toggle('hidden', i === 0);
  next.classList.toggle('hidden', i >= n - 1);
}

function updateStyleInfo(index) {
  if (!state.slides) return;
  const lang    = state.lang;
  const styleId = state.slides[index].styleId;
  const s       = getAllStyles().find(x => x.id === styleId);
  const isRec   = styleId === state.recommendedStyle;
  const rec     = getRecommendation(state.faceShape);

  $('current-style-emoji').textContent   = s.emoji;
  $('current-style-name').textContent    = s.name[lang] || s.name.de;
  $('current-style-subdesc').textContent = s.desc[lang] || s.desc.de;
  $('rec-badge').classList.toggle('hidden', !isRec);
  $('why-text').textContent = isRec
    ? (rec.reason[lang] || rec.reason.de)
    : (s.desc[lang] || s.desc.de);

  // Hide swipe hint after first swipe
  if (index > 0) {
    const hint = $('swipe-hint');
    if (hint) hint.style.opacity = '0';
  }

  state.activeStyle = styleId;
}

function initSwipeEvents(container) {
  // Scroll-snap does the heavy lifting; we just listen for scroll end
  let _scrollTimer;
  container.addEventListener('scroll', () => {
    clearTimeout(_scrollTimer);
    _scrollTimer = setTimeout(() => {
      const w = container.offsetWidth;
      if (!w) return;
      const newIndex = Math.round(container.scrollLeft / w);
      if (newIndex !== state.currentSlide) {
        state.currentSlide = newIndex;
        updateDots(newIndex);
        updateStyleInfo(newIndex);
        updateArrows();
      }
    }, 60);
  }, { passive: true });
}

/* ══════════════════════
   Services Screen
══════════════════════ */
function buildServicesScreen() {
  const container = $('services-scroll');
  const lang = state.lang;
  container.innerHTML = '';
  state.servicesBuilt = true;

  // Intro note
  const note = document.createElement('p');
  note.className = 'services-note';
  note.textContent = t('priceNote');
  container.appendChild(note);

  SERVICES.forEach(cat => {
    // Category header
    const catEl = document.createElement('div');
    catEl.className = 'service-category';
    catEl.innerHTML = `
      <div class="service-cat-header">
        <span class="service-cat-emoji">${cat.emoji}</span>
        <div>
          <h3 class="service-cat-name">${cat.category[lang]||cat.category.de}</h3>
          <p class="service-cat-desc">${cat.categoryDesc[lang]||cat.categoryDesc.de}</p>
        </div>
      </div>`;
    container.appendChild(catEl);

    // Service items
    cat.items.forEach(item => {
      const name = typeof item.name === 'object' ? (item.name[lang]||item.name.de) : item.name;
      const desc = item.desc ? (item.desc[lang]||item.desc.de) : '';
      const badge = item.badge ? (item.badge[lang]||item.badge.de) : null;

      const card = document.createElement('div');
      card.className = 'service-card';
      card.innerHTML = `
        <div class="service-card-top">
          <div class="service-card-info">
            <div class="service-name-row">
              <span class="service-name">${name}</span>
              ${badge ? `<span class="service-badge">${badge}</span>` : ''}
            </div>
            ${desc ? `<p class="service-desc">${desc}</p>` : ''}
            <div class="service-meta">
              <span class="service-dur">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                ${item.duration} ${t('minLabel')}
              </span>
              ${item.styleId ? `<span class="service-style-tag">${getStyleName(item.styleId, lang)}</span>` : ''}
            </div>
          </div>
          <div class="service-price-col">
            <span class="service-price">${item.price},00&nbsp;€</span>
          </div>
        </div>
        <a class="btn-book-service" href="${BUSINESS.bookingUrl}" target="_blank" rel="noopener">
          ${t('bookBtn')}
        </a>`;
      container.appendChild(card);
    });
  });

  // Book all CTA
  const cta = document.createElement('div');
  cta.className = 'services-cta';
  cta.innerHTML = `
    <a class="btn-primary" href="${BUSINESS.bookingUrl}" target="_blank" rel="noopener">
      ${t('bookAtSimplyBook')}
    </a>`;
  container.appendChild(cta);
}

function getStyleName(styleId, lang) {
  const s = getAllStyles().find(x => x.id === styleId);
  return s ? (s.name[lang] || s.name.de) : '';
}

/* ══════════════════════
   Info Screen
══════════════════════ */
function buildInfoScreen() {
  const container = $('info-scroll');
  const lang = state.lang;
  container.innerHTML = '';
  state.infoBuilt = true;

  // ── Opening hours ──
  const hoursCard = document.createElement('div');
  hoursCard.className = 'info-card';
  const dayMap = { de: ['Montag','Dienstag','Mittwoch','Donnerstag','Freitag','Samstag','Sonntag'],
                   en: ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'] };
  const daysLabels = dayMap[lang] || dayMap.de;
  const dayKeys = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];
  const rowsHtml = BUSINESS.hours.map((h, i) => {
    const isToday = new Date().getDay() === (i + 1) % 7;
    const todayCls = isToday ? ' hours-today' : '';
    const timeStr = h.open ? `${h.open}–${h.close}` : t('closedText');
    const closedCls = !h.open ? ' hours-closed' : '';
    return `<tr class="${todayCls}">
      <td class="hours-day">${daysLabels[i]}</td>
      <td class="hours-time${closedCls}">${timeStr}</td>
    </tr>`;
  }).join('');

  hoursCard.innerHTML = `
    <div class="info-card-header">
      <span class="info-icon">🕐</span>
      <h3>${t('hoursTitle')}</h3>
    </div>
    <table class="hours-table">${rowsHtml}</table>`;
  container.appendChild(hoursCard);

  // ── Upcoming NRW holidays ──
  const holidays = getUpcomingHolidays(6);
  const holidayCard = document.createElement('div');
  holidayCard.className = 'info-card info-card-holiday';
  holidayCard.innerHTML = `
    <div class="info-card-header">
      <span class="info-icon">🎌</span>
      <h3>${t('upcomingHolidays')}</h3>
    </div>
    <p class="holiday-note">${t('holidayNote')}</p>
    <div class="holiday-pills">
      ${holidays.map(h => `
        <div class="holiday-pill">
          <span class="holiday-date">${formatDate(h.date, lang)}</span>
          <span class="holiday-name">${h.name[lang]||h.name.de}</span>
        </div>`).join('')}
    </div>`;
  container.appendChild(holidayCard);

  // ── Contact ──
  const contactCard = document.createElement('div');
  contactCard.className = 'info-card';
  contactCard.innerHTML = `
    <div class="info-card-header">
      <span class="info-icon">📞</span>
      <h3>${t('contactTitle')}</h3>
    </div>
    <div class="contact-links">
      <a class="contact-link" href="tel:${BUSINESS.phone}">
        <span class="contact-link-icon">📱</span>
        <span>${BUSINESS.phone}</span>
      </a>
      <a class="contact-link" href="mailto:${BUSINESS.email}">
        <span class="contact-link-icon">✉️</span>
        <span>${BUSINESS.email}</span>
      </a>
      <a class="contact-link" href="https://www.instagram.com/${BUSINESS.instagram}" target="_blank" rel="noopener">
        <span class="contact-link-icon">📸</span>
        <span>@${BUSINESS.instagram}</span>
      </a>
      <a class="contact-link" href="${BUSINESS.bookingUrl}" target="_blank" rel="noopener">
        <span class="contact-link-icon">🌐</span>
        <span>cocolashesbielefeld.simplybook.it</span>
      </a>
    </div>`;
  container.appendChild(contactCard);

  // ── Address ──
  const addrCard = document.createElement('div');
  addrCard.className = 'info-card';
  const mapsUrl = `https://maps.google.com/?q=${encodeURIComponent(BUSINESS.address + ', ' + BUSINESS.city)}`;
  addrCard.innerHTML = `
    <div class="info-card-header">
      <span class="info-icon">📍</span>
      <h3>${t('addressTitle')}</h3>
    </div>
    <a class="address-link" href="${mapsUrl}" target="_blank" rel="noopener">
      <div class="address-text">
        <p>${BUSINESS.address}</p>
        <p>${BUSINESS.city}</p>
      </div>
      <span class="address-arrow">→ Google Maps</span>
    </a>`;
  container.appendChild(addrCard);

  // Bottom spacer
  const spacer = document.createElement('div');
  spacer.style.height = '16px';
  container.appendChild(spacer);
}

/* ══════════════════════
   Download
══════════════════════ */
function downloadResult() {
  const slide = state.slides && state.slides[state.currentSlide];
  if (!slide) return;
  const link   = document.createElement('a');
  link.download = `cocolashes-${slide.styleId}.jpg`;
  link.href     = slide.dataUrl;
  link.click();
  showToast(t('saved'));
}

/* ══════════════════════
   Tab Bar
══════════════════════ */
function initTabBar() {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.screen;
      if (target === 'results' && !state.capturedImage) {
        showScreen('camera');
        startCamera();
        return;
      }
      showScreen(target);
      if (target === 'services' && !state.servicesBuilt) buildServicesScreen();
      if (target === 'info'     && !state.infoBuilt)     buildInfoScreen();
    });
  });
}

/* ══════════════════════
   Event bindings
══════════════════════ */
function initEvents() {
  // Splash buttons
  $('btn-start').addEventListener('click', () => {
    showScreen('camera');
    startCamera();
  });
  $('btn-splash-services').addEventListener('click', () => {
    showScreen('services');
    buildServicesScreen();
  });
  $('btn-splash-info').addEventListener('click', () => {
    showScreen('info');
    buildInfoScreen();
  });

  // Camera
  $('btn-back-camera').addEventListener('click', () => showScreen('splash'));
  $('btn-upload-trigger').addEventListener('click', () => $('file-input').click());
  $('btn-upload-fallback') && $('btn-upload-fallback').addEventListener('click', () => $('file-input').click());
  $('btn-capture').addEventListener('click', () => {
    if (!dom.video.srcObject) return;
    analyzeAndShow(captureFromVideo());
  });
  $('file-input').addEventListener('change', async e => {
    const file = e.target.files[0];
    if (!file) return;
    try { analyzeAndShow(await loadImageFromFile(file)); }
    catch { showToast('Fehler beim Laden des Bildes'); }
    e.target.value = '';
  });

  // Results – back, download, arrows, services link
  $('btn-back-results').addEventListener('click', () => {
    showScreen('camera');
    startCamera();
  });
  $('btn-download').addEventListener('click', downloadResult);
  $('btn-save-result').addEventListener('click', downloadResult);
  $('btn-to-services').addEventListener('click', () => {
    showScreen('services');
    if (!state.servicesBuilt) buildServicesScreen();
  });
  $('swipe-prev').addEventListener('click', () => goToSlide(state.currentSlide - 1));
  $('swipe-next').addEventListener('click', () => goToSlide(state.currentSlide + 1));
}

/* ══════════════════════
   Init
══════════════════════ */
function init() {
  initLang();
  initTabBar();
  initEvents();
  setLang(state.lang);

  // Pre-warm MediaPipe
  if (typeof FaceMesh !== 'undefined') getFaceMesh().catch(() => {});

  // Register service worker
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
}

document.addEventListener('DOMContentLoaded', init);
