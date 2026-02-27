// ---------- Project management ----------

// ── Internal helpers ─────────────────────────────────────────────────────────

function _emptyProject(name){
  return {
    name,
    docs:        [],
    custom:      {},
    goldPick:    {},
    confirmed:   [],   // serialised Set (array of ints)
    notes:       {},
    currentSent: 0,
    maxSents:    0,
    hiddenCols:  [],   // serialised Set (array of ints)
    undoStack:   [],
    redoStack:   [],
  };
}

/** Save live state → projects[activeProjectIdx] */
function _saveActiveProject(){
  if(!state.projects.length) return;
  const { undo, redo } = getUndoState();
  state.projects[state.activeProjectIdx] = {
    name:        state.projects[state.activeProjectIdx].name,
    docs:        state.docs,
    custom:      JSON.parse(JSON.stringify(state.custom)),
    goldPick:    JSON.parse(JSON.stringify(state.goldPick)),
    confirmed:   Array.from(state.confirmed),
    notes:       JSON.parse(JSON.stringify(state.notes)),
    currentSent: state.currentSent,
    maxSents:    state.maxSents,
    hiddenCols:  Array.from(state.hiddenCols),
    undoStack:   undo,
    redoStack:   redo,
  };
}

/** Load projects[activeProjectIdx] → live state */
function _loadActiveProject(){
  const p = state.projects[state.activeProjectIdx];
  state.docs        = p.docs       || [];
  state.custom      = JSON.parse(JSON.stringify(p.custom    || {}));
  state.goldPick    = JSON.parse(JSON.stringify(p.goldPick  || {}));
  state.confirmed   = new Set(p.confirmed || []);
  state.notes       = JSON.parse(JSON.stringify(p.notes     || {}));
  state.currentSent = p.currentSent || 0;
  state.maxSents    = p.maxSents    || 0;
  state.hiddenCols  = new Set(p.hiddenCols || []);
  loadUndoState({ undo: p.undoStack || [], redo: p.redoStack || [] });
}

// ── Public API ────────────────────────────────────────────────────────────────

/** Called once on page-load to set up the default project. */
function initProjects(){
  if(state.projects.length === 0){
    const name = `${t('project.default')} 1`;
    state.projects.push(_emptyProject(name));
    state.activeProjectIdx = 0;
  }
  renderProjectTabs();
}

/** Switch to project at idx (save current first). */
function switchProject(idx){
  if(idx === state.activeProjectIdx) return;
  _saveActiveProject();
  state.activeProjectIdx = idx;
  _loadActiveProject();
  renderProjectTabs();
  renderFiles();
  renderSentSelect();
  renderSentence();
}

/** Create a new empty project and switch to it. */
function createProject(name){
  _saveActiveProject();
  const n = name || `${t('project.default')} ${state.projects.length + 1}`;
  state.projects.push(_emptyProject(n));
  state.activeProjectIdx = state.projects.length - 1;
  _loadActiveProject();
  renderProjectTabs();
  renderFiles();
  renderSentSelect();
  renderSentence();
}

/** Delete project at idx. Requires >1 project. */
function deleteProject(idx){
  if(state.projects.length <= 1) return;
  const name = state.projects[idx].name;
  if(!confirm(t('project.deleteConfirm', { name }))) return;
  state.projects.splice(idx, 1);
  if(state.activeProjectIdx >= state.projects.length){
    state.activeProjectIdx = state.projects.length - 1;
  } else if(state.activeProjectIdx > idx){
    state.activeProjectIdx--;
  }
  _loadActiveProject();
  renderProjectTabs();
  renderFiles();
  renderSentSelect();
  renderSentence();
}

/** Rename project at idx. */
function renameProject(idx, name){
  if(!name || !name.trim()) return;
  state.projects[idx].name = name.trim();
  if(idx === state.activeProjectIdx){
    // Also update saved copy
    state.projects[idx].name = name.trim();
  }
  renderProjectTabs();
}

