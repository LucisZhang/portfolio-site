import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import sharp from "sharp";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

const output = resolve(import.meta.dirname, "../public/case-studies/privacy-preflight");
const width = 1200;
const height = 700;

function escape(value) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

function fixtureSvg({ title, rows, text = "#1d2730", background = "#ffffff", fontSize = 31 }) {
  const lines = rows.map(([label, value], index) => {
    const y = 260 + index * 86;
    return `<text x="64" y="${y}" font-size="20" fill="#586673">${escape(label)}</text><text x="300" y="${y}" font-size="${fontSize}" fill="${text}">${escape(value)}</text>`;
  }).join("");
  return Buffer.from(`<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="${background}"/><rect width="100%" height="112" fill="#17212a"/><text x="64" y="70" font-family="Arial, PingFang SC, Microsoft YaHei, sans-serif" font-size="32" fill="#fff">PRIVACY PREFLIGHT / SYNTHETIC FIXTURE</text><text x="64" y="180" font-family="Arial, PingFang SC, Microsoft YaHei, sans-serif" font-size="36" fill="#1d2730">${escape(title)}</text><g font-family="Arial, PingFang SC, Microsoft YaHei, sans-serif">${lines}</g><text x="64" y="640" font-family="Arial, PingFang SC, Microsoft YaHei, sans-serif" font-size="18" fill="#586673">All details are fictional and reserved for local QA.</text></svg>`);
}

async function png(name, options) {
  const buffer = await sharp(fixtureSvg(options)).png().toBuffer();
  await writeFile(resolve(output, name), buffer);
  return buffer;
}

const english = await png("image-example-english.png", { title: "Review before external sharing", rows: [["EMAIL", "ada@example.com"], ["PHONE", "415-555-0188"], ["DRAFT PATH", "/Users/demo/Private/brief.txt"]] });
const chinese = await png("image-example-chinese.png", { title: "分享前检查", rows: [["邮箱", "zhang@example.com"], ["电话", "138-0013-8000"], ["本地路径", "/Users/demo/Private/中文草稿.txt"]] });
await png("ocr-fixture-small-font.png", { title: "Small text", fontSize: 15, rows: [["EMAIL", "small@example.com"], ["PHONE", "212-555-0199"]] });
await png("ocr-fixture-low-contrast.png", { title: "Low contrast", text: "#a6aaad", background: "#f2f3f3", rows: [["EMAIL", "contrast@example.com"], ["PHONE", "646-555-0177"]] });
const multiline = await png("ocr-fixture-multiline.png", { title: "Multiple lines", rows: [["EMAIL", "multi@example.com"], ["PHONE", "202-555-0144"], ["PATH", "/Users/demo/Private/multiline.txt"]] });
await sharp(multiline).rotate(90).png().toFile(resolve(output, "ocr-fixture-rotated.png"));

const textPdf = await PDFDocument.create();
const font = await textPdf.embedFont(StandardFonts.Helvetica);
const page = textPdf.addPage([612, 792]);
page.drawText("PRIVACY PREFLIGHT / SYNTHETIC TEXT-LAYER PDF", { x: 48, y: 720, size: 16, font, color: rgb(.1, .14, .18) });
page.drawText("Email: ada@example.com", { x: 48, y: 650, size: 18, font });
page.drawText("Phone: 415-555-0188", { x: 48, y: 610, size: 18, font });
page.drawText("Path: /Users/demo/Private/brief.txt", { x: 48, y: 570, size: 18, font });
page.drawText("All details are fictional.", { x: 48, y: 520, size: 12, font });
await writeFile(resolve(output, "pdf-example-text-layer.pdf"), await textPdf.save());

async function imagePdf(name, images) {
  const doc = await PDFDocument.create();
  for (const image of images) {
    const embedded = await doc.embedPng(image);
    const pdfPage = doc.addPage([612, 357]);
    pdfPage.drawImage(embedded, { x: 0, y: 0, width: 612, height: 357 });
  }
  await writeFile(resolve(output, name), await doc.save());
}
await imagePdf("pdf-example-scanned.pdf", [english]);
await imagePdf("pdf-example-multipage.pdf", [english, chinese]);
console.log("Generated Privacy synthetic image and PDF examples.");
