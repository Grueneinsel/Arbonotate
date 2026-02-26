// ---------- DOM ----------
const fileInput = document.getElementById("fileInput");
const resetBtn  = document.getElementById("resetBtn");
const fileList  = document.getElementById("fileList");
const fileMeta  = document.getElementById("fileMeta");

const sentSelect  = document.getElementById("sentSelect");
const prevBtn     = document.getElementById("prevBtn");
const nextBtn     = document.getElementById("nextBtn");
const sentMeta    = document.getElementById("sentMeta");
const sentText    = document.getElementById("sentText");
const sentStats   = document.getElementById("sentStats");

const treeGrid    = document.getElementById("treeGrid");
const cmpTable    = document.getElementById("cmpTable");
const colToggleBar = document.getElementById("colToggleBar");

const customInitBtns  = document.getElementById("customInitBtns");
const customClearBtn  = document.getElementById("customClearBtn");
const confirmBtn      = document.getElementById("confirmBtn");
const dropOverlay     = document.getElementById("dropOverlay");
const textWarn        = document.getElementById("textWarn");
const sentMap         = document.getElementById("sentMap");

// ---------- Events ----------
fileInput.addEventListener("change", onFilesChosen);
resetBtn.addEventListener("click", resetAll);

sentSelect.addEventListener("change", () => {
  state.currentSent = parseInt(sentSelect.value, 10) || 0;
  renderSentence();
});
prevBtn.addEventListener("click", () => {
  state.currentSent = Math.max(0, state.currentSent - 1);
  renderSentence();
});
nextBtn.addEventListener("click", () => {
  state.currentSent = Math.min(state.maxSents - 1, state.currentSent + 1);
  renderSentence();
});

customClearBtn.addEventListener("click", clearCustomForSentence);
confirmBtn.addEventListener("click", toggleConfirm);

// Klick auf Token im Satztext → Tabellenzeile fokussieren + scrollen
sentText.addEventListener("click", (e) => {
  const span = e.target.closest(".sentToken");
  if(!span) return;
  const tokId = parseInt(span.dataset.id, 10);
  setKeyFocus(tokId);
  cmpTable.closest(".card")?.scrollIntoView({ block: "nearest", behavior: "smooth" });
});

// Klick auf Datei-Zelle → Gold wählen
cmpTable.addEventListener("click", (e) => {
  const td = e.target.closest?.("td[data-col^='doc']");
  if(!td) return;
  const tr = td.closest("tr[data-id]");
  if(!tr) return;
  const tokId = parseInt(tr.dataset.id, 10);
  const docIdx = parseInt(td.dataset.docIdx, 10);
  if(getCustomEntry(state.currentSent, tokId)) return;
  pushUndo();
  setDocChoice(state.currentSent, tokId, docIdx);
  renderSentence();
});

// ---------- Text compatibility check ----------
function getWarnedDocIndices(){
  const warned = new Set();
  if(state.docs.length < 2) return warned;
  const ref = state.docs[0];
  for(let d = 1; d < state.docs.length; d++){
    const other = state.docs[d];
    if(ref.sentences.length !== other.sentences.length){ warned.add(d); continue; }
    for(let s = 0; s < ref.sentences.length; s++){
      const formsA = ref.sentences[s].tokens.map(tk => tk.form).join(" ");
      const formsB = other.sentences[s].tokens.map(tk => tk.form).join(" ");
      if(formsA !== formsB){ warned.add(d); break; }
    }
  }
  return warned;
}

// ---------- UI: Files ----------
function renderFiles(){
  fileList.innerHTML = "";
  fileMeta.textContent = state.docs.length
    ? t('files.loaded', { n: state.docs.length })
    : t('files.none');
  if(state.docs.length === 0){
    fileList.innerHTML = `<div class="muted small">${escapeHtml(t('files.drop'))}</div>`;
    const demoBtn = document.createElement("button");
    demoBtn.textContent = t('files.demo');
    demoBtn.style.marginTop = "8px";
    demoBtn.addEventListener("click", loadExamples);
    fileList.appendChild(demoBtn);
    return;
  }
  const warnedIndices = getWarnedDocIndices();
  state.docs.forEach((d, idx) => {
    const div = document.createElement("div");
    div.className = "fileItem";
    const warnBadge = warnedIndices.has(idx)
      ? ` <span class="fileWarnIcon" title="${escapeHtml(t('files.warnBadge'))}">⚠️</span>` : "";
    div.innerHTML = `
      <div class="left">
        <div class="name">${escapeHtml(d.name)}${warnBadge}</div>
        <div class="meta">${escapeHtml(t('files.sentences', { n: d.sentences.length }))}</div>
      </div>
      <button class="danger">${escapeHtml(t('files.delete'))}</button>
    `;
    div.querySelector("button").addEventListener("click", () => removeDoc(idx));
    fileList.appendChild(div);
  });

  textWarn.innerHTML = warnedIndices.size > 0
    ? `<div class="textWarnBanner">${escapeHtml(t('files.warnBanner'))}</div>`
    : "";
}

