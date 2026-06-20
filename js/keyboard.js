// Keyboard navigation and shortcut handler for sentence/token navigation and editing.

// ── Typeahead for label/deprel selects ────────────────────────────────────────
// When any label select (UPOS, XPOS, DEPREL, …) is focused and the user types,
// this accumulates the keystrokes into a search buffer, jumps to the first
// matching option, and auto-confirms when only one option remains.

let _taBuf      = '';          // current search string
let _taClearTmr = null;        // auto-clear timer handle
let _taBadgeEl  = null;        // floating visual indicator DOM element

function _taGetBadge(){
  if(!_taBadgeEl){
    _taBadgeEl = document.createElement('div');
    _taBadgeEl.className = 'taSearchBadge';
    _taBadgeEl.hidden = true;
    document.body.appendChild(_taBadgeEl);
  }
  return _taBadgeEl;
}

function _taPositionBadge(sel){
  const rect = sel.getBoundingClientRect();
  _taBadgeEl.style.top  = Math.max(4, rect.top - 34) + 'px';
  _taBadgeEl.style.left = rect.left + 'px';
}

function _taApply(sel){
  const badge = _taGetBadge();
  if(!_taBuf){ badge.hidden = true; return; }

  const buf  = _taBuf.toLowerCase();
  const opts = Array.from(sel.options).filter(o => o.value && o.value.toLowerCase().startsWith(buf));

  _taPositionBadge(sel);
  badge.hidden = false;

  if(opts.length === 0){
    badge.className   = 'taSearchBadge taNoMatch';
    badge.textContent = `✕ "${_taBuf}"`;
    clearTimeout(_taClearTmr);
    _taClearTmr = setTimeout(() => { _taBuf = ''; badge.hidden = true; }, 700);
  } else if(opts.length === 1){
    // Unique match → auto-select and commit
    sel.value = opts[0].value;
    sel.dispatchEvent(new Event('change', { bubbles: true }));
    badge.className   = 'taSearchBadge taMatch';
    badge.textContent = `✓ ${opts[0].value}`;
    _taBuf = '';
    clearTimeout(_taClearTmr);
    _taClearTmr = setTimeout(() => { badge.hidden = true; }, 900);
  } else {
    // Multiple matches → jump to first, show count
    sel.value = opts[0].value;
    badge.className   = 'taSearchBadge taMulti';
    badge.textContent = `🔍 ${_taBuf} · ${opts.length}`;
  }
}

// Capture-phase listener: fires before all bubble handlers and native select behavior.
// Handles any SELECT that contains label/deprel options.
document.addEventListener('keydown', (e) => {
  const sel = document.activeElement;
  if(!sel || sel.tagName !== 'SELECT') return;
  if(e.ctrlKey || e.metaKey || e.altKey) return;

  // Only intercept label/deprel selects (not HEAD token-ID selects)
  const isLabelSel =
    sel.classList.contains('posInlineSelect')    ||
    sel.classList.contains('conlluStructSelect') ||
    (sel.closest?.('.goldPopup') && !sel.id.match(/^[gf]pHead/));
  if(!isLabelSel) return;

  const k = e.key;

  if(k === 'Backspace' && _taBuf){
    e.preventDefault(); e.stopPropagation();
    _taBuf = _taBuf.slice(0, -1);
    _taApply(sel);
    return;
  }

  // Only single printable chars (no space — spaces don't appear in deprel labels)
  if(k.length !== 1 || k === ' ') return;

  e.preventDefault();
  e.stopPropagation();          // prevents keyboard.js bubble handler + native select jump
  _taBuf += k;
  clearTimeout(_taClearTmr);
  _taClearTmr = setTimeout(() => { _taBuf = ''; _taGetBadge().hidden = true; }, 2000);
  _taApply(sel);
}, true /* capture phase */);

// Clear buffer when select loses focus
document.addEventListener('focusout', (e) => {
  if(e.target.tagName !== 'SELECT') return;
  _taBuf = '';
  clearTimeout(_taClearTmr);
  if(_taBadgeEl) _taBadgeEl.hidden = true;
});

// ── End of typeahead ──────────────────────────────────────────────────────────

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
