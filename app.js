// CoNLL-U Vergleich (v1)
// Gold pro Token-Zeile per Klick auf Zellinhalt (wie Buttons).
// Wenn Custom (HEAD oder DEPREL) befüllt ist -> Custom ist automatisch Gold.

const DEFAULT_LABELS = {
  "Core arguments": ["nsubj","obj","iobj","csubj","ccomp","xcomp"],
  "Non-core dependents": ["obl","vocative","expl","dislocated"],
  "Modifier words": ["advcl","advmod*","discourse"],
  "Function Words": ["aux","cop","mark"],
  "Nominal dependents": ["nmod","appos","nummod","acl","amod","det","clf","case"],
  "Coordination": ["conj","cc"],
  "Other": ["fixed","flat","list","parataxis","compound","orphan","goeswith","reparandum","punct","root","dep"]
};

let LABELS = DEFAULT_LABELS;
let DEPREL_OPTIONS_HTML = "";
let DEPREL_VALUE_SET = new Set();

const state = {
  docs: [],
  currentSent: 0,
  maxSents: 0,
  custom: {},     // custom[sent][tokId] = {head, deprel}
  goldPick: {},   // goldPick[sent][tokId] = docIdx
};

const fileInput = document.getElementById("fileInput");
const addBtn    = document.getElementById("addBtn");
const resetBtn  = document.getElementById("resetBtn");
const fileList  = document.getElementById("fileList");
const fileMeta  = document.getElementById("fileMeta");

const sentSelect = document.getElementById("sentSelect");
const prevBtn    = document.getElementById("prevBtn");
const nextBtn    = document.getElementById("nextBtn");
const sentMeta   = document.getElementById("sentMeta");
const sentText   = document.getElementById("sentText");
const cmpTable   = document.getElementById("cmpTable");

const customInitBtn  = document.getElementById("customInitBtn");
const customClearBtn = document.getElementById("customClearBtn");

addBtn.addEventListener("click", () => fileInput.click());
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

customInitBtn.addEventListener("click", initCustomFromDoc0);
customClearBtn.addEventListener("click", clearCustomForSentence);

// --- Delegation: Custom Inputs ---
cmpTable.addEventListener("input", (e) => {
  const el = e.target;
  if(el instanceof HTMLInputElement && el.dataset.field && el.dataset.id){
    onCustomFieldChange(el);
  }
});
cmpTable.addEventListener("change", (e) => {
  const el = e.target;
  if(el instanceof HTMLSelectElement && el.classList.contains("customRelSelect")){
    onCustomFieldChange(el);
  }
});

// --- Delegation: Klick auf Datei-Zelle -> Gold wählen ---
cmpTable.addEventListener("click", (e) => {
  const td = e.target.closest?.("td[data-col^='doc']");
  if(!td) return;

  const tr = td.closest("tr[data-id]");
  if(!tr) return;

  const tokId = parseInt(tr.dataset.id, 10);
  const docIdx = parseInt(td.dataset.docIdx, 10);

  // Wenn Custom befüllt ist -> Custom ist Gold, Klick ignorieren
  const ce = getCustomEntry(state.currentSent, tokId);
  if(ce) return;

  setDocChoice(state.currentSent, tokId, docIdx);
  updateRow(tokId);
});

// ---------- Labels laden ----------
(async function initLabels(){
  try{
    const res = await fetch("labels.json", {cache:"no-store"});
    if(res.ok){
      const data = await res.json();
      if(data && typeof data === "object") LABELS = data;
    }
  }catch(_){
    // fallback DEFAULT_LABELS
  }finally{
    buildDeprelOptionsCache();
    renderSentence();
  }
})();

function normalizeLabel(label){
  return String(label).replace(/\*$/,"").trim();
}

function buildDeprelOptionsCache(){
  DEPREL_VALUE_SET = new Set();
  let html = `<option value="">(leer)</option>`;
  for(const [section, items] of Object.entries(LABELS)){
    html += `<optgroup label="${escapeHtml(section)}">`;
    for(const raw of items){
      const val = normalizeLabel(raw);
      if(!val) continue;
      DEPREL_VALUE_SET.add(val);
      html += `<option value="${escapeHtml(val)}">${escapeHtml(val)}</option>`;
    }
    html += `</optgroup>`;
  }
  DEPREL_OPTIONS_HTML = html;
}

// ---------- Parser ----------
function readFileAsText(file){
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(String(fr.result || ""));
    fr.onerror = () => reject(fr.error);
    fr.readAsText(file, "utf-8");
  });
}