// ---------- Drag & Drop (ganze Seite) ----------
let dragCounter = 0;

document.addEventListener("dragenter", (e) => {
  e.preventDefault();
  dragCounter++;
  dropOverlay.classList.add("active");
});
document.addEventListener("dragover", (e) => {
  e.preventDefault();
});
document.addEventListener("dragleave", () => {
  dragCounter--;
  if(dragCounter <= 0){ dragCounter = 0; dropOverlay.classList.remove("active"); }
});
document.addEventListener("drop", (e) => {
  e.preventDefault();
  dragCounter = 0;
  dropOverlay.classList.remove("active");
  const allFiles = Array.from(e.dataTransfer.files);

  // Session-JSON hat Vorrang — erste .json-Datei wird importiert
  const jsonFile = allFiles.find(f => /\.json$/i.test(f.name));
  if(jsonFile){
    const fr = new FileReader();
    fr.onload = () => importSession(fr.result);
    fr.readAsText(jsonFile, "utf-8");
    return;
  }

  const conlluFiles = allFiles.filter(f => /\.(conllu|conll|txt)$/i.test(f.name));
  if(conlluFiles.length > 0) processFiles(conlluFiles);
});

// ---------- UI: Sentence selector ----------
function renderSentSelect(){
  const ok = state.docs.length >= 2 && state.maxSents > 0;
  sentSelect.disabled = !ok;
  prevBtn.disabled = !ok;
  nextBtn.disabled = !ok;
  customInitBtns.innerHTML = "";
  if(ok){
    state.docs.forEach((d, idx) => {
      const btn = document.createElement("button");
      btn.textContent = t('custom.initBtn', { name: d.name });
      btn.addEventListener("click", () => initCustomFromDoc(idx));
      customInitBtns.appendChild(btn);
    });
  }
  customClearBtn.disabled = !ok;
  confirmBtn.disabled = !ok;
  sentSelect.innerHTML = "";
  if(!ok){ sentStats.textContent = ""; return; }
  renderSentSelectOptions();
  updateExportButtons();
}

// Berechnet Stats für einen Satz (wiederverwendbar)
function _sentStats(i){
  const docMaps = state.docs.map(d => {
    const s = d.sentences[i];
    const m = new Map();
    if(s) for(const tk of s.tokens) m.set(tk.id, tk);
    return m;
  });
  const ids = new Set();
  for(const m of docMaps) for(const id of m.keys()) ids.add(id);
  const customSent = state.custom[i] || {};
  for(const idStr of Object.keys(customSent)) ids.add(parseInt(idStr, 10));
  const idList = Array.from(ids).sort((a,b) => a - b);
  const goldMap = buildGoldTokenMap(i, idList, docMaps);
  return computeStats(i, idList, docMaps, goldMap);
}

function toggleConfirm(){
  if(state.docs.length < 2) return;
  pushUndo();
  const i = state.currentSent;
  if(state.confirmed.has(i)) state.confirmed.delete(i);
  else state.confirmed.add(i);
  updateConfirmBtn();
  renderSentSelectOptions();
}

function updateConfirmBtn(){
  if(!confirmBtn) return;
  const isConfirmed = state.confirmed.has(state.currentSent);
  confirmBtn.textContent  = isConfirmed ? t('sent.confirmed') : t('sent.confirm');
  confirmBtn.classList.toggle("confirmBtnActive", isConfirmed);
}

function renderSentSelectOptions(){
  if(state.docs.length < 2 || state.maxSents === 0) return;
  sentSelect.innerHTML = "";
  for(let i=0;i<state.maxSents;i++){
    const stats = _sentStats(i);
    const hasDiff   = stats.diffCount > 0;
    const confirmed = state.confirmed.has(i);
    const opt = document.createElement("option");
    opt.value = String(i);
    const diffPart = hasDiff
      ? ` ${t(stats.diffCount !== 1 ? 'sent.optDiffs' : 'sent.optDiff', { n: stats.diffCount })}`
      : ` ${t('sent.optOk')}`;
    opt.textContent = `Satz ${i+1}${confirmed ? ' ★' : ''}  (${stats.totalTokens} Tok${diffPart})`;
    if(confirmed){
      opt.style.background = '#1a1000';
      opt.style.color = '#ffb347';
    } else {
      opt.style.background = hasDiff ? '#1f0b0b' : '#091a10';
      opt.style.color = hasDiff ? '#ff9090' : '#6fe8a8';
    }
    sentSelect.appendChild(opt);
  }
  sentSelect.value = String(state.currentSent);

  // Rahmenfarbe des Selects nach aktuellem Satz
  const curConfirmed = state.confirmed.has(state.currentSent);
  const curStats = _sentStats(state.currentSent);
  sentSelect.style.borderColor = curConfirmed ? '#ff9f43' : (curStats.diffCount > 0 ? '#ff5f5f' : '#3de89a');

  updateConfirmBtn();
  renderSentMap();
}

