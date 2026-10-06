const sharp = require("sharp");
const path = require("path");
const fs = require("fs");

const INPUT = path.join(__dirname, "collabi-original.png");
const OUTPUT_DIR = path.join(__dirname, "..", "app");

// Brand color
const BRAND = { r: 75, g: 0, b: 130, alpha: 1 }; // #4B0082

// White background for compositing
const WHITE_BG = { r: 255, g: 255, b: 255, alpha: 1 };

// Padding ratio: how much space around the logo inside the icon
// 0.15 = 15% padding on each side (logo takes 70% of the icon)
const PADDING_RATIO = 0.15;

// Corner radius ratio: 0.22 = iOS-style rounded square
// 0.5 = perfect circle
const CORNER_RATIO = 0.22;

// Create an SVG mask for a rounded square
function roundedSquareMask(size, radius) {
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
      <rect x="0" y="0" width="${size}" height="${size}" rx="${radius}" ry="${radius}" fill="white"/>
    </svg>`
  );
}

async function generateFavicons() {
  console.log("🎨 Generating favicons from:", INPUT);

  if (!fs.existsSync(INPUT)) {
    console.error("❌ Original logo not found at:", INPUT);
    process.exit(1);
  }

  // 1. Read the original image metadata
  const metadata = await sharp(INPUT).metadata();
  console.log(`📐 Original size: ${metadata.width}x${metadata.height}`);

  // 2. Make white background transparent
  const { data, info } = await sharp(INPUT)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height, channels } = info;
  const output = Buffer.alloc(width * height * 4);

  for (let i = 0; i < width * height; i++) {
    const r = data[i * channels];
    const g = data[i * channels + 1];
    const b = data[i * channels + 2];

    const isWhite = r > 240 && g > 240 && b > 240;

    if (isWhite) {
      output[i * 4] = 0;
      output[i * 4 + 1] = 0;
      output[i * 4 + 2] = 0;
      output[i * 4 + 3] = 0;
    } else {
      output[i * 4] = r;
      output[i * 4 + 1] = g;
      output[i * 4 + 2] = b;
      output[i * 4 + 3] = 255;
    }
  }

  // 3. Create transparent PNG from raw buffer
  const transparentBuffer = await sharp(output, {
    raw: { width, height, channels: 4 },
  })
    .png()
    .toBuffer();

  await sharp(transparentBuffer).toFile(
    path.join(__dirname, "debug-transparent.png")
  );
  console.log("👁️  Debug version saved: scripts/debug-transparent.png");

  // 4. Trim transparent edges
  const trimmedBuffer = await sharp(transparentBuffer)
    .trim({ threshold: 10 })
    .toBuffer();

  // 5. Generate each variant with white rounded background + padding
  const variants = [
    { name: "icon.png", size: 512 },
    { name: "apple-icon.png", size: 180 },
    { name: "favicon-48.png", size: 48 },
    { name: "favicon-32.png", size: 32 },
    { name: "favicon-16.png", size: 16 },
  ];

  for (const v of variants) {
    const buf = await buildIcon(trimmedBuffer, v.size);
    fs.writeFileSync(path.join(OUTPUT_DIR, v.name), buf);
    console.log(`✅ Generated: app/${v.name} (${v.size}x${v.size})`);
  }

  // 6. Generate favicon.ico
  const icoSizes = [16, 32, 48];
  const icoBuffers = [];

  for (const size of icoSizes) {
    const buf = await buildIcon(trimmedBuffer, size);
    icoBuffers.push({ size, buf });
  }

  const ico = buildIco(icoBuffers);
  fs.writeFileSync(path.join(OUTPUT_DIR, "favicon.ico"), ico);
  console.log("✅ Generated: app/favicon.ico (16, 32, 48)");

  // 7. Clean up debug file
  fs.unlinkSync(path.join(__dirname, "debug-transparent.png"));

  console.log("\n🎉 Done! All favicons generated in:", OUTPUT_DIR);
}

// Build a single icon: rounded white square + centered padded logo
async function buildIcon(trimmedLogoBuffer, size) {
  // Padding in pixels
  const padding = Math.round(size * PADDING_RATIO);
  const innerSize = size - padding * 2;

  // Resize logo to fit inner area, keeping aspect ratio
  const resizedLogo = await sharp(trimmedLogoBuffer)
    .resize(innerSize, innerSize, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();

  // Get actual resized logo dimensions
  const logoMeta = await sharp(resizedLogo).metadata();

  // Center the logo within the inner area
  const offsetX = padding + Math.floor((innerSize - logoMeta.width) / 2);
  const offsetY = padding + Math.floor((innerSize - logoMeta.height) / 2);

  // Corner radius
  const radius = Math.round(size * CORNER_RATIO);

  // Build: rounded white square + logo on top
  const icon = await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 }, // transparent base
    },
  })
    .composite([
      // 1. Rounded white square
      {
        input: roundedSquareMask(size, radius),
        blend: "over",
      },
      // 2. Logo centered
      {
        input: resizedLogo,
        top: offsetY,
        left: offsetX,
      },
    ])
    .png()
    .toBuffer();

  return icon;
}

// Minimal ICO builder
function buildIco(images) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);

  const directory = Buffer.alloc(16 * images.length);
  let offset = 6 + 16 * images.length;

  images.forEach((img, i) => {
    const pos = i * 16;
    directory.writeUInt8(img.size >= 256 ? 0 : img.size, pos);
    directory.writeUInt8(img.size >= 256 ? 0 : img.size, pos + 1);
    directory.writeUInt8(0, pos + 2);
    directory.writeUInt8(0, pos + 3);
    directory.writeUInt16LE(1, pos + 4);
    directory.writeUInt16LE(32, pos + 6);
    directory.writeUInt32LE(img.buf.length, pos + 8);
    directory.writeUInt32LE(offset, pos + 12);
    offset += img.buf.length;
  });

  return Buffer.concat([header, directory, ...images.map((i) => i.buf)]);
}

generateFavicons().catch((err) => {
  console.error("❌ Error:", err);
  process.exit(1);
});