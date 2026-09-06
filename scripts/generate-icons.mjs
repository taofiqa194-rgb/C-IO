import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const publicDir = path.resolve(process.cwd(), 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// 1. Base SVG definition of the C'IO brand icon (viewBox 0 0 512 512)
// Brand colors:
// Background: #141413
// Accent: #8E8E6F and #5A5A40
// Text / Strokes: #FFFFFF
// Subtitle: #D9D9C8

function createSvg({ isMaskable = false } = {}) {
  // If maskable, safe zone is inner 80% (padding ~ 50px-60px)
  // ViewBox: 0 0 512 512
  const centerScale = isMaskable ? 0.72 : 0.82;
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="512" height="512" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
  <!-- Background -->
  ${isMaskable 
    ? `<rect width="512" height="512" fill="#141413" />` 
    : `<rect width="512" height="512" rx="115" fill="#141413" />
       <rect x="6" y="6" width="500" height="500" rx="109" stroke="#8E8E6F" stroke-opacity="0.35" stroke-width="6" />`
  }

  <!-- Subtle brand background gradient glow -->
  <radialGradient id="glow" cx="50%" cy="45%" r="60%">
    <stop offset="0%" stop-color="#5A5A40" stop-opacity="0.35" />
    <stop offset="100%" stop-color="#141413" stop-opacity="0" />
  </radialGradient>
  <rect width="512" height="512" fill="url(#glow)" />

  <!-- Centered C'IO Insignia and Typographic Mark -->
  <g transform="translate(256, 225) scale(${centerScale * 8.2}) translate(-18, -17.5)">
    <!-- Sleek minimalist C arc with campus connector node and I-O balance -->
    <path
      d="M21 9C19.5 7.8 17.5 7 15 7C9.48 7 5 11.48 5 17C5 22.52 9.48 27 15 27C17.5 27 19.5 26.2 21 25"
      stroke="#FFFFFF"
      stroke-width="2.75"
      stroke-linecap="round"
    />
    <!-- Center connection node in primary accent -->
    <circle cx="16" cy="17" r="1.85" fill="#8E8E6F" />
    <!-- Modern accent apostrophe mark -->
    <path
      d="M20 11.5L22 9"
      stroke="#8E8E6F"
      stroke-width="2.6"
      stroke-linecap="round"
    />
    <!-- I pillar -->
    <path
      d="M24 13V23"
      stroke="#FFFFFF"
      stroke-width="2.6"
      stroke-linecap="round"
    />
    <!-- O orbit -->
    <circle
      cx="29"
      cy="18"
      r="4.25"
      stroke="#FFFFFF"
      stroke-width="2.3"
    />
  </g>

  <!-- Brand Typography -->
  <text x="256" y="388" 
    text-anchor="middle" 
    font-family="system-ui, -apple-system, 'Plus Jakarta Sans', sans-serif" 
    font-weight="800" 
    font-size="44" 
    letter-spacing="5" 
    fill="#FFFFFF">C'IO</text>
  
  <text x="256" y="420" 
    text-anchor="middle" 
    font-family="system-ui, -apple-system, 'Plus Jakarta Sans', sans-serif" 
    font-weight="600" 
    font-size="16" 
    letter-spacing="2.5" 
    fill="#8E8E6F">MINI CAMPUS</text>
</svg>`;
}

async function generate() {
  const standardSvg = createSvg({ isMaskable: false });
  const maskableSvg = createSvg({ isMaskable: true });

  fs.writeFileSync(path.join(publicDir, 'icon.svg'), standardSvg, 'utf8');
  console.log('Created public/icon.svg');

  // 192x192 PNG
  await sharp(Buffer.from(standardSvg))
    .resize(192, 192)
    .png()
    .toFile(path.join(publicDir, 'pwa-192x192.png'));
  console.log('Created public/pwa-192x192.png');

  // 512x512 PNG
  await sharp(Buffer.from(standardSvg))
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'pwa-512x512.png'));
  console.log('Created public/pwa-512x512.png');

  // 512x512 Maskable PNG
  await sharp(Buffer.from(maskableSvg))
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'pwa-maskable-512x512.png'));
  console.log('Created public/pwa-maskable-512x512.png');

  // 180x180 Apple Touch Icon
  await sharp(Buffer.from(standardSvg))
    .resize(180, 180)
    .png()
    .toFile(path.join(publicDir, 'apple-touch-icon.png'));
  console.log('Created public/apple-touch-icon.png');

  // 64x64 favicon
  await sharp(Buffer.from(standardSvg))
    .resize(64, 64)
    .png()
    .toFile(path.join(publicDir, 'favicon.png'));
  console.log('Created public/favicon.png');
}

generate().catch((err) => {
  console.error('Error generating icons:', err);
  process.exit(1);
});