function parseConllu(text){
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const sentences = [];
  let tokens = [];
  let textLine = null;

  const push = () => {
    if(tokens.length === 0 && !textLine) return;
    const fallbackText = tokens.map(t => t.form).join(" ");
    sentences.push({ text: textLine || fallbackText, tokens });
    tokens = [];
    textLine = null;
  };

  for(const line0 of lines){
    const line = line0.trimEnd();
    if(line.trim() === ""){
      push(); continue;
    }
    if(line.startsWith("#")){
      const m = line.match(/^#\s*text\s*=\s*(.*)$/i);
      if(m) textLine = m[1];
      continue;
    }

    const cols = line.split("\t");
    if(cols.length < 8) continue;

    const idRaw = cols[0];
    if(idRaw.includes("-") || idRaw.includes(".")) continue;
    if(!/^\d+$/.test(idRaw)) continue;

    const id = parseInt(idRaw, 10);
    const form  = cols[1] || "_";
    const upos  = cols[3] || "_";
    const xpos  = cols[4] || "_";
    const head  = /^\d+$/.test(cols[6]) ? parseInt(cols[6], 10) : null;
    const deprel = cols[7] || "_";

    tokens.push({ id, form, upos, xpos, head, deprel });
  }
  push();
  return { sentences };
}

function fileKey(f){
  return `${f.name}::${f.size}::${f.lastModified}`;
}

// ---------- Files ----------
async function onFilesChosen(){
  const files = Array.from(fileInput.files || []);
  if(files.length === 0) return;

  for(const f of files){
    const key = fileKey(f);
    if(state.docs.some(d => d.key === key)) continue;

    const text = await readFileAsText(f);
    const doc = parseConllu(text);
    state.docs.push({ key, name: f.name, sentences: doc.sentences });
  }

  fileInput.value = "";
  recomputeMaxSents();
  state.currentSent = 0;

  renderFiles();
  renderSentSelect();
  renderSentence();
}

function removeDoc(index){
  state.docs.splice(index, 1);

  // goldPick indices shiften
  for(const sKey of Object.keys(state.goldPick)){
    const m = state.goldPick[sKey];
    for(const tKey of Object.keys(m)){
      const v = m[tKey];
      if(typeof v !== "number") continue;
      if(v === index) m[tKey] = 0;
      else if(v > index) m[tKey] = v - 1;
    }
  }

  recomputeMaxSents();
  state.currentSent = Math.min(state.currentSent, Math.max(0, state.maxSents - 1));
  renderFiles();
  renderSentSelect();
  renderSentence();
}

function resetAll(){
  if(!confirm("Wirklich alles zurücksetzen?")) return;
  state.docs = [];
  state.custom = {};
  state.goldPick = {};
  state.currentSent = 0;
  state.maxSents = 0;
  fileInput.value = "";
  renderFiles();
  renderSentSelect();
  renderSentence();
}

function recomputeMaxSents(){
  state.maxSents = Math.max(0, ...state.docs.map(d => d.sentences.length), 0);
}

// ---------- State helpers ----------
function ensureCustomSent(sentIndex){
  if(!state.custom[sentIndex]) state.custom[sentIndex] = {};
  return state.custom[sentIndex];
}
function ensureGoldSent(sentIndex){
  if(!state.goldPick[sentIndex]) state.goldPick[sentIndex] = {};
  return state.goldPick[sentIndex];
}

function getCustomEntry(sentIndex, tokId){
  const e = state.custom[sentIndex]?.[tokId];
  if(!e) return null;
  const head = (e.head === null || e.head === undefined || e.head === "") ? null : e.head;
  const deprel = (e.deprel === null || e.deprel === undefined || e.deprel === "") ? null : e.deprel;
  if(head === null && deprel === null) return null;
  return { head, deprel };
}

function setCustomField(sentIndex, tokId, field, value){
  const sent = ensureCustomSent(sentIndex);
  if(!sent[tokId]) sent[tokId] = { head:null, deprel:null };
  if(field === "head") sent[tokId].head = value;
  if(field === "deprel") sent[tokId].deprel = value;

  const e = getCustomEntry(sentIndex, tokId);
  if(!e){
    delete sent[tokId];
    if(Object.keys(sent).length === 0) delete state.custom[sentIndex];
  }
}

function getDocChoice(sentIndex, tokId){
  const m = ensureGoldSent(sentIndex);
  const v = m[tokId];
  if(typeof v === "number" && v >= 0 && v < state.docs.length) return v;
  return 0;
}
function setDocChoice(sentIndex, tokId, docIdx){
  ensureGoldSent(sentIndex)[tokId] = docIdx;
}

function valueFromToken(t){
  if(!t) return null;
  return `${t.head ?? "_"} / ${t.deprel ?? "_"}`;
}
function valueFromCustom(c){
  if(!c) return null;
  return `${c.head ?? "_"} / ${c.deprel ?? "_"}`;
}

// ---------- UI ----------
function renderFiles(){
  fileList.innerHTML = "";
  fileMeta.textContent = state.docs.length ? `${state.docs.length} Datei(en) geladen` : "Keine Dateien geladen";

  if(state.docs.length === 0){
    fileList.innerHTML = `<div class="muted small">Lade mindestens 2 Dateien zum Vergleichen.</div>`;
    return;
  }

  state.docs.forEach((d, idx) => {
    const div = document.createElement("div");
    div.className = "fileItem";
    div.innerHTML = `
      <div class="left">
        <div class="name">${escapeHtml(d.name)}</div>
        <div class="meta">${d.sentences.length} Sätze</div>
      </div>
      <button class="danger">Löschen</button>
    `;
    div.querySelector("button").addEventListener("click", () => removeDoc(idx));
    fileList.appendChild(div);
  });
}

function renderSentSelect(){
  const ok = state.docs.length >= 2 && state.maxSents > 0;
  sentSelect.disabled = !ok;
  prevBtn.disabled = !ok;
  nextBtn.disabled = !ok;
  customInitBtn.disabled = !ok;
  customClearBtn.disabled = !ok;

  sentSelect.innerHTML = "";
  if(!ok) return;

  for(let i=0;i<state.maxSents;i++){
    const opt = document.createElement("option");
    opt.value = String(i);
    opt.textContent = `Satz ${i+1}`;
    sentSelect.appendChild(opt);
  }
  sentSelect.value = String(state.currentSent);
}

function initCustomFromDoc0(){
  const s0 = state.docs[0]?.sentences?.[state.currentSent];
  if(!s0) return;
  const sent = ensureCustomSent(state.currentSent);
  for(const t of s0.tokens){
    sent[t.id] = { head: t.head ?? null, deprel: t.deprel ?? null };
  }
  renderSentence();
}

function clearCustomForSentence(){
  if(!confirm("Custom für diesen Satz wirklich löschen?")) return;
  delete state.custom[state.currentSent];
  renderSentence();
}

function renderSentence(){
  const ok = state.docs.length >= 2 && state.maxSents > 0;
  if(!ok){
    sentText.textContent = "";
    cmpTable.innerHTML = "";
    sentMeta.textContent = "";
    return;
  }

  state.currentSent = Math.max(0, Math.min(state.currentSent, state.maxSents - 1));
  sentSelect.value = String(state.currentSent);

  const s0 = state.docs[0].sentences[state.currentSent];
  sentText.textContent = s0 ? s0.text : "(Satz fehlt in Datei 1)";
  sentMeta.textContent = `S${state.currentSent+1} / ${state.maxSents}`;

  const maps = state.docs.map(d => {
    const s = d.sentences[state.currentSent];
    const m = new Map();
    if(s) for(const t of s.tokens) m.set(t.id, t);
    return m;
  });

  // Union IDs
  const ids = new Set();
  for(const m of maps) for(const id of m.keys()) ids.add(id);
  const customSent = state.custom[state.currentSent] || {};
  for(const idStr of Object.keys(customSent)) ids.add(parseInt(idStr, 10));

  const idList = Array.from(ids).sort((a,b)=>a-b);

  // Header: ID | FORM | UPOS | XPOS | GOLD | docs... | CUSTOM
  let html = "<thead><tr>";
  html += "<th>ID</th><th>FORM</th><th>UPOS</th><th>XPOS</th>";
  html += "<th>GOLD</th>";
  for(const d of state.docs){
    html += `<th>${escapeHtml(d.name)}</th>`;
  }
  html += "<th>CUSTOM</th>";
  html += "</tr></thead><tbody>";

  for(const id of idList){
    let form="—", upos="_", xpos="_";
    for(const m of maps){
      const t = m.get(id);
      if(t){ form=t.form; upos=t.upos??"_"; xpos=t.xpos??"_"; break; }
    }

    const docVals = maps.map(m => valueFromToken(m.get(id)));
    const ce = getCustomEntry(state.currentSent, id);
    const customExists = !!ce;
    const customVal = valueFromCustom(ce);

    const chosenDoc = getDocChoice(state.currentSent, id);
    const goldVal = customExists ? customVal : docVals[chosenDoc];

    html += `<tr data-id="${id}">`;
    html += `<td>${id}</td>`;
    html += `<td>${escapeHtml(form)}</td>`;
    html += `<td class="posCell">${escapeHtml(upos)}</td>`;
    html += `<td class="posCell">${escapeHtml(xpos)}</td>`;
    html += `<td data-col="gold" class="goldCell">${escapeHtml(goldVal ?? "—")}</td>`;

    // doc cells (klickbar)
    for(let i=0;i<docVals.length;i++){
      const v = docVals[i];
      const clsCompare = (goldVal && v) ? (v === goldVal ? "same" : "diff") : "";
      const clsPickable = "pickable";
      const clsDisabled = customExists ? "disabledPick" : "";
      const clsPicked = (!customExists && i === chosenDoc) ? "picked" : "";
      html += `
        <td data-col="doc${i}" data-doc-idx="${i}"
            class="${clsPickable} ${clsCompare} ${clsDisabled} ${clsPicked}">
          ${escapeHtml(v ?? "—")}
        </td>`;
    }

    // custom cell (wenn customExists -> als picked markieren)
    const customClsCompare = (goldVal && customVal) ? (customVal === goldVal ? "same" : "diff") : "";
    const customPicked = customExists ? "picked" : "";
    const headVal = ce?.head ?? "";
    const relVal  = ce?.deprel ?? "";

    let extraOpt = "";
    if(relVal && !DEPREL_VALUE_SET.has(relVal)){
      extraOpt = `<option value="${escapeHtml(relVal)}">${escapeHtml(relVal)} (unknown)</option>`;
    }

    html += `
      <td data-col="custom" class="${customClsCompare} ${customPicked}">
        <div class="customCell">
          <input class="customHead" type="number" min="0" step="1"
                 data-id="${id}" data-field="head"
                 value="${escapeHtml(headVal)}" placeholder="head">
          <select class="customRelSelect" data-id="${id}" data-field="deprel">
            ${extraOpt}
            ${DEPREL_OPTIONS_HTML}
          </select>
        </div>
      </td>
    `;

    html += `</tr>`;
  }

  html += "</tbody>";
  cmpTable.innerHTML = html;

  // Custom-Selects auf richtigen Wert setzen
  cmpTable.querySelectorAll("select.customRelSelect").forEach(sel => {
    const tokId = parseInt(sel.dataset.id, 10);
    sel.value = getCustomEntry(state.currentSent, tokId)?.deprel ?? "";
  });
}

function onCustomFieldChange(el){
  const tokId = parseInt(el.dataset.id, 10);
  const field = el.dataset.field;

  if(field === "head"){
    const raw = el.value.trim();
    const val = raw === "" ? null : Math.max(0, parseInt(raw, 10) || 0);
    setCustomField(state.currentSent, tokId, "head", val);
  } else if(field === "deprel"){
    const raw = el.value;
    const val = raw === "" ? null : raw;
    setCustomField(state.currentSent, tokId, "deprel", val);
  }

  // Custom kann Gold override -> row update
  updateRow(tokId);
}

function updateRow(tokId){
  const row = cmpTable.querySelector(`tr[data-id="${tokId}"]`);
  if(!row) return;

  // maps für aktuellen Satz
  const maps = state.docs.map(d => {
    const s = d.sentences[state.currentSent];
    const m = new Map();
    if(s) for(const t of s.tokens) m.set(t.id, t);
    return m;
  });

  const docVals = maps.map(m => valueFromToken(m.get(tokId)));
  const ce = getCustomEntry(state.currentSent, tokId);
  const customExists = !!ce;
  const customVal = valueFromCustom(ce);

  const chosenDoc = getDocChoice(state.currentSent, tokId);
  const goldVal = customExists ? customVal : docVals[chosenDoc];

  // gold cell
  const goldTd = row.querySelector("td[data-col='gold']");
  if(goldTd) goldTd.textContent = goldVal ?? "—";

  // remove old picked
  row.querySelectorAll("td.picked").forEach(td => td.classList.remove("picked"));

  // update doc cells
  for(let i=0;i<docVals.length;i++){
    const td = row.querySelector(`td[data-col='doc${i}']`);
    if(!td) continue;

    td.textContent = docVals[i] ?? "—";
    td.classList.remove("same","diff","disabledPick");

    // disabled if custom exists
    if(customExists) td.classList.add("disabledPick");

    if(goldVal && docVals[i]){
      td.classList.add(docVals[i] === goldVal ? "same" : "diff");
    }

    if(!customExists && i === chosenDoc){
      td.classList.add("picked");
    }
  }

  // custom cell compare + picked if custom exists
  const tdC = row.querySelector("td[data-col='custom']");
  if(tdC){
    tdC.classList.remove("same","diff");
    if(goldVal && customVal){
      tdC.classList.add(customVal === goldVal ? "same" : "diff");
    }
    if(customExists) tdC.classList.add("picked");
  }
}

function escapeHtml(s){
  return String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
}

// Initial render
renderFiles();
renderSentSelect();
renderSentence();
