// ---------- Help modal ----------
const helpBtn     = document.getElementById("helpBtn");
const helpModal   = document.getElementById("helpModal");
const helpClose   = document.getElementById("helpCloseBtn");
const helpContent = document.getElementById("helpContent");

helpBtn.addEventListener("click", openHelp);
helpClose.addEventListener("click", closeHelp);
helpModal.addEventListener("click", e => { if(e.target === helpModal) closeHelp(); });

// Escape schliesst das Modal (capture phase: vor keyboard.js)
document.addEventListener("keydown", e => {
  if(e.key === "Escape" && helpModal.classList.contains("active")){
    e.stopPropagation();
    closeHelp();
  }
}, true);

let _helpLoadedLang = null;

function _readmeContent(){
  const lang = (typeof getLang === 'function') ? getLang() : 'de';
  const w = /** @type {any} */ (window);
  if(lang === 'en' && typeof w.README_CONTENT_EN !== 'undefined') return w.README_CONTENT_EN;
  if(typeof w.README_CONTENT_DE !== 'undefined') return w.README_CONTENT_DE;
  // legacy fallback for old single-language bundle
  if(typeof w.README_CONTENT    !== 'undefined') return w.README_CONTENT;
  return null;
}

function openHelp(){
  const lang = (typeof getLang === 'function') ? getLang() : 'de';
  helpModal.classList.add("active");
  if(_helpLoadedLang === lang) return;
  const content = _readmeContent();
  if(content){
    helpContent.innerHTML = mdToHtml(content);
    _helpLoadedLang = lang;
  } else {
    helpContent.innerHTML =
      `<p class="muted">${escapeHtml(t('help.unavailable'))}<br>
       <code>python make_readme_js.py</code><br>
       ${escapeHtml(t('help.runScript'))}</p>`;
  }
}

function closeHelp(){
  helpModal.classList.remove("active");
}

// ---------- Einfacher Markdown → HTML Renderer ----------
function mdToHtml(md){
  const lines = md.split("\n");
  const out   = [];
  let inCode          = false;
  let inTable         = false;
  let tableHdrDone    = false;
  let inList          = false;
  let inOList         = false;

  const flushBlocks = () => {
    if(inList)  { out.push("</ul>");             inList  = false; }
    if(inOList) { out.push("</ol>");             inOList = false; }
    if(inTable) {
      if(tableHdrDone) out.push("</tbody>");
      out.push("</table>");
      inTable = false; tableHdrDone = false;
    }
  };

  for(const raw of lines){
    const line = raw.trimEnd();

    // ── Code-Block ──
    if(line.startsWith("```")){
      if(!inCode){
        flushBlocks();
        const lang = line.slice(3).trim();
        out.push(`<pre class="helpCode"><code${lang ? ` class="lang-${lang}"` : ""}>`);
        inCode = true;
      } else {
        out.push("</code></pre>");
        inCode = false;
      }
      continue;
    }
    if(inCode){ out.push(esc(line)); continue; }

    // ── Tabelle ──
    if(line.startsWith("|")){
      if(!inTable){
        flushBlocks();
        out.push('<table class="helpTable">');
        inTable = true; tableHdrDone = false;
      }
      // Trennzeile (|---|---|)
      if(/^\|[\s|:-]+\|$/.test(line)){
        if(!tableHdrDone){ out.push("<tbody>"); tableHdrDone = true; }
        continue;
      }
      const cells = line.split("|").slice(1,-1).map(c => inlineMd(c.trim()));
      if(!tableHdrDone){
        out.push("<thead><tr>" + cells.map(c=>`<th>${c}</th>`).join("") + "</tr></thead>");
      } else {
        out.push("<tr>" + cells.map(c=>`<td>${c}</td>`).join("") + "</tr>");
      }
      continue;
    }
    if(inTable){
      if(tableHdrDone) out.push("</tbody>");
      out.push("</table>");
      inTable = false; tableHdrDone = false;
    }

    // ── Trennlinie ──
    if(/^---+$/.test(line)){ flushBlocks(); out.push('<hr class="helpHr">'); continue; }

    // ── Überschriften ──
    const hm = line.match(/^(#{1,3})\s+(.+)/);
    if(hm){
      flushBlocks();
      const lvl = hm[1].length;
      out.push(`<h${lvl} class="helpH">${inlineMd(hm[2])}</h${lvl}>`);
      continue;
    }

    // ── Ungeordnete Liste ──
    const ulm = line.match(/^[-*]\s+(.+)/);
    if(ulm){
      if(inOList){ out.push("</ol>"); inOList = false; }
      if(!inList){ out.push('<ul class="helpUl">'); inList = true; }
      out.push(`<li>${inlineMd(ulm[1])}</li>`);
      continue;
    }

    // ── Geordnete Liste ──
    const olm = line.match(/^\d+\.\s+(.+)/);
    if(olm){
      if(inList){ out.push("</ul>"); inList = false; }
      if(!inOList){ out.push('<ol class="helpOl">'); inOList = true; }
      out.push(`<li>${inlineMd(olm[1])}</li>`);
      continue;
    }

    // ── Leerzeile ──
    if(line.trim() === ""){ flushBlocks(); continue; }

    // ── Absatz ──
    out.push(`<p class="helpP">${inlineMd(line)}</p>`);
  }

  if(inCode) out.push("</code></pre>");
  flushBlocks();
  return out.join("\n");
}

function esc(s){
  return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
}

function inlineMd(s){
  return esc(s)
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/`([^`]+)`/g, '<code class="helpInlineCode">$1</code>');
}
