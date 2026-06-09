/* ── Translations ── */
const TRANSLATIONS = {
  de: {
    tagline:         'Entdecke dein perfektes Wimpernset',
    taglineSub:      'KI-Gesichtsanalyse direkt in deinem Browser',
    start:           'Jetzt starten',
    feat1:           'Kein Foto verlässt dein Gerät',
    feat2:           'Ergebnis in Sekunden',
    feat3:           '6 Wimpernstile zur Auswahl',
    cameraTitle:     'Foto aufnehmen',
    guideText:       'Gesicht im Oval positionieren',
    camHint:         'Gutes Licht & frontale Aufnahme',
    camHintRight:    'Ruhig halten',
    camError:        'Kamerazugriff nicht möglich.',
    camErrorSub:     'Bitte ein Foto hochladen:',
    uploadPhoto:     'Foto hochladen',
    analyzing:       'Gesicht wird analysiert…',
    analyzingSub:    'Wir finden das perfekte Wimpernset für dich',
    resultsTitle:    'Dein Ergebnis',
    noFace:          'Kein Gesicht erkannt – Empfehlungen basieren auf allgemeinen Schönheitsstandards',
    faceShapeLabel:  'Deine Gesichtsform',
    aiLabel:         'KI-Analyse',
    recommendedStyle:'Empfehlung für dich',
    topPick:         'Top Pick ✦',
    whyTitle:        'Warum dieser Stil?',
    allStyles:       'Alle Wimpernstile',
    bookText:        'Bereit für deinen Traumlook?',
    bookNow:         'Jetzt Termin buchen',
    bookHint:        'Cocolashes Bielefeld · Persönliche Beratung inklusive',
    saved:           'Bild gespeichert!',
    noFaceToast:     'Kein Gesicht erkannt – bitte erneut versuchen',
    faceShapes: {
      oval:    'Oval',
      round:   'Rund',
      square:  'Eckig',
      heart:   'Herzförmig',
      diamond: 'Diamant',
      oblong:  'Länglich',
    },
  },
  en: {
    tagline:         'Discover your perfect lash set',
    taglineSub:      'AI face analysis directly in your browser',
    start:           'Get started',
    feat1:           'No photo leaves your device',
    feat2:           'Results in seconds',
    feat3:           '6 lash styles to choose from',
    cameraTitle:     'Take a photo',
    guideText:       'Position your face in the oval',
    camHint:         'Good light & frontal shot',
    camHintRight:    'Hold still',
    camError:        'Camera access not available.',
    camErrorSub:     'Please upload a photo:',
    uploadPhoto:     'Upload photo',
    analyzing:       'Analysing your face…',
    analyzingSub:    "We're finding the perfect lash set for you",
    resultsTitle:    'Your Result',
    noFace:          'No face detected – recommendations based on general beauty standards',
    faceShapeLabel:  'Your face shape',
    aiLabel:         'AI Analysis',
    recommendedStyle:'Recommended for you',
    topPick:         'Top Pick ✦',
    whyTitle:        'Why this style?',
    allStyles:       'All lash styles',
    bookText:        'Ready for your dream look?',
    bookNow:         'Book appointment now',
    bookHint:        'Cocolashes Bielefeld · Personal consultation included',
    saved:           'Image saved!',
    noFaceToast:     'No face detected – please try again',
    faceShapes: {
      oval:    'Oval',
      round:   'Round',
      square:  'Square',
      heart:   'Heart-shaped',
      diamond: 'Diamond',
      oblong:  'Oblong',
    },
  },
};

let currentLang = 'de';

function t(key) {
  return TRANSLATIONS[currentLang][key] || TRANSLATIONS['de'][key] || key;
}

function setLang(lang) {
  if (!TRANSLATIONS[lang]) return;
  currentLang = lang;
  document.documentElement.lang = lang;
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    el.textContent = t(key);
  });
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.lang === lang);
  });
}

function getLang() { return currentLang; }
