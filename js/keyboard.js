// Keyboard navigation and shortcut handler for sentence/token navigation and editing.

// ── Custom combobox for label / deprel selects ───────────────────────────────
// Replaces the native browser dropdown for all label selects so that the user
// can type to filter options and auto-confirm when exactly one option matches.
// Works regardless of whether the user clicks or Tabs into the select.

(function(){
  // Shared state
  let _sel       = null;   // currently targeted native <select>
  let _overlay   = null;   // the combobox overlay element
  let _inp       = null;   // text input inside overlay
  let _list      = null;   // options list inside overlay
  let _allOpts   = [];     // all option values for the current select
  let _filtered  = [];     // filtered options matching current input
  let _focusIdx  = -1;     // keyboard-highlighted index in _filtered
  let _closing   = false;  // guard: prevents focusin re-opening during close

  // Returns true when el is a label/deprel select we should handle.
  function _isLabel(el){
    if(!el || el.tagName !== 'SELECT') return false;
    return el.classList.contains('posInlineSelect')
        || el.classList.contains('conlluStructSelect')
        || (el.closest?.('.goldPopup') && !el.id.match(/^[gf]pHead/));
  }

  // Build the overlay DOM once.
  function _build(){
    _overlay = document.createElement('div');
    _overlay.className = 'cbOverlay';
    _overlay.hidden = true;

    _inp = document.createElement('input');
    _inp.type = 'text';
    _inp.className = 'cbInput';
    _inp.spellcheck = false;
    _inp.autocomplete = 'off';
    _inp.placeholder = '🔍 …';
    _overlay.appendChild(_inp);

    _list = document.createElement('div');
    _list.className = 'cbList';
    _overlay.appendChild(_list);

    document.body.appendChild(_overlay);

    _inp.addEventListener('input', _filter);

    _inp.addEventListener('keydown', e => {
      if(e.key === 'Escape')    { e.preventDefault(); e.stopPropagation(); _close(); return; }
      if(e.key === 'Enter')     { e.preventDefault(); e.stopPropagation(); _commit(); return; }
      if(e.key === 'ArrowDown') { e.preventDefault(); _move(1);  return; }
      if(e.key === 'ArrowUp')   { e.preventDefault(); _move(-1); return; }
      if(e.key === 'Tab')       { _commit(); }  // let Tab continue naturally after commit
    });

    _inp.addEventListener('blur', e => {
      // Delay so list mousedown fires first
      setTimeout(() => { if(!_overlay.hidden) _close(); }, 80);
    });

    _list.addEventListener('mousedown', e => {
      const opt = e.target.closest('.cbOpt');
      if(opt){ e.preventDefault(); _pick(opt.dataset.v); }
    });
  }

  function _open(sel){
    if(!_overlay) _build();
    _sel = sel;
    _allOpts = Array.from(sel.options).filter(o => o.value).map(o => o.value);

    const rect = sel.getBoundingClientRect();
    const estH = 220;
    const top  = (rect.bottom + 2 + estH > window.innerHeight - 4)
                   ? Math.max(4, rect.top - estH - 2)
                   : rect.bottom + 2;
    _overlay.style.top      = top + 'px';
    _overlay.style.left     = rect.left + 'px';
    _overlay.style.minWidth = Math.max(rect.width, 120) + 'px';
    _overlay.hidden = false;

    _inp.value = '';
    _filter();
    requestAnimationFrame(() => { _inp.focus(); _inp.select(); });
  }

  function _filter(){
    const q = _inp.value.toLowerCase().trim();
    _filtered  = q ? _allOpts.filter(v => v.toLowerCase().startsWith(q)) : _allOpts.slice();
    _focusIdx  = _filtered.length > 0 ? 0 : -1;
    _render();
  }

  function _render(){
    _list.innerHTML = '';
    if(_filtered.length === 0){
      const d = document.createElement('div');
      d.className = 'cbNoMatch';
      d.textContent = `"${_inp.value}" — kein Treffer`;
      _list.appendChild(d);
      return;
    }
    _filtered.forEach((v, i) => {
      const d = document.createElement('div');
      d.className = 'cbOpt' + (i === _focusIdx ? ' cbOptFocus' : '');
      d.dataset.v = v;
      // Highlight matching prefix
      const q = _inp.value.length;
      d.innerHTML = q
        ? `<b>${escapeHtml(v.slice(0, q))}</b>${escapeHtml(v.slice(q))}`
        : escapeHtml(v);
      _list.appendChild(d);
    });
    _list.querySelector('.cbOptFocus')?.scrollIntoView({ block: 'nearest' });
  }

  function _move(dir){
    _focusIdx = Math.max(0, Math.min(_filtered.length - 1, _focusIdx + dir));
    _render();
  }

  function _commit(){
    if(_focusIdx >= 0 && _filtered[_focusIdx]) _pick(_filtered[_focusIdx]);
    else if(_filtered.length === 1)            _pick(_filtered[0]);
    else                                        _close();
  }

  function _pick(value){
    if(_sel){
      // Inject extra option if the value isn't in the list (free-text fallback)
      if(!Array.from(_sel.options).some(o => o.value === value)){
        const o = document.createElement('option');
        o.value = value; o.textContent = value; o.dataset.extra = '1';
        _sel.insertBefore(o, _sel.firstChild);
      }
      _sel.value = value;
      _sel.dispatchEvent(new Event('change', { bubbles: true }));
    }
    _close();
  }

  function _close(){
    if(!_overlay || _overlay.hidden) return;
    _overlay.hidden = true;
    _closing = true;
    const s = _sel; _sel = null;
    if(s && document.contains(s)) s.focus();
    setTimeout(() => { _closing = false; }, 60);
  }

  // Intercept mouse clicks on label selects — prevent native dropdown, open ours.
  document.addEventListener('mousedown', e => {
    if(!_isLabel(e.target)) return;
    e.preventDefault();   // stop native dropdown from opening
    if(_overlay && !_overlay.hidden && _sel === e.target) { _close(); return; }
    _open(e.target);
  }, true);

  // Open on Tab-focus (keyboard navigation into the select).
  let _lastKey = '';
  document.addEventListener('keydown', e => { _lastKey = e.key; }, true);

  document.addEventListener('focusin', e => {
    if(!_isLabel(e.target)) return;
    if(_closing) return;
    if(_overlay && !_overlay.hidden) return;
    if(_lastKey === 'Tab') _open(e.target);
    _lastKey = '';
  });

  // Close when clicking outside
  document.addEventListener('mousedown', e => {
    if(!_overlay || _overlay.hidden) return;
    if(_overlay.contains(e.target)) return;
    _close();
  });

})();

