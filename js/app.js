/* ═══════════════════════════════════════════════════
   Cocolashes Bielefeld — Main App Controller
   ═══════════════════════════════════════════════════ */

/* ── State ── */
const state = {
  lang:           'de',
  stream:         null,
  capturedImage:  null,     // HTMLImageElement | HTMLCanvasElement
  landmarks:      null,
  faceShape:      null,
  activeStyle:    null,
  recommendedStyle: null,
};

/* ── DOM refs ── */
const $ = id => document.getElementById(id);

const dom = {
  screens: {
    splash:    $('screen-splash'),
    camera:    $('screen-camera'),
    analyzing: $('screen-analyzing'),
    results:   $('screen-results'),
  },
  splash: {
    start:    $('btn-start'),
    langBtns: document.querySelectorAll('.lang-btn'),
  },
  camera: {
    video:         $('video'),
    overlay:       $('camera-overlay'),
    capture:       $('btn-capture'),
    back:          $('btn-back-camera'),
    uploadTrigger: $('btn-upload-trigger'),
    uploadFallback:$('btn-upload-fallback'),
    fileInput:     $('file-input'),
    errorPanel:    $('camera-error'),
  },
  analyze: {
    progress: $('progress-bar'),
  },
  results: {
    canvas:       $('result-canvas'),
    back:         $('btn-back-results'),
    download:     $('btn-download'),
    faceIcon:     $('face-shape-icon'),
    faceText:     $('face-shape-text'),
    whyText:      $('why-text'),
    noFaceMsg:    $('no-face-msg'),
    stylePills:   $('style-pills'),
    stylesGrid:   $('styles-grid'),
    bookBtn:      $('btn-book'),
  },
  captureCanvas: $('capture-canvas'),
  toast:         $('toast'),
};

const FACE_ICONS = {
  oval:    '⬭',
  round:   '⬤',
  square:  '■',
  heart:   '♡',
  diamond: '◆',
  oblong:  '▭',
};

/* ══════════════════════
   Screen navigation
══════════════════════ */
function showScreen(name) {
  Object.entries(dom.screens).forEach(([key, el]) => {
    el.classList.toggle('active', key === name);
  });
  if (name !== 'camera' && state.stream) stopCamera();
}

/* ══════════════════════
   Toast
══════════════════════ */
let toastTimer;
function showToast(msg) {
  dom.toast.textContent = msg;
  dom.toast.classList.remove('hidden');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => dom.toast.classList.add('hidden'), 3000);
}

/* ══════════════════════
   Language
══════════════════════ */
function initLang() {
  dom.splash.langBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      state.lang = btn.dataset.lang;
      setLang(state.lang);
      refreshResultsText();
    });
  });
}

/* ══════════════════════
   Camera
══════════════════════ */
async function startCamera() {
  try {
    const constraints = {
      video: {
        facingMode: 'user',
        width:  { ideal: 1280 },
        height: { ideal: 960 },
      },
    };
    state.stream = await navigator.mediaDevices.getUserMedia(constraints);
    dom.camera.video.srcObject = state.stream;
    dom.camera.errorPanel.classList.add('hidden');
  } catch (err) {
    console.warn('Camera error:', err);
    dom.camera.errorPanel.classList.remove('hidden');
  }
}

function stopCamera() {
  if (state.stream) {
    state.stream.getTracks().forEach(t => t.stop());
    state.stream = null;
  }
  dom.camera.video.srcObject = null;
}

