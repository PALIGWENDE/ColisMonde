/**
 * Génère les icônes PWA de ColisMonde à partir d'un SVG simple (globe stylisé sur le dégradé
 * de marque rouge→vert), via sharp — déjà une dépendance backend, pas besoin d'outil externe.
 *
 * Usage : npx tsx scripts/generate-pwa-icons.ts
 */
import path from "node:path";
import fs from "node:fs";
import sharp from "sharp";

const OUT_DIR = path.resolve(__dirname, "../../web/public/icons");
fs.mkdirSync(OUT_DIR, { recursive: true });

function globeSvg(size: number, padding: number): string {
  const c = size / 2;
  const r = c - padding;
  const stroke = Math.max(size * 0.028, 4);
  return `
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#EF2B2D" />
      <stop offset="100%" stop-color="#009E49" />
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${size * 0.22}" fill="url(#bg)" />
  <g fill="none" stroke="#ffffff" stroke-width="${stroke}">
    <circle cx="${c}" cy="${c}" r="${r}" />
    <ellipse cx="${c}" cy="${c}" rx="${r}" ry="${r * 0.42}" />
    <ellipse cx="${c}" cy="${c}" rx="${r * 0.42}" ry="${r}" />
    <line x1="${c - r}" y1="${c}" x2="${c + r}" y2="${c}" />
  </g>
</svg>`;
}

async function main() {
  const targets: Array<{ name: string; size: number; padding: number }> = [
    { name: "icon-192.png", size: 192, padding: 24 },
    { name: "icon-512.png", size: 512, padding: 64 },
    // Icône "maskable" : contenu resserré dans la zone de sécurité centrale (Android peut recadrer
    // en cercle/squircle, tout ce qui dépasse la zone sûre peut être coupé).
    { name: "icon-512-maskable.png", size: 512, padding: 110 },
    { name: "apple-touch-icon.png", size: 180, padding: 20 },
  ];

  for (const t of targets) {
    const svg = Buffer.from(globeSvg(t.size, t.padding));
    await sharp(svg).png().toFile(path.join(OUT_DIR, t.name));
    console.log(`✅ ${t.name}`);
  }

  // Favicon multi-résolution simple (PNG 32x32, suffisant pour les navigateurs modernes).
  await sharp(Buffer.from(globeSvg(32, 3))).png().toFile(path.resolve(__dirname, "../../web/public/favicon.png"));
  console.log("✅ favicon.png");
}

main().catch((err) => {
  console.error("Échec de génération des icônes :", err);
  process.exit(1);
});
