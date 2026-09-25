import type { EbookResult } from "@/app/api/ebook/route";
import type { CoverDesign } from "@/components/Cover";
import { escapeHtml, markdownToHtml } from "./markdown";

/** Construit un document HTML imprimable (A4) de l'ebook, prêt à exporter en PDF. */
export function ebookToHtml(ebook: EbookResult, cover: CoverDesign | null, author: string) {
  const c = cover;
  const coverPage = c
    ? `<section class="cover" style="background:linear-gradient(160deg,${c.background},${c.backgroundEnd});color:${c.text}">
        <span class="badge" style="background:${c.accent};color:${c.background}">${escapeHtml(c.badge)}</span>
        <div class="cover-body"><div class="bar" style="background:${c.accent}"></div>
        <h1 style="font-family:'${c.fontFamily}',serif">${escapeHtml(ebook.title)}</h1>
        <p>${escapeHtml(ebook.subtitle)}</p></div>
        <div class="author">${escapeHtml(author || c.author)}</div></section>`
    : `<section class="cover plain"><div class="cover-body"><h1>${escapeHtml(ebook.title)}</h1><p>${escapeHtml(ebook.subtitle)}</p></div><div class="author">${escapeHtml(author)}</div></section>`;

  const toc = ebook.chapters
    .map((ch, i) => `<li><span>Chapitre ${i + 1}</span> ${escapeHtml(ch.title)}</li>`)
    .join("");

  const chapters = ebook.chapters
    .map(
      (ch, i) => `<section class="chapter">
      <div class="num">Chapitre ${i + 1}</div><h2>${escapeHtml(ch.title)}</h2>
      ${markdownToHtml(ch.content)}
      <div class="box"><h4>À retenir</h4><ul>${ch.keyTakeaways.map((k) => `<li>${escapeHtml(k)}</li>`).join("")}</ul></div>
      <div class="box action"><h4>Passe à l'action</h4><p>${escapeHtml(ch.actionStep)}</p></div>
    </section>`,
    )
    .join("");

  const accent = c?.accent || "#7c3aed";
  return `<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"><title>${escapeHtml(ebook.title)}</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&family=Merriweather:wght@400;700&family=Poppins:wght@800&family=Playfair+Display:wght@900&family=Montserrat:wght@900&family=Bebas+Neue&family=Lora:wght@700&display=swap" rel="stylesheet">
<style>
@page{size:A4;margin:0}
*{box-sizing:border-box}
body{margin:0;font-family:Merriweather,Georgia,serif;color:#1f2937;background:#e5e7eb}
section{width:210mm;min-height:297mm;margin:0 auto 12px;background:#fff;padding:25mm 22mm;page-break-after:always;position:relative}
.cover{display:flex;flex-direction:column;padding:28mm 22mm}
.cover.plain{background:#111827;color:#fff}
.cover h1{font-size:46pt;line-height:1.05;margin:0 0 12px}
.cover p{font-family:Inter,sans-serif;font-size:15pt;opacity:.85;line-height:1.4}
.cover-body{margin-top:auto}
.bar{width:60px;height:6px;border-radius:4px;margin-bottom:14px}
.badge{align-self:flex-start;font:800 9pt Inter,sans-serif;letter-spacing:.15em;text-transform:uppercase;padding:6px 14px;border-radius:99px}
.author{margin-top:30mm;font:600 11pt Inter,sans-serif;letter-spacing:.12em;text-transform:uppercase;opacity:.8}
h2{font-family:Inter,sans-serif;font-size:24pt;margin:0 0 18px;color:#111827}
h3,h4{font-family:Inter,sans-serif;color:#111827}
p,li{font-size:11pt;line-height:1.75}
blockquote{border-left:4px solid ${accent};margin:16px 0;padding-left:16px;font-style:italic;color:#4b5563}
.num{font:800 10pt Inter,sans-serif;color:${accent};text-transform:uppercase;letter-spacing:.15em;margin-bottom:6px}
.toc ol{list-style:none;padding:0}.toc li{padding:10px 0;border-bottom:1px solid #e5e7eb;font-family:Inter,sans-serif}
.toc li span{color:${accent};font-weight:800;margin-right:10px}
.box{background:#f9fafb;border-radius:12px;padding:14px 20px;margin-top:22px;page-break-inside:avoid}
.box h4{margin:4px 0 6px}.box.action{background:${accent}14;border-left:4px solid ${accent}}
.cta{text-align:center}
@media print{body{background:#fff}section{margin:0}}
</style></head><body>
${coverPage}
<section class="toc"><h2>Sommaire</h2><ol><li><span>—</span> Introduction</li>${toc}<li><span>—</span> Conclusion</li></ol></section>
<section><h2>Introduction</h2>${markdownToHtml(ebook.introduction)}</section>
${chapters}
<section><h2>Conclusion</h2>${markdownToHtml(ebook.conclusion)}
<div class="box action cta"><h4>Et maintenant ?</h4><p>${escapeHtml(ebook.callToAction)}</p></div></section>
</body></html>`;
}
