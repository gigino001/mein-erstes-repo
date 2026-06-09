/* ═══════════════════════════════════════════════════
   Lash Renderer
   Draws eyelash extensions on a canvas using
   MediaPipe Face Mesh landmarks.
   ═══════════════════════════════════════════════════ */

/* ── Eye landmark indices (MediaPipe Face Mesh) ── */
// Upper eyelid, inner → outer corner
const EYE_RIGHT_UPPER = [33, 246, 161, 160, 159, 158, 157, 173, 133]; // viewer left
const EYE_LEFT_UPPER  = [362, 398, 384, 385, 386, 387, 388, 466, 263]; // viewer right

/* ── Face measurement landmarks ── */
const LM = {
  topHead:      10,
  chin:         152,
  leftCheek:    234,
  rightCheek:   454,
  leftJaw:      172,
  rightJaw:     397,
  leftTemple:   127,
  rightTemple:  356,
};

/* ── Lash style definitions ── */
const LASH_STYLES = {
  natural: {
    id: 'natural',
    emoji: '🌿',
    name:  { de: 'Natural', en: 'Natural' },
    desc:  { de: 'Dezent & alltagstauglich', en: 'Subtle & everyday' },
    getLengthFactor: t => 0.65 + 0.4 * Math.sin(Math.PI * t),
    thickness:   1.1,
    curl:        0.22,
    tiltRange:   0.28,
    fanCount:    1,
    fanSpread:   0,
    lengthBase:  0.21,
  },
  classic: {
    id: 'classic',
    emoji: '✨',
    name:  { de: 'Classic', en: 'Classic' },
    desc:  { de: 'Elegant & zeitlos', en: 'Elegant & timeless' },
    getLengthFactor: t => 0.72 + 0.45 * Math.sin(Math.PI * t),
    thickness:   1.5,
    curl:        0.32,
    tiltRange:   0.35,
    fanCount:    1,
    fanSpread:   0,
    lengthBase:  0.25,
  },
  catEye: {
    id: 'catEye',
    emoji: '🐱',
    name:  { de: 'Cat Eye', en: 'Cat Eye' },
    desc:  { de: 'Verführerisch & dramatisch', en: 'Seductive & dramatic' },
    getLengthFactor: t => 0.45 + 1.25 * Math.pow(t, 1.2),
    thickness:   1.7,
    curl:        0.38,
    tiltRange:   0.55,
    fanCount:    1,
    fanSpread:   0,
    lengthBase:  0.28,
  },
  dollEye: {
    id: 'dollEye',
    emoji: '👁️',
    name:  { de: 'Doll Eye', en: 'Doll Eye' },
    desc:  { de: 'Groß & unschuldig', en: 'Big & innocent' },
    getLengthFactor: t => 0.55 + 1.1 * Math.sin(Math.PI * t),
    thickness:   1.8,
    curl:        0.48,
    tiltRange:   0.22,
    fanCount:    1,
    fanSpread:   0,
    lengthBase:  0.30,
  },
  volume: {
    id: 'volume',
    emoji: '💫',
    name:  { de: 'Volume', en: 'Volume' },
    desc:  { de: '2D–3D Volumen-Fans', en: '2D–3D Volume fans' },
    getLengthFactor: t => 0.78 + 0.42 * Math.sin(Math.PI * t),
    thickness:   0.75,
    curl:        0.42,
    tiltRange:   0.35,
    fanCount:    3,
    fanSpread:   0.38,
    lengthBase:  0.27,
  },
  megaVolume: {
    id: 'megaVolume',
    emoji: '🌟',
    name:  { de: 'Mega Volume', en: 'Mega Volume' },
    desc:  { de: '4D+ Maximale Dramatik', en: '4D+ Maximum drama' },
    getLengthFactor: t => 0.88 + 0.65 * Math.sin(Math.PI * t),
    thickness:   0.55,
    curl:        0.52,
    tiltRange:   0.42,
    fanCount:    5,
    fanSpread:   0.58,
    lengthBase:  0.32,
  },
};

