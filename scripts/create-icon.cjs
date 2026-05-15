const { deflateSync } = require("node:zlib");
const { writeFileSync } = require("node:fs");

const width = 512;
const height = 512;

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = crc & 1 ? 0xedb88320 ^ (crc >>> 1) : crc >>> 1;
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBuffer = Buffer.from(type);
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])));
  return Buffer.concat([length, typeBuffer, data, crc]);
}

function pixel(x, y) {
  const inPrompt = x > 110 && x < 230 && Math.abs(y - (168 + (x - 110) * 0.72)) < 18;
  const inPromptLower = x > 110 && x < 230 && Math.abs(y - (344 - (x - 110) * 0.72)) < 18;
  const inCursor = x > 250 && x < 402 && y > 330 && y < 372;
  if (inPrompt || inPromptLower) return [56, 189, 248, 255];
  if (inCursor) return [249, 250, 251, 255];
  return [17, 24, 39, 255];
}

const raw = Buffer.alloc((width * 4 + 1) * height);
for (let y = 0; y < height; y += 1) {
  const row = y * (width * 4 + 1);
  raw[row] = 0;
  for (let x = 0; x < width; x += 1) {
    const [r, g, b, a] = pixel(x, y);
    const offset = row + 1 + x * 4;
    raw[offset] = r;
    raw[offset + 1] = g;
    raw[offset + 2] = b;
    raw[offset + 3] = a;
  }
}

const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(width, 0);
ihdr.writeUInt32BE(height, 4);
ihdr[8] = 8;
ihdr[9] = 6;
ihdr[10] = 0;
ihdr[11] = 0;
ihdr[12] = 0;

writeFileSync(
  "assets/command-icon.png",
  Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw)),
    chunk("IEND", Buffer.alloc(0))
  ])
);
