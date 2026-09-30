const path = require('path');
const sharp = require('C:/Users/TechTroniX/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const qrcode = require('../../website/vendor/qrcode-generator.js');
(async () => {
  const qr = qrcode(0, 'H');
  qr.addData('https://lamsatap.com', 'Byte');
  qr.make();
  if (qr.getModuleCount() !== 29) throw new Error('Unexpected QR matrix size');
  const exactMatrix = await sharp(Buffer.from(qr.createSvgTag(5, 0))).png().toBuffer();
  const blank = await sharp({create:{width:175,height:175,channels:3,background:'#ffffff'}}).png().toBuffer();
  const source = 'C:/Users/TechTroniX/.codex/generated_images/01a0eeb2-49a4-7b00-8651-1e68542b6c6b/exec-32be8640-c50c-453a-be5f-169213329725.png';
  const output = path.join(__dirname, 'final-carousel-v2/03-general-qr.png');
  await sharp(source).composite([
    {input:blank,left:235,top:1157},
    {input:exactMatrix,left:249,top:1171}
  ]).png().toFile(output);
  console.log(JSON.stringify({output,url:'https://lamsatap.com',modules:29,modulePixels:5,coreBounds:{left:249,top:1171,width:145,height:145},mode:'ImageGen design with explicitly approved deterministic QR composition'}));
})().catch(error=>{console.error(error);process.exit(1)});

