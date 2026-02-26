// ---------- Data structures ----------
function buildDocMapsAndIds(){
  const sentIndex = state.currentSent;
  const docMaps = state.docs.map(d => {
    const s = d.sentences[sentIndex];
    const m = new Map();
    if(s) for(const t of s.tokens) m.set(t.id, t);
    return m;
  });
  const ids = new Set();
  for(const m of docMaps) for(const id of m.keys()) ids.add(id);
  const customSent = state.custom[sentIndex] || {};
  for(const idStr of Object.keys(customSent)) ids.add(parseInt(idStr, 10));
  const idList = Array.from(ids).sort((a,b)=>a-b);
  return { docMaps, idList };
}

function firstToken(docMaps, tokId){
  for(const m of docMaps){ const t = m.get(tokId); if(t) return t; }
  return null;
}

function buildGoldTokenMap(sentIndex, idList, docMaps){
  const gold = new Map();
  for(const id of idList){
    const base = firstToken(docMaps, id);
    if(!base) continue;
    const ce = getCustomEntry(sentIndex, id);
    let head, deprel;
    if(ce){
      head   = ce.head;
      deprel = ce.deprel;
    } else {
      const pick = getDocChoice(sentIndex, id);
      const t = docMaps[pick]?.get(id) || base;
      head   = t.head   ?? null;
      deprel = t.deprel ?? null;
    }
    gold.set(id, { id, form: base.form, upos: base.upos, xpos: base.xpos, head, deprel });
  }
  return gold;
}