/* ── Face-shape → lash recommendation ── */
const RECOMMENDATIONS = {
  oval: {
    primary:      'classic',
    alternatives: ['catEye', 'volume'],
    reason: {
      de: 'Ovale Gesichtsformen sind sehr harmonisch und vertragen fast jeden Stil. Classic unterstreicht deine natürliche Symmetrie auf elegante Weise.',
      en: 'Oval faces suit almost every style. Classic elegantly enhances your natural symmetry.',
    },
  },
  round: {
    primary:      'catEye',
    alternatives: ['classic', 'natural'],
    reason: {
      de: 'Cat Eye Wimpern verlängern dein Gesicht optisch und betonen die äußeren Augenwinkel – das schlankt das runde Gesicht wunderschön.',
      en: 'Cat Eye lashes visually elongate your face and emphasise the outer corners – perfectly slimming for round faces.',
    },
  },
  square: {
    primary:      'dollEye',
    alternatives: ['natural', 'classic'],
    reason: {
      de: 'Doll Eye Wimpern weichen eckige Gesichtszüge auf und lenken den Blick auf die Augenmitte – das Ergebnis wirkt weich und feminin.',
      en: 'Doll Eye lashes soften angular features and draw attention to the centre of the eyes – for a soft, feminine result.',
    },
  },
  heart: {
    primary:      'natural',
    alternatives: ['classic', 'dollEye'],
    reason: {
      de: 'Natural Wimpern balancieren die markante Herzform ohne zu viel Aufmerksamkeit auf die Stirnpartie zu lenken – subtil und trotzdem wirkungsvoll.',
      en: 'Natural lashes balance the distinctive heart shape without drawing too much attention to the forehead – subtle yet effective.',
    },
  },
  diamond: {
    primary:      'volume',
    alternatives: ['catEye', 'classic'],
    reason: {
      de: 'Volume Wimpern betonen deine ausdrucksstarken Augen und gleichen die schmale Stirn und den schmaleren Kiefer optisch aus.',
      en: 'Volume lashes emphasise your expressive eyes and visually balance the narrower forehead and jaw.',
    },
  },
  oblong: {
    primary:      'dollEye',
    alternatives: ['volume', 'megaVolume'],
    reason: {
      de: 'Doll Eye Wimpern verleihen länglichen Gesichtern optische Breite durch die starke Betonung der Augenmitte.',
      en: 'Doll Eye lashes add visual width to oblong faces by strongly emphasising the centre of the eyes.',
    },
  },
};