// ── End of custom combobox ────────────────────────────────────────────────────

let keyFocusTokId = null; // token ID currently highlighted by keyboard focus (null = none)

// Highlight the given token row in the table and sync the sentence-text token highlight.
function setKeyFocus(tokId){
  cmpTable.querySelectorAll("tr.keyFocus").forEach(r => r.classList.remove("keyFocus"));
  keyFocusTokId = tokId;
  // Sync sentText token highlight
  sentText?.querySelectorAll(".sentToken").forEach(s => s.classList.remove("sentTokenActive"));
  if(tokId === null) return;
  const tr = cmpTable.querySelector(`tr[data-id="${tokId}"]`);
  if(tr){
    tr.classList.add("keyFocus", "keyFocusPulse");
    tr.addEventListener("animationend", () => tr.classList.remove("keyFocusPulse"), { once: true });
    tr.scrollIntoView({ block:"nearest", behavior:"smooth" });
  }
  sentText?.querySelector(`.sentToken[data-id="${tokId}"]`)?.classList.add("sentTokenActive");
}

// Return all token rows in document order.
function getTableRows(){
  return Array.from(cmpTable.querySelectorAll("tr[data-id]"));
}

document.addEventListener("keydown", (e) => {
  const active = document.activeElement;
  // Inline table editors must not block global shortcuts — treat them as non-input
  const isInlinePos = active?.classList.contains("posInlineSelect") ||
                      active?.classList.contains("posInlineInput");
  const inInput = !isInlinePos && active &&
    (active.tagName === "INPUT" || active.tagName === "SELECT" || active.tagName === "TEXTAREA");

  // Ctrl+Z → Undo, Ctrl+Y / Ctrl+Shift+Z → Redo (always, even inside inputs)
  if((e.ctrlKey || e.metaKey) && e.key === "z"){
    e.preventDefault();
    undo();
    return;
  }
  if((e.ctrlKey || e.metaKey) && (e.key === "y" || (e.key === "Z" && e.shiftKey))){
    e.preventDefault();
    redo();
    return;
  }

  // ? → toggle help modal (always, even inside inputs)
  if(e.key === "?" && !inInput){
    e.preventDefault();
    const modal = document.getElementById("helpModal");
    if(modal?.classList.contains("active")) closeHelp();
    else openHelp();
    return;
  }

  if(inInput) return;

  switch(e.key){

    // ── Sentence navigation ───────────────────────────────────────────────────
    case "ArrowLeft":
      e.preventDefault();
      if(e.ctrlKey || e.metaKey){
        state.currentSent = 0;
      } else {
        if(state.currentSent <= 0) return;
        state.currentSent--;
      }
      keyFocusTokId = null;
      if(typeof _sentListOpen  !== 'undefined') _sentListOpen  = false;
      renderSentence();
      break;

    case "ArrowRight":
      e.preventDefault();
      if(e.ctrlKey || e.metaKey){
        state.currentSent = Math.max(0, state.maxSents - 1);
      } else {
        if(state.currentSent >= state.maxSents - 1) return;
        state.currentSent++;
      }
      keyFocusTokId = null;
      if(typeof _sentListOpen  !== 'undefined') _sentListOpen  = false;
      renderSentence();
      break;

    // ── Row navigation ────────────────────────────────────────────────────────
    case "ArrowUp": {
      const rows = getTableRows();
      if(!rows.length) return;
      e.preventDefault();
      const idx = rows.findIndex(r => parseInt(r.dataset.id, 10) === keyFocusTokId);
      const next = idx <= 0 ? rows.length - 1 : idx - 1;
      setKeyFocus(parseInt(rows[next].dataset.id, 10));
      break;
    }

    case "ArrowDown": {
      const rows = getTableRows();
      if(!rows.length) return;
      e.preventDefault();
      const idx = rows.findIndex(r => parseInt(r.dataset.id, 10) === keyFocusTokId);
      const next = (idx === -1 || idx === rows.length - 1) ? 0 : idx + 1;
      setKeyFocus(parseInt(rows[next].dataset.id, 10));
      break;
    }

    // ── Open gold popup for the focused row ───────────────────────────────────
    case "Enter": {
      if(keyFocusTokId === null) break;
      e.preventDefault();
      const tr = cmpTable.querySelector(`tr[data-id="${keyFocusTokId}"]`);
      const goldCell = tr?.querySelector("td[data-col='gold']");
      if(goldCell) goldCell.click();
      break;
    }

    // ── Confirm / unconfirm sentence ──────────────────────────────────────────
    case " ":
      e.preventDefault();
      toggleConfirm();
      break;

    // ── Jump to next / previous sentence with diffs ───────────────────────────
    // n = forward, N = backward; wraps around.
    case "n":
    case "N": {
      if(isInlinePos) break; // let browser jump to matching option in select
      if(state.maxSents === 0) break;
      e.preventDefault();
      const forward = e.key === "n";
      const step    = forward ? 1 : -1;
      const start   = state.currentSent;
      let found = false;
      for(let i = 1; i < state.maxSents; i++){
        // Modular arithmetic to wrap around in both directions
        const idx = ((start + step * i) % state.maxSents + state.maxSents) % state.maxSents;
        const stats = _sentStats(idx);
        if(stats.diffCount > 0){
          state.currentSent = idx;
          keyFocusTokId = null;
          renderSentence();
          // Flash the first diff cell to guide the eye
          const firstDiff = cmpTable.querySelector("tr.rowDiff td");
          if(firstDiff){
            firstDiff.classList.add("diffCellFlash");
            firstDiff.addEventListener("animationend", () => firstDiff.classList.remove("diffCellFlash"), { once: true });
          }
          found = true;
          break;
        }
      }
      if(!found) break; // no sentence with diffs found
      break;
    }

    // ── Switch project ────────────────────────────────────────────────────────
    case "[":
      e.preventDefault();
      if(state.activeProjectIdx > 0) switchProject(state.activeProjectIdx - 1);
      break;

    case "]":
      e.preventDefault();
      if(state.activeProjectIdx < state.projects.length - 1)
        switchProject(state.activeProjectIdx + 1);
      break;

    // ── Jump to next / previous sentence with flags ───────────────────────────
    // f = forward, F = backward; wraps around.
    case "f":
    case "F": {
      if(isInlinePos) break; // let browser jump to matching option in select
      if(state.maxSents === 0) break;
      e.preventDefault();
      const forward = e.key === "f";
      const step    = forward ? 1 : -1;
      const start   = state.currentSent;
      for(let i = 1; i < state.maxSents; i++){
        const idx = ((start + step * i) % state.maxSents + state.maxSents) % state.maxSents;
        if(state.flags[idx]?.size > 0){
          state.currentSent = idx;
          keyFocusTokId = null;
          renderSentence();
          break;
        }
      }
      break;
    }

    // ── Copy current sentence as CoNLL-U to clipboard ─────────────────────────
    case "c":
      if(isInlinePos) break; // let browser handle letter navigation in select
      // Don't intercept Ctrl+C or when the user has text selected
      if(e.ctrlKey || e.metaKey) break;
      if(window.getSelection()?.toString().trim()) break;
      e.preventDefault();
      copySentenceConllu();
      break;

    // ── Export shortcuts ──────────────────────────────────────────────────────
    case "e":
      if(isInlinePos) break; // let browser handle letter navigation in select
      e.preventDefault();
      exportGoldConllu();
      break;

    case "E":
      if(isInlinePos) break; // let browser handle letter navigation in select
      e.preventDefault();
      exportTreesTxt();
      break;

    // ── Clear custom annotations for current sentence ─────────────────────────
    case "Delete":
    case "Backspace":
      e.preventDefault();
      clearCustomForSentence();
      break;

    // ── Clear keyboard focus and close popup ──────────────────────────────────
    case "Escape":
      setKeyFocus(null);
      break;

    default: {
      const num = parseInt(e.key, 10);
      if(isNaN(num) || num < 1 || num > 9) break;

      // Ctrl+1–9: initialise custom annotations from document N
      if(e.ctrlKey || e.metaKey){
        if(num > state.docs.length) break;
        e.preventDefault();
        initCustomFromDoc(num - 1);
        break;
      }

      // 1–9: choose document N as the gold source for the focused token
      if(keyFocusTokId === null) break;
      const docIdx = num - 1;
      if(docIdx >= state.docs.length) break;
      // Skip if a custom override already exists for this token
      if(getCustomEntry(state.currentSent, keyFocusTokId)) break;
      e.preventDefault();
      setDocChoice(state.currentSent, keyFocusTokId, docIdx);
      renderSentence();
      setKeyFocus(keyFocusTokId);
      break;
    }
  }
});