function captureFromVideo() {
  const video  = dom.camera.video;
  const canvas = dom.captureCanvas;
  const w = video.videoWidth  || 640;
  const h = video.videoHeight || 480;
  canvas.width  = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  // Un-mirror the image (video is mirrored via CSS)
  ctx.save();
  ctx.translate(w, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(video, 0, 0, w, h);
  ctx.restore();
  return canvas;
}

/* ══════════════════════
   File upload
══════════════════════ */
function loadImageFromFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => {
      const img = new Image();
      img.onload  = () => resolve(img);
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/* ══════════════════════
   MediaPipe FaceMesh
══════════════════════ */
let faceMeshInstance = null;

async function getFaceMesh() {
  if (faceMeshInstance) return faceMeshInstance;
  return new Promise((resolve, reject) => {
    if (typeof FaceMesh === 'undefined') {
      reject(new Error('MediaPipe FaceMesh not loaded'));
      return;
    }
    const fm = new FaceMesh({
      locateFile: file =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@0.4.1633559619/${file}`,
    });
    fm.setOptions({
      maxNumFaces:          1,
      refineLandmarks:      true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence:  0.5,
    });
    fm.onResults(results => {
      fm._lastResults = results;
    });
    fm.initialize().then(() => {
      faceMeshInstance = fm;
      resolve(fm);
    }).catch(reject);
  });
}

async function detectFaceLandmarks(imageSource) {
  const fm = await getFaceMesh();
  return new Promise(async (resolve) => {
    fm.onResults(results => {
      if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
        resolve(results.multiFaceLandmarks[0]);
      } else {
        resolve(null);
      }
    });
    await fm.send({ image: imageSource });
  });
}

/* ══════════════════════
   Progress animation
══════════════════════ */
function animateProgress(duration, onDone) {
  const bar   = dom.analyze.progress;
  const start = performance.now();
  function step(now) {
    const pct = Math.min(100, ((now - start) / duration) * 100);
    bar.style.width = pct + '%';
    if (pct < 100) requestAnimationFrame(step);
    else if (onDone) onDone();
  }
  requestAnimationFrame(step);
}

/* ══════════════════════
   Analysis flow
══════════════════════ */
async function analyzeAndShowResults(imgSource) {
  state.capturedImage = imgSource;
  showScreen('analyzing');
  dom.analyze.progress.style.width = '0%';

  // Run face detection and progress animation in parallel
  const [landmarks] = await Promise.all([
    detectFaceLandmarks(imgSource).catch(() => null),
    new Promise(r => animateProgress(2200, r)),
  ]);

  state.landmarks = landmarks;

  if (landmarks) {
    const w = imgSource.naturalWidth  || imgSource.width  || 640;
    const h = imgSource.naturalHeight || imgSource.height || 480;
    state.faceShape = detectFaceShape(landmarks, w, h);
    dom.results.noFaceMsg.classList.add('hidden');
  } else {
    state.faceShape = 'oval'; // fallback
    dom.results.noFaceMsg.classList.remove('hidden');
    showToast(t('noFaceToast'));
  }

  const rec = getRecommendation(state.faceShape);
  state.recommendedStyle = rec.primary;
  state.activeStyle      = rec.primary;

  buildResultsUI();
  renderCurrentStyle();
  showScreen('results');
}

/* ══════════════════════
   Build results UI
══════════════════════ */
function buildResultsUI() {
  const styles = getAllStyles();
  const rec    = getRecommendation(state.faceShape);

  // Face card
  dom.results.faceIcon.textContent = FACE_ICONS[state.faceShape] || '⬡';
  dom.results.faceText.textContent = t('faceShapes')[state.faceShape] || state.faceShape;

  // Style pills (horizontal scroll row)
  dom.results.stylePills.innerHTML = '';
  styles.forEach(style => {
    const pill = document.createElement('div');
    pill.className = 'style-pill' +
      (style.id === rec.primary ? ' recommended-pill' : '') +
      (style.id === state.activeStyle ? ' active' : '');
    pill.dataset.styleId = style.id;
    pill.innerHTML = `
      <span class="pill-emoji">${style.emoji}</span>
      <span class="pill-name">${style.name[state.lang] || style.name.de}</span>
    `;
    pill.addEventListener('click', () => selectStyle(style.id));
    dom.results.stylePills.appendChild(pill);
  });

  // Why text
  dom.results.whyText.textContent = rec.reason[state.lang] || rec.reason.de;

  // Styles grid
  dom.results.stylesGrid.innerHTML = '';
  styles.forEach(style => {
    const card = document.createElement('div');
    card.className = 'style-card' +
      (style.id === rec.primary ? ' recommended-card' : '') +
      (style.id === state.activeStyle ? ' active' : '');
    card.dataset.styleId = style.id;
    card.innerHTML = `
      <span class="style-card-emoji">${style.emoji}</span>
      <span class="style-card-name">${style.name[state.lang] || style.name.de}</span>
      <span class="style-card-desc">${style.desc[state.lang] || style.desc.de}</span>
    `;
    card.addEventListener('click', () => selectStyle(style.id));
    dom.results.stylesGrid.appendChild(card);
  });

  // Book button – WhatsApp link (placeholder number)
  dom.results.bookBtn.href = 'https://wa.me/4952198765432?text=' +
    encodeURIComponent('Hallo Cocolashes! Ich möchte einen Termin für Wimpernverlängerung buchen.');
}

function refreshResultsText() {
  if (!state.faceShape) return;
  const rec = getRecommendation(state.faceShape);
  dom.results.faceText.textContent = t('faceShapes')[state.faceShape] || state.faceShape;
  dom.results.whyText.textContent  = rec.reason[state.lang] || rec.reason.de;

  // Update pill/card names
  document.querySelectorAll('[data-style-id]').forEach(el => {
    const style = getAllStyles().find(s => s.id === el.dataset.styleId);
    if (!style) return;
    const nameEl = el.querySelector('.pill-name, .style-card-name');
    const descEl = el.querySelector('.style-card-desc');
    if (nameEl) nameEl.textContent = style.name[state.lang] || style.name.de;
    if (descEl) descEl.textContent = style.desc[state.lang] || style.desc.de;
  });

  setLang(state.lang);
}

/* ══════════════════════
   Style selection
══════════════════════ */
function selectStyle(styleId) {
  state.activeStyle = styleId;

  // Update pill active state
  document.querySelectorAll('.style-pill').forEach(p => {
    p.classList.toggle('active', p.dataset.styleId === styleId);
  });
  // Update card active state
  document.querySelectorAll('.style-card').forEach(c => {
    c.classList.toggle('active', c.dataset.styleId === styleId);
  });

  renderCurrentStyle();
}

function renderCurrentStyle() {
  if (!state.capturedImage) return;
  renderLashesOnCanvas(
    dom.results.canvas,
    state.capturedImage,
    state.landmarks,
    state.activeStyle,
  );
}

/* ══════════════════════
   Download
══════════════════════ */
function downloadResult() {
  const canvas = dom.results.canvas;
  const link   = document.createElement('a');
  link.download = `cocolashes-preview-${state.activeStyle || 'result'}.jpg`;
  link.href     = canvas.toDataURL('image/jpeg', 0.92);
  link.click();
  showToast(t('saved'));
}

/* ══════════════════════
   Event bindings
══════════════════════ */
function initEvents() {
  // Splash → Camera
  dom.splash.start.addEventListener('click', () => {
    showScreen('camera');
    startCamera();
  });

  // Camera back
  dom.camera.back.addEventListener('click', () => {
    showScreen('splash');
  });

  // Capture photo
  dom.camera.capture.addEventListener('click', () => {
    if (!dom.camera.video.srcObject) return;
    const frame = captureFromVideo();
    analyzeAndShowResults(frame);
  });

  // Upload triggers
  dom.camera.uploadTrigger.addEventListener('click', () => dom.camera.fileInput.click());
  if (dom.camera.uploadFallback) {
    dom.camera.uploadFallback.addEventListener('click', () => dom.camera.fileInput.click());
  }

  dom.camera.fileInput.addEventListener('change', async e => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const img = await loadImageFromFile(file);
      analyzeAndShowResults(img);
    } catch {
      showToast('Fehler beim Laden des Bildes');
    }
    e.target.value = ''; // reset so same file can be re-selected
  });

  // Results back
  dom.results.back.addEventListener('click', () => {
    showScreen('camera');
    startCamera();
  });

  // Download
  dom.results.download.addEventListener('click', downloadResult);
}

/* ══════════════════════
   Init
══════════════════════ */
function init() {
  initLang();
  initEvents();
  setLang(state.lang);

  // Pre-warm MediaPipe in background
  if (typeof FaceMesh !== 'undefined') {
    getFaceMesh().catch(() => {});
  }

  // Register service worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
}

document.addEventListener('DOMContentLoaded', init);