/** Rebuild the #projectTabBar DOM. */
function renderProjectTabs(){
  const bar = document.getElementById("projectTabBar");
  if(!bar) return;
  bar.innerHTML = "";

  state.projects.forEach((p, idx) => {
    const tab = document.createElement("div");
    tab.className = "projectTab" + (idx === state.activeProjectIdx ? " projectTabActive" : "");

    const nameSpan = document.createElement("span");
    nameSpan.className = "projectTabName";
    nameSpan.textContent = p.name;
    nameSpan.title = p.name;
    // Double-click to rename
    nameSpan.addEventListener("dblclick", (e) => {
      e.stopPropagation();
      const newName = prompt(t('project.namePrompt'), p.name);
      if(newName !== null) renameProject(idx, newName);
    });
    tab.appendChild(nameSpan);

    // Close button (only if more than 1 project)
    if(state.projects.length > 1){
      const closeBtn = document.createElement("button");
      closeBtn.className = "projectTabClose";
      closeBtn.textContent = "×";
      closeBtn.title = t('project.deleteConfirm', { name: p.name });
      closeBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        deleteProject(idx);
      });
      tab.appendChild(closeBtn);
    }

    tab.addEventListener("click", () => switchProject(idx));
    bar.appendChild(tab);
  });

  // "+" button to create a new project
  const addBtn = document.createElement("button");
  addBtn.className = "projectTabAdd";
  addBtn.textContent = "+";
  addBtn.title = t('project.new');
  addBtn.addEventListener("click", () => {
    const name = prompt(
      t('project.namePrompt'),
      `${t('project.default')} ${state.projects.length + 1}`
    );
    if(name !== null) createProject(name);
  });
  bar.appendChild(addBtn);
}

// ── Auto-assignment ───────────────────────────────────────────────────────────

/**
 * Called by processFiles() with an array of already-parsed doc objects.
 * Groups docs by sentence count. One group → current project.
 * Multiple groups → auto-assign to projects by matching maxSents.
 */
function autoAssignToProjects(parsedDocs){
  if(!parsedDocs.length) return;

  // Group by sentence count
  const groups = new Map(); // sentCount → [doc, ...]
  for(const doc of parsedDocs){
    const cnt = doc.sentences.length;
    if(!groups.has(cnt)) groups.set(cnt, []);
    groups.get(cnt).push(doc);
  }

  if(groups.size === 1){
    // All same sentence count → add to current project
    for(const doc of parsedDocs){
      if(!state.docs.some(d => d.key === doc.key)) state.docs.push(doc);
    }
    recomputeMaxSents();
    state.currentSent = 0;
    renderFiles();
    renderSentSelect();
    renderSentence();
    return;
  }

  // Multiple groups → save current project first
  _saveActiveProject();

  let firstGroup = true;
  for(const [sentCount, docs] of groups.entries()){
    let targetIdx = -1;

    if(firstGroup){
      // First group goes to the active project if it has no docs yet
      if(state.projects[state.activeProjectIdx].docs.length === 0){
        targetIdx = state.activeProjectIdx;
      }
      firstGroup = false;
    }

    if(targetIdx === -1){
      // Find an existing project with matching maxSents and compatible docs
      targetIdx = state.projects.findIndex((p, i) =>
        p.maxSents === sentCount && !docs.some(d => p.docs.some(pd => pd.key === d.key))
      );
    }

    if(targetIdx === -1){
      // Create a new project
      const name = `${t('project.default')} ${state.projects.length + 1}`;
      state.projects.push(_emptyProject(name));
      targetIdx = state.projects.length - 1;
    }

    const p = state.projects[targetIdx];
    for(const doc of docs){
      if(!p.docs.some(d => d.key === doc.key)) p.docs.push(doc);
    }
    p.maxSents = Math.max(0, ...p.docs.map(d => d.sentences.length), 0);
  }

  // Reload the active project
  _loadActiveProject();
  renderProjectTabs();
  renderFiles();
  renderSentSelect();
  renderSentence();
}
