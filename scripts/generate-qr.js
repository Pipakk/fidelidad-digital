const QRCode = require('qrcode');
const path = require('path');
const fs = require('fs');

const url = 'https://fidelidad-digital.vercel.app/b/omar-bien-abdaljalil/login';
const outDir = path.join(__dirname, '..');
const outFile = path.join(outDir, 'qr-omar-bien-abdaljalil-login.png');

QRCode.toFile(outFile, url, { width: 400, margin: 2 }, (err) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log('QR guardado en:', outFile);
});
