/*
  Demobilder.

  ACHTUNG: Diese Bilder sind mit Canva KI-generiert und zeigen NICHT das
  echte LUMO. Sie füllen die Bildflächen, damit die Seite abgestimmt und
  vorgeführt werden kann, solange keine Fotos vorliegen.

  Solange `demoImages` auf true steht, kennzeichnet die Seite jedes Bild
  sichtbar als Demobild und `npm run check:todo` meldet es als offenen
  Punkt. Beim Austausch gegen echte Fotos genügt es, die Dateien unter
  src/assets/fotos/ abzulegen, hier zu verweisen und den Schalter auf
  false zu setzen.

  Rechtliches: Die Nutzungsrechte an KI-Bildern aus Canva richten sich
  nach den Canva-Nutzungsbedingungen. Für den dauerhaften Einsatz auf
  einer Unternehmensseite sollten sie durch eigene Fotos ersetzt werden —
  nicht nur rechtlich, sondern vor allem, weil Gäste sonst etwas anderes
  erwarten, als sie vorfinden.
*/

import innenraum from '../assets/demo/innenraum.jpg';
import bar from '../assets/demo/bar.jpg';
import brunch from '../assets/demo/brunch.jpg';
import lounge from '../assets/demo/lounge.jpg';
import matcha from '../assets/demo/matcha.jpg';
import fassade from '../assets/demo/fassade.jpg';
import event1 from '../assets/demo/event-1.jpg';
import event2 from '../assets/demo/event-2.jpg';
import event3 from '../assets/demo/event-3.jpg';

/** Auf false setzen, sobald echte Fotos eingesetzt sind */
export const demoImages = true;

export const images = {
  innenraum: {
    src: innenraum,
    alt: 'Innenraum am Abend: helle Bouclé-Sofas an dunklen Holztischen, drapierte Stoffbahnen unter der Decke, Rattanleuchten und Kerzenlicht.',
  },
  bar: {
    src: bar,
    alt: 'Die Bar mit hinterleuchtetem Tresen, darüber Rattanleuchten, dahinter ein großflächiges Wandbild mit Palmen und einem balinesischen Tempeltor.',
  },
  brunch: {
    src: brunch,
    alt: 'Reich gedeckte Frühstückstafel von oben: Oliven, Käse, Menemen, Simit, Pancakes und Teegläser auf dunklem Holz.',
  },
  lounge: {
    src: lounge,
    alt: 'Loungebereich am Abend mit weichen Sesseln, Olivenbäumen in Tontöpfen und warmem Licht aus Wandleuchten.',
  },
  matcha: {
    src: matcha,
    alt: 'Matcha-Stillleben auf hellem Stein: zwei Gläser Iced Matcha Latte, eine Matcha-Schale mit Bambusbesen und ein Stück Matcha-Kuchen.',
  },
  fassade: {
    src: fassade,
    alt: 'Die Außenansicht zur blauen Stunde: dunkle Fassade mit großer Fensterfront, warm erleuchtet, davor die Terrasse und der Parkplatz.',
  },
} as const;

/** Event-Slug → Bild. Fehlt ein Eintrag, bleibt die Fläche leer. */
export const eventImages: Record<string, { src: ImageMetadata; alt: string }> = {
  'opening-weekend': {
    src: event1,
    alt: 'Abendstimmung im Gastraum mit Kerzenlicht, Rattanleuchten und der Bar im Hintergrund.',
  },
  'oriental-night': {
    src: event2,
    alt: 'Die Bar bei Nacht unter drapierten Stoffbahnen, davor Cocktailgläser im warmen Licht.',
  },
  'sunday-brunch-vinyl': {
    src: event3,
    alt: 'Gedeckte Tische unter Lichterketten, im Hintergrund die beleuchtete Bar.',
  },
};