/* ── Helpers ── */
function dist(a, b) {
  const dx = a.x - b.x, dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

function interpolateCurve(pts, n) {
  if (pts.length < 2) return pts;
  let segs = [];
  let total = 0;
  for (let i = 1; i < pts.length; i++) {
    const d = dist(pts[i], pts[i - 1]);
    segs.push(d);
    total += d;
  }
  const step = total / (n - 1);
  const out = [{ ...pts[0] }];
  let acc = 0, si = 0, sp = 0;
  for (let i = 1; i < n - 1; i++) {
    const target = i * step;
    while (si < segs.length - 1 && acc + segs[si] < target) {
      acc += segs[si++];
      sp = 0;
    }
    sp = (target - acc) / (segs[si] || 1);
    sp = Math.min(1, Math.max(0, sp));
    const p1 = pts[si], p2 = pts[Math.min(si + 1, pts.length - 1)];
    out.push({ x: p1.x + (p2.x - p1.x) * sp, y: p1.y + (p2.y - p1.y) * sp });
  }
  out.push({ ...pts[pts.length - 1] });
  return out;
}

function scaleLM(lm, w, h) {
  return { x: lm.x * w, y: lm.y * h };
}

/* ── Draw a single lash ── */
function drawLash(ctx, bx, by, nx, ny, length, curl, tilt, thickness) {
  // tilt rotates the lash base direction
  const cos = Math.cos(tilt), sin = Math.sin(tilt);
  const dx = nx * cos - ny * sin;
  const dy = nx * sin + ny * cos;

  const ex = bx + dx * length;
  const ey = by + dy * length;

  // Control point creates curl: offset perpendicular to lash direction
  const px = -dy, py = dx; // perpendicular (CCW rotation)
  const cx = (bx + ex) * 0.5 + px * length * curl;
  const cy = (by + ey) * 0.5 + py * length * curl;

  // Gradient: opaque at root, transparent at tip
  let grad;
  try {
    grad = ctx.createLinearGradient(bx, by, ex, ey);
    grad.addColorStop(0,   'rgba(8,3,0,0.88)');
    grad.addColorStop(0.65,'rgba(8,3,0,0.55)');
    grad.addColorStop(1,   'rgba(8,3,0,0)');
  } catch {
    grad = 'rgba(8,3,0,0.85)';
  }

  ctx.beginPath();
  ctx.moveTo(bx, by);
  ctx.quadraticCurveTo(cx, cy, ex, ey);
  ctx.strokeStyle = grad;
  ctx.lineWidth   = thickness;
  ctx.lineCap     = 'round';
  ctx.stroke();
}

/* ── Draw all lashes for one eye ── */
function drawEyeLashes(ctx, landmarks, upperIndices, style, w, h, isRight) {
  const raw = upperIndices.map(i => scaleLM(landmarks[i], w, h));
  const eyeW = dist(raw[0], raw[raw.length - 1]);
  if (eyeW < 8) return; // too small

  const numLashes = Math.max(14, Math.round(eyeW / 3.2));
  const pts = interpolateCurve(raw, numLashes);
  const baseLen = eyeW * style.lengthBase;

  for (let i = 0; i < pts.length; i++) {
    const t   = i / (pts.length - 1);          // 0=inner, 1=outer
    const pt  = pts[i];
    const prev = pts[Math.max(0, i - 1)];
    const next = pts[Math.min(pts.length - 1, i + 1)];

    // Tangent along upper lid
    let tx = next.x - prev.x;
    let ty = next.y - prev.y;
    const tLen = Math.sqrt(tx * tx + ty * ty) || 1;
    tx /= tLen; ty /= tLen;

    // Normal (perpendicular pointing upward away from eye)
    let nx = -ty, ny = tx;
    if (ny > 0) { nx = -nx; ny = -ny; } // ensure upward

    // Tilt: inner lashes more vertical, outer more angled toward corner
    // For right eye (viewer's left): outer corner is to the LEFT → negative tilt
    // For left eye (viewer's right): outer corner is to the RIGHT → positive tilt
    const tiltSign  = isRight ? -1 : 1;
    const tiltAngle = tiltSign * (t - 0.3) * style.tiltRange;

    const length = baseLen * style.getLengthFactor(t);
    if (length < 2) continue;

    // Fan lashes for Volume styles
    const fans = style.fanCount;
    const spread = style.fanSpread;
    for (let f = 0; f < fans; f++) {
      const fanT    = fans > 1 ? (f / (fans - 1) - 0.5) : 0;
      const fanTilt = tiltAngle + fanT * spread;
      const fanLen  = length * (1 - Math.abs(fanT) * 0.28);
      drawLash(ctx, pt.x, pt.y, nx, ny, fanLen, style.curl, fanTilt, style.thickness);
    }
  }
}

/* ── Draw eyeliner along upper lid ── */
function drawEyeliner(ctx, landmarks, upperIndices, w, h) {
  const pts = upperIndices.map(i => scaleLM(landmarks[i], w, h));
  if (pts.length < 2) return;
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
  ctx.strokeStyle = 'rgba(12,5,0,0.60)';
  ctx.lineWidth   = 1.6;
  ctx.lineCap     = 'round';
  ctx.lineJoin    = 'round';
  ctx.stroke();
}

/* ── PUBLIC: render lashes on a canvas ── */
function renderLashesOnCanvas(canvas, imgSource, landmarks, styleId) {
  const style = LASH_STYLES[styleId] || LASH_STYLES.classic;
  const ctx   = canvas.getContext('2d');

  canvas.width  = imgSource.naturalWidth  || imgSource.width  || imgSource.videoWidth  || 640;
  canvas.height = imgSource.naturalHeight || imgSource.height || imgSource.videoHeight || 480;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(imgSource, 0, 0, canvas.width, canvas.height);

  if (!landmarks) return;

  const w = canvas.width, h = canvas.height;

  // Draw eyeliners first (underneath lashes)
  drawEyeliner(ctx, landmarks, EYE_RIGHT_UPPER, w, h);
  drawEyeliner(ctx, landmarks, EYE_LEFT_UPPER,  w, h);

  // Draw lash extensions
  drawEyeLashes(ctx, landmarks, EYE_RIGHT_UPPER, style, w, h, true);
  drawEyeLashes(ctx, landmarks, EYE_LEFT_UPPER,  style, w, h, false);
}

/* ── PUBLIC: determine face shape from landmarks ── */
function detectFaceShape(landmarks, w, h) {
  const p = i => scaleLM(landmarks[i], w, h);

  const cheekW    = dist(p(LM.leftCheek),   p(LM.rightCheek));
  const foreheadW = dist(p(LM.leftTemple),  p(LM.rightTemple));
  const jawW      = dist(p(LM.leftJaw),     p(LM.rightJaw));
  const faceH     = dist(p(LM.topHead),     p(LM.chin));

  if (cheekW === 0) return 'oval';

  const ratio = faceH / cheekW;

  // Proportional thresholds
  const jawRatio      = jawW      / cheekW;
  const foreheadRatio = foreheadW / cheekW;

  if (ratio > 1.75) return 'oblong';
  if (jawRatio > 0.88 && foreheadRatio > 0.88 && ratio < 1.25) return 'square';
  if (jawRatio > 0.85 && ratio < 1.35) return 'round';
  if (foreheadRatio > jawRatio * 1.18 && ratio > 1.2) return 'heart';
  if (cheekW > foreheadW * 1.12 && cheekW > jawW * 1.12) return 'diamond';
  return 'oval';
}

/* ── PUBLIC: get recommendation for a face shape ── */
function getRecommendation(shape) {
  return RECOMMENDATIONS[shape] || RECOMMENDATIONS.oval;
}

/* ── PUBLIC: style list ── */
function getAllStyles() {
  return Object.values(LASH_STYLES);
}
