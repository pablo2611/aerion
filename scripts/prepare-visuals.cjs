const fs = require('node:fs/promises');
const path = require('node:path');
const sharp = require(process.env.AERION_SHARP_PATH || 'sharp');
const source = process.argv[2];
if (!source) throw new Error('Usage: node scripts/prepare-visuals.cjs <generated-image-directory> (requires sharp)');
const images = [
  ['aerion-showroom', 'exec-0cf0eb85-6dda-43db-8c02-3041e06354b2.png'],
  ['aerion-cabin', 'exec-d9e408c6-6c11-4e03-8ef4-01fa85f0ff47.png'],
  ['aerion-road-ai', 'exec-bf8f6efe-2919-423f-888e-d03be5f4fcaf.png'],
];
(async () => {
  for (const [name, file] of images) {
    for (const width of [640, 1280]) {
      const destination = path.join(__dirname, '../public/images', `${name}-${width}.webp`);
      await sharp(path.join(source, file)).resize({ width }).webp({ quality: 82 }).toFile(destination);
      console.log(path.basename(destination), (await fs.stat(destination)).size);
    }
  }
})();
