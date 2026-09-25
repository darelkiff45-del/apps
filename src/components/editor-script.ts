/**
 * Script injecté dans la page pendant l'édition. La page reste isolée (iframe sandbox sans
 * allow-same-origin) : toute la communication passe par postMessage.
 */
export const EDITOR_SCRIPT = `(function () {
  var post = function (m) { m.__cd = true; parent.postMessage(m, "*"); };
  document.designMode = "on";
  var block = null, img = null;
  var BLOCKS = "section, header, footer, nav, article, main > div, body > div";
  function clearSel() {
    document.querySelectorAll("[data-cd-sel]").forEach(function (el) { el.removeAttribute("data-cd-sel"); });
  }
  document.addEventListener("click", function (e) {
    var t = e.target;
    if (t.closest && t.closest("a, button")) e.preventDefault();
    clearSel();
    img = t.closest ? t.closest("img") : null;
    if (img) img.setAttribute("data-cd-sel", "img");
    post({ type: "image", src: img ? img.getAttribute("src") || "" : null, alt: img ? img.alt || "" : "" });
    block = t.closest ? t.closest(BLOCKS) : null;
    if (block) block.setAttribute("data-cd-sel", "block");
    post({ type: "block", tag: block ? block.tagName.toLowerCase() : null });
  }, true);
  document.addEventListener("submit", function (e) { e.preventDefault(); }, true);
  window.addEventListener("message", function (e) {
    var m = e.data;
    if (!m || !m.__cd) return;
    if (m.type === "set-image" && img) { img.setAttribute("src", m.src); if (m.alt != null) img.alt = m.alt; }
    if (m.type === "block" && block) {
      var p = block.parentNode;
      if (m.action === "up" && block.previousElementSibling) p.insertBefore(block, block.previousElementSibling);
      if (m.action === "down" && block.nextElementSibling) p.insertBefore(block.nextElementSibling, block);
      if (m.action === "duplicate") { var c = block.cloneNode(true); c.removeAttribute("data-cd-sel"); block.after(c); }
      if (m.action === "delete") { block.remove(); block = null; post({ type: "block", tag: null }); }
      if (block) block.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
    if (m.type === "color") {
      var re = new RegExp(m.from + "(?![0-9a-fA-F])", "gi");
      document.querySelectorAll("style:not(#__cd_editor_style)").forEach(function (s) { s.textContent = s.textContent.replace(re, m.to); });
      document.querySelectorAll("[style], [fill], [stroke]").forEach(function (el) {
        ["style", "fill", "stroke"].forEach(function (a) { var v = el.getAttribute(a); if (v) el.setAttribute(a, v.replace(re, m.to)); });
      });
    }
    if (m.type === "get-html") {
      clearSel();
      var clone = document.documentElement.cloneNode(true);
      clone.querySelectorAll("#__cd_editor, #__cd_editor_style").forEach(function (n) { n.remove(); });
      post({ type: "html", html: "<!DOCTYPE html>\\n" + clone.outerHTML });
    }
  });
  post({ type: "ready" });
})();`;

export const EDITOR_STYLE = `
[data-cd-sel="block"] { outline: 2px dashed #7c3aed !important; outline-offset: -2px; }
[data-cd-sel="img"] { outline: 3px solid #7c3aed !important; outline-offset: 2px; }
body { cursor: text; }
img { cursor: pointer; }
`;

export function injectEditor(html: string) {
  const tags = `<style id="__cd_editor_style">${EDITOR_STYLE}</style><script id="__cd_editor">${EDITOR_SCRIPT}</script>`;
  return /<\/body>/i.test(html) ? html.replace(/<\/body>(?![\s\S]*<\/body>)/i, tags + "</body>") : html + tags;
}

/** Couleurs principales du document (codes hexadécimaux les plus fréquents). */
export function extractPalette(html: string, max = 10) {
  const counts = new Map<string, number>();
  for (const m of html.matchAll(/#(?:[0-9a-fA-F]{6}|[0-9a-fA-F]{3})(?![0-9a-fA-F])/g)) {
    const c = m[0].toLowerCase();
    counts.set(c, (counts.get(c) || 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, max).map(([c]) => c);
}

export function toSixDigits(c: string) {
  return c.length === 4 ? "#" + [...c.slice(1)].map((x) => x + x).join("") : c;
}