function renderSentMap(){
  if(!sentMap) return;
  if(state.docs.length < 2 || state.maxSents === 0){ sentMap.innerHTML = ""; return; }
  sentMap.innerHTML = "";
  for(let i=0;i<state.maxSents;i++){
    const stats = _sentStats(i);
    const hasDiff   = stats.diffCount > 0;
    const confirmed = state.confirmed.has(i);
    const isCurrent = i === state.currentSent;
    const dot = document.createElement("button");
    let cls = "sentDot ";
    if(confirmed)    cls += "sentDotConfirmed";
    else if(hasDiff) cls += "sentDotDiff";
    else             cls += "sentDotOk";
    if(isCurrent)    cls += " sentDotCurrent";
    dot.className = cls;
    dot.title = t(confirmed ? 'sent.dotTitleConf' : 'sent.dotTitle', {
      n: i + 1, toks: stats.totalTokens, diffs: stats.diffCount
    });
    dot.addEventListener("click", () => {
      state.currentSent = i;
      renderSentence();
    });
    sentMap.appendChild(dot);
  }
}

// ---------- UI: Column toggle ----------
function renderColToggleBar(){
  colToggleBar.innerHTML = "";
  if(state.docs.length < 2){ return; }
  const label = document.createElement("span");
  label.className = "muted small";
  label.textContent = t('cols.label');
  colToggleBar.appendChild(label);

  state.docs.forEach((d, idx) => {
    const btn = document.createElement("button");
    btn.className = "colToggle" + (state.hiddenCols.has(idx) ? " colHidden" : " colVisible");
    btn.textContent = d.name;
    btn.addEventListener("click", () => {
      if(state.hiddenCols.has(idx)) state.hiddenCols.delete(idx);
      else state.hiddenCols.add(idx);
      renderColToggleBar();
      renderCompareTable();
    });
    colToggleBar.appendChild(btn);
  });
}

// ---------- Custom ----------
function initCustomFromDoc(docIdx){
  const s = state.docs[docIdx]?.sentences?.[state.currentSent];
  if(!s) return;
  pushUndo();
  const sent = ensureCustomSent(state.currentSent);
  for(const tk of s.tokens){
    sent[tk.id] = { head: tk.head ?? null, deprel: tk.deprel ?? null, upos: tk.upos ?? null, xpos: tk.xpos ?? null };
  }
  renderSentence();
}

function clearCustomForSentence(){
  if(!confirm(t('sent.clearConfirm'))) return;
  pushUndo();
  delete state.custom[state.currentSent];
  renderSentence();
}

// ---------- Main render ----------
function renderSentence(){
  const ok = state.docs.length >= 2 && state.maxSents > 0;
  if(!ok){
    sentText.textContent = "";
    sentMeta.textContent = "";
    sentStats.textContent = "";
    treeGrid.innerHTML = "";
    cmpTable.innerHTML = "";
    colToggleBar.innerHTML = "";
    return;
  }

  state.currentSent = Math.max(0, Math.min(state.currentSent, state.maxSents - 1));

  const s0 = state.docs[0].sentences[state.currentSent];
  if(s0){
    sentText.innerHTML = s0.tokens
      .map(tk => `<span class="sentToken" data-id="${tk.id}">${escapeHtml(tk.form)}</span>`)
      .join(' ');
  } else {
    sentText.textContent = t('sent.missing');
  }
  sentMeta.textContent = t('sent.label', { cur: state.currentSent + 1, max: state.maxSents });
  sentText.classList.toggle("sentTextConfirmed", state.confirmed.has(state.currentSent));

  renderColToggleBar();
  renderCompareTable();
  renderSentSelectOptions();
  renderPreview();
}

// ---------- Demo ----------
async function loadExamples(){
  const files = EXAMPLES.map(e => new File([e.content], e.name, { type: "text/plain" }));
  await processFiles(files);
}

// ---------- Init ----------
buildDeprelOptionsCache();
renderFiles();
renderSentSelect();
renderSentence();