// ---------- Comparison table ----------
function renderCompareTable(){
  const sentIndex = state.currentSent;
  const { docMaps, idList } = buildDocMapsAndIds();
  const goldMap = buildGoldTokenMap(sentIndex, idList, docMaps);

  const stats = computeStats(sentIndex, idList, docMaps, goldMap);
  sentStats.innerHTML = `
    <span class="statBadge">${stats.totalTokens} Tokens</span>
    <span class="statBadge ${stats.diffCount > 0 ? 'statDiff' : 'statOk'}">
      ${stats.diffCount} Diff${stats.diffCount !== 1 ? 's' : ''}
    </span>
  `;

  let html = "<thead><tr>";
  html += "<th>ID</th><th>FORM</th><th>UPOS</th><th>XPOS</th>";
  html += "<th>GOLD</th>";
  for(let i=0; i<state.docs.length; i++){
    if(state.hiddenCols.has(i)) continue;
    html += `<th>${escapeHtml(state.docs[i].name)}</th>`;
  }
  html += "<th>Custom HEAD / DEP</th>";
  html += "</tr></thead><tbody>";

  for(const id of idList){
    let form="—", upos="_", xpos="_";
    for(const m of docMaps){
      const t = m.get(id);
      if(t){ form=t.form; upos=t.upos??"_"; xpos=t.xpos??"_"; break; }
    }

    const goldTok = goldMap.get(id);
    const goldVal = goldTok ? valueStr(goldTok.head, goldTok.deprel) : "—";

    const ce = getCustomEntry(sentIndex, id);
    const customExists = !!ce;

    const allVals = state.docs.map((_, i) => {
      const t = docMaps[i].get(id);
      return t ? valueStr(t.head, t.deprel) : null;
    });
    const hasDiff = allVals.filter(Boolean).length > 1 &&
      new Set(allVals.filter(Boolean)).size > 1;

    const customUpos = getCustomUpos(sentIndex, id);
    const customXpos = getCustomXpos(sentIndex, id);
    const displayUpos = customUpos ?? upos;
    const displayXpos = customXpos ?? xpos;

    let uposExtra = "";
    if(displayUpos && displayUpos !== "_" && UPOS_OPTIONS_HTML && !UPOS_OPTIONS_HTML.includes(`value="${escapeHtml(displayUpos)}"`)){
      uposExtra = `<option value="${escapeHtml(displayUpos)}">${escapeHtml(displayUpos)}</option>`;
    }
    let xposExtra = "";
    if(displayXpos && displayXpos !== "_" && XPOS_OPTIONS_HTML && !XPOS_OPTIONS_HTML.includes(`value="${escapeHtml(displayXpos)}"`)){
      xposExtra = `<option value="${escapeHtml(displayXpos)}">${escapeHtml(displayXpos)}</option>`;
    }

    html += `<tr data-id="${id}" class="${hasDiff ? 'rowDiff' : ''}">`;
    html += `<td>${id}</td>`;
    html += `<td>${escapeHtml(form)}</td>`;
    if(UPOS_OPTIONS_HTML){
      html += `<td class="posCell posEditCell"><select class="posSelect" data-id="${id}" data-field="upos">${uposExtra}${UPOS_OPTIONS_HTML}</select></td>`;
    } else {
      html += `<td class="posCell${customUpos ? ' posCustom' : ''}">${escapeHtml(displayUpos)}</td>`;
    }
    if(XPOS_OPTIONS_HTML){
      html += `<td class="posCell posEditCell"><select class="posSelect" data-id="${id}" data-field="xpos">${xposExtra}${XPOS_OPTIONS_HTML}</select></td>`;
    } else {
      html += `<td class="posCell${customXpos ? ' posCustom' : ''}">${escapeHtml(displayXpos)}</td>`;
    }

    const goldSrc = customExists ? '<span class="srcTag srcCustom">C</span>' :
      `<span class="srcTag srcDoc">D${getDocChoice(sentIndex,id)+1}</span>`;
    html += `<td data-col="gold" class="goldCell">${goldSrc} ${escapeHtml(goldVal)}</td>`;

    for(let i=0; i<state.docs.length; i++){
      if(state.hiddenCols.has(i)) continue;
      const v = allVals[i];
      const clsCompare = (goldVal && v) ? (v === goldVal ? "same" : "diff") : "";
      const clsDisabled = customExists ? "disabledPick" : "";
      const clsPicked = (!customExists && i === getDocChoice(sentIndex, id)) ? "picked" : "";
      html += `
        <td data-col="doc${i}" data-doc-idx="${i}"
            class="pickable ${clsCompare} ${clsDisabled} ${clsPicked}">
          ${escapeHtml(v ?? "—")}
        </td>`;
    }

    const headVal = ce?.head ?? "";
    const relVal  = ce?.deprel ?? "";
    let extraOpt = "";
    if(relVal && !DEPREL_VALUE_SET.has(relVal)){
      extraOpt = `<option value="${escapeHtml(relVal)}">${escapeHtml(relVal)} (unknown)</option>`;
    }

    html += `
      <td data-col="custom" class="${customExists ? 'picked' : ''}">
        <div class="customCell">
          <input class="customHead" type="number" min="0" step="1"
                 data-id="${id}" data-field="head"
                 value="${escapeHtml(String(headVal))}" placeholder="head"
                 tabindex="-1">
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

  cmpTable.querySelectorAll("select.customRelSelect").forEach(sel => {
    const tokId = parseInt(sel.dataset.id, 10);
    sel.value = getCustomEntry(sentIndex, tokId)?.deprel ?? "";
  });
  cmpTable.querySelectorAll("select.posSelect").forEach(sel => {
    const tokId = parseInt(sel.dataset.id, 10);
    const field  = sel.dataset.field;
    let fallback = "_";
    for(const m of docMaps){ const t = m.get(tokId); if(t){ fallback = field === "upos" ? (t.upos ?? "_") : (t.xpos ?? "_"); break; } }
    const customVal = field === "upos" ? getCustomUpos(sentIndex, tokId) : getCustomXpos(sentIndex, tokId);
    sel.value = customVal ?? fallback;
  });
}

function onCustomFieldChange(el){
  const tokId = parseInt(el.dataset.id, 10);
  const field  = el.dataset.field;
  if(field === "head"){
    const raw = el.value.trim();
    const val = raw === "" ? null : Math.max(0, parseInt(raw, 10) || 0);
    setCustomField(state.currentSent, tokId, "head", val);
  } else if(field === "deprel" || field === "upos" || field === "xpos"){
    const raw = el.value;
    const val = raw === "" ? null : raw;
    setCustomField(state.currentSent, tokId, field, val);
  }
  renderSentence();
}
