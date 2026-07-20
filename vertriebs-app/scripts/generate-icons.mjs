import sharp from "sharp";
import { mkdirSync } from "node:fs";

mkdirSync("public/icons", { recursive: true });

const svg = (size) => `
<svg width="${size}" height="${size}" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" rx="96" fill="#059669"/>
  <circle cx="256" cy="180" r="90" fill="#fde68a"/>
  <g stroke="#fde68a" stroke-width="18" stroke-linecap="round">
    <line x1="256" y1="40" x2="256" y2="10" />
    <line x1="256" y1="350" x2="256" y2="320" />
    <line x1="116" y1="180" x2="86" y2="180" />
    <line x1="426" y1="180" x2="396" y2="180" />
    <line x1="156" y1="80" x2="136" y2="60" />
    <line x1="356" y1="80" x2="376" y2="60" />
    <line x1="156" y1="280" x2="136" y2="300" />
    <line x1="356" y1="280" x2="376" y2="300" />
  </g>
  <rect x="76" y="360" width="360" height="112" rx="16" fill="#ffffff" fill-opacity="0.15"/>
  <g fill="#ffffff">
    <rect x="96" y="380" width="70" height="72" rx="6"/>
    <rect x="176" y="380" width="70" height="72" rx="6"/>
    <rect x="256" y="380" width="70" height="72" rx="6"/>
    <rect x="336" y="380" width="70" height="72" rx="6"/>
  </g>
</svg>`;

const sizes = [192, 512];
for (const size of sizes) {
  await sharp(Buffer.from(svg(size)))
    .resize(size, size)
    .png()
    .toFile(`public/icons/icon-${size}.png`);
  console.log(`generated public/icons/icon-${size}.png`);
}

await sharp(Buffer.from(svg(180)))
  .resize(180, 180)
  .png()
  .toFile("public/icons/apple-touch-icon.png");
console.log("generated public/icons/apple-touch-icon.png");
