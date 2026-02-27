// ---------- CoNLL-U Parser ----------
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
    if(line.trim() === ""){ push(); continue; }
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
    const form   = cols[1] || "_";
    const upos   = cols[3] || "_";
    const xpos   = cols[4] || "_";
    const head   = /^\d+$/.test(cols[6]) ? parseInt(cols[6], 10) : null;
    const deprel = cols[7] || "_";
    tokens.push({
      id, form,
      lemma:  cols[2] || "_",
      upos,   xpos,
      feats:  cols[5] || "_",
      head,   deprel,
      deps:   cols[8] || "_",
      misc:   cols[9] || "_",
    });
  }
  push();
  return { sentences };
}

function fileKey(f){
  return `${f.name}::${f.size}::${f.lastModified}`;
}

// ---------- File management ----------
async function processFiles(files){
  const parsed = [];
  for(const f of files){
    const key = fileKey(f);
    // Skip if already present in the current project
    if(state.docs.some(d => d.key === key)) continue;
    const text = await readFileAsText(f);
    const doc = parseConllu(text);
    parsed.push({ key, name: f.name, content: text, sentences: doc.sentences });
  }
  // Delegate to project-aware assignment (defined in projects.js)
  autoAssignToProjects(parsed);
}

async function onFilesChosen(){
  const files = Array.from(fileInput.files || []);
  if(files.length === 0) return;
  fileInput.value = "";

  // If exactly one .json was selected (and no CoNLL-U), treat it as a session import
  const jsonFiles   = files.filter(f => /\.json$/i.test(f.name));
  const conlluFiles = files.filter(f => /\.(conllu|conll|txt)$/i.test(f.name));

  if(jsonFiles.length === 1 && conlluFiles.length === 0){
    const fr = new FileReader();
    fr.onload = () => importSession(fr.result);
    fr.readAsText(jsonFiles[0], "utf-8");
    return;
  }
  const toProcess = conlluFiles.length > 0 ? conlluFiles : files.filter(f => !/\.json$/i.test(f.name));
  if(toProcess.length > 0) await processFiles(toProcess);
}

function removeDoc(index){
  state.docs.splice(index, 1);
  state.hiddenCols.delete(index);
  const newHidden = new Set();
  for(const v of state.hiddenCols){
    if(v > index) newHidden.add(v - 1);
    else if(v < index) newHidden.add(v);
  }
  state.hiddenCols = newHidden;

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

function moveDoc(idx, dir){
  const other = idx + dir;
  if(other < 0 || other >= state.docs.length) return;

  // Swap docs
  [state.docs[idx], state.docs[other]] = [state.docs[other], state.docs[idx]];

  // Remap hiddenCols
  const newHidden = new Set();
  for(const v of state.hiddenCols){
    if(v === idx)   newHidden.add(other);
    else if(v === other) newHidden.add(idx);
    else newHidden.add(v);
  }
  state.hiddenCols = newHidden;

  // Remap goldPick: swap values idx <-> other
  for(const sKey of Object.keys(state.goldPick)){
    const m = state.goldPick[sKey];
    for(const tKey of Object.keys(m)){
      const v = m[tKey];
      if(typeof v !== "number") continue;
      if(v === idx)   m[tKey] = other;
      else if(v === other) m[tKey] = idx;
    }
  }

  renderFiles();
  renderSentSelect();
  renderSentence();
}

/** Reset only the current project (docs, annotations, undo). Other projects untouched. */
function resetProject(){
  if(!confirm(t('files.resetConfirm'))) return;
  state.docs        = [];
  state.custom      = {};
  state.goldPick    = {};
  state.notes       = {};
  state.flags       = {};
  state.hiddenCols  = new Set();
  state.confirmed   = new Set();
  state.currentSent = 0;
  state.maxSents    = 0;
  loadUndoState({ undo: [], redo: [] });
  fileInput.value   = "";
  _saveActiveProject();
  renderFiles();
  renderSentSelect();
  renderSentence();
}

/** Reset ALL projects — full application reset. */
function resetAll(){
  if(!confirm(t('files.globalResetConfirm'))) return;
  state.docs        = [];
  state.custom      = {};
  state.goldPick    = {};
  state.notes       = {};
  state.flags       = {};
  state.hiddenCols  = new Set();
  state.confirmed   = new Set();
  state.currentSent = 0;
  state.maxSents    = 0;
  state.projects    = [_emptyProject(`${t('project.default')} 1`)];
  state.activeProjectIdx = 0;
  loadUndoState({ undo: [], redo: [] });
  fileInput.value   = "";
  renderProjectTabs();
  renderFiles();
  renderSentSelect();
  renderSentence();
}

function recomputeMaxSents(){
  state.maxSents = Math.max(0, ...state.docs.map(d => d.sentences.length), 0);
}
