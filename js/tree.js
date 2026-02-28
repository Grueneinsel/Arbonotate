// ---------- Tree helpers ----------
function getSentenceTextFallback(sentIndex){
  for(const d of state.docs){
    const s = d.sentences[sentIndex];
    if(s && s.text) return s.text;
  }
  return "";
}

function edgesFromMap(tokMap){
  const edges = new Map();
  for(const [id, t] of tokMap.entries()){
    const head = (typeof t.head === "number") ? t.head : null;
    if(head === null) continue;
    edges.set(`${id}|${head}`, t.deprel ?? "_");
  }
  return edges;
}

function renderTreePlain(sentIndex, tokMap, sentenceText){
  const edges = edgesFromMap(tokMap);
  return _buildTree(sentIndex, tokMap, tokMap, edges, edges, sentenceText, false);
}

function renderTreeDiff(sentIndex, goldMap, otherMap, sentenceText){
  const edgesG = edgesFromMap(goldMap);
  const edgesO = edgesFromMap(otherMap);
  return _buildTree(sentIndex, goldMap, otherMap, edgesG, edgesO, sentenceText, true);
}

function _buildTree(sentIndex, goldMap, otherMap, edgesG, edgesO, sentenceText, isDiff){
  const union = isDiff ? new Set([...edgesG.keys(), ...edgesO.keys()]) : new Set(edgesG.keys());

  const children = new Map();
  const nodes = new Set();
  const incoming = new Set();

  for(const k of union){
    const [depS, headS] = k.split("|");
    const dep  = parseInt(depS, 10);
    const head = parseInt(headS, 10);
    if(!children.has(head)) children.set(head, []);
    children.get(head).push(dep);
    nodes.add(dep);
    if(head !== 0){ nodes.add(head); incoming.add(dep); }
  }
  for(const [, arr] of children.entries()) arr.sort((a,b)=>a-b);

  const rootsArr = Array.from(nodes).filter(n => !incoming.has(n)).sort((a,b)=>a-b);
  const roots = rootsArr.length ? rootsArr : (nodes.size ? [Math.min(...nodes)] : []);

  const lines = [];

  function rec(head, prefix, path){
    const deps = children.get(head) || [];
    for(let i=0; i<deps.length; i++){
      const dep  = deps[i];
      const last = (i === deps.length - 1);
      const conn = last ? "└─" : "├─";
      const nextPrefix = prefix + (last ? "  " : "│ ");

      let emo = "", lab = "";
      if(isDiff){
        const key = `${dep}|${head}`;
        [emo, lab] = edgeEmojiAndLabel(edgesG, edgesO, key);
      } else {
        lab = edgesG.get(`${dep}|${head}`) ?? "_";
      }

      const form = goldMap.get(dep)?.form ?? otherMap.get(dep)?.form ?? "?";
      const tDisp = isDiff ? tokDisplayPair(goldMap, otherMap, dep) : `${dep}:${form}`;

      if(isDiff){
        lines.push(`${prefix}${conn} ${emo} ${lab} → ${tDisp}`);
      } else {
        lines.push(`${prefix}${conn} ${lab} → ${tDisp}`);
      }

      if(path.has(dep)){
        lines.push(`${nextPrefix}🔁 (cycle)`);
        continue;
      }
      const nextPath = new Set(path); nextPath.add(dep);
      rec(dep, nextPrefix, nextPath);
    }
  }

  for(let r=0; r<roots.length; r++){
    const root = roots[r];
    const form = goldMap.get(root)?.form ?? otherMap.get(root)?.form ?? "?";
    lines.push(`🌱 ${root}:${form}`);
    const path = new Set([root]);
    rec(root, "", path);
    if(r !== roots.length - 1) lines.push("");
  }

  return lines.join("\n");
}

function tokDisplayPair(goldMap, otherMap, tokId){
  const g = goldMap.get(tokId);
  const o = otherMap.get(tokId);
  if(g && o){
    const fg = g.form ?? "—";
    const fo = o.form ?? "—";
    let display = fg === fo ? `${tokId}:${fg}` : `${tokId}:🅶${fg}|🅵${fo}`;
    // append UPOS/XPOS diff annotation when they differ
    const uDiff = (g.upos ?? "_") !== (o.upos ?? "_");
    const xDiff = (g.xpos ?? "_") !== (o.xpos ?? "_");
    if(uDiff || xDiff){
      const parts = [];
      if(uDiff) parts.push(`UPOS:🅶${g.upos ?? "_"}|🅵${o.upos ?? "_"}`);
      if(xDiff) parts.push(`XPOS:🅶${g.xpos ?? "_"}|🅵${o.xpos ?? "_"}`);
      display += ` [${parts.join(", ")}]`;
    }
    return display;
  }
  if(g) return `${tokId}:${g.form ?? "—"}🅶`;
  if(o) return `${tokId}:${o.form ?? "—"}🅵`;
  return `${tokId}:❓`;
}

function edgeEmojiAndLabel(edgesG, edgesO, key){
  const inG = edgesG.has(key);
  const inO = edgesO.has(key);
  if(inG && inO){
    const lg = edgesG.get(key);
    const lo = edgesO.get(key);
    if(lg === lo) return ["✅", lg];
    return ["⚠️", `🅶${lg}|🅵${lo}`];
  }
  if(inG) return ["🅶", edgesG.get(key)];
  return ["🅵", edgesO.get(key)];
}

// ---------- Tree UI ----------
function scrollToToken(tokId){
  const tr = cmpTable.querySelector(`tr[data-id="${tokId}"]`);
  if(tr){
    tr.scrollIntoView({ behavior:"smooth", block:"center" });
    tr.classList.add("highlightRow");
    setTimeout(() => tr.classList.remove("highlightRow"), 1600);
  }
}

function getSubtreeIds(rootId, tokMap){
  const children = new Map();
  for(const [id, t] of tokMap.entries()){
    const h = (typeof t.head === "number") ? t.head : null;
    if(h === null) continue;
    if(!children.has(h)) children.set(h, []);
    children.get(h).push(id);
  }
  const ids = new Set();
  const stack = [rootId];
  while(stack.length){
    const id = stack.pop();
    ids.add(id);
    for(const c of (children.get(id) || [])) stack.push(c);
  }
  return ids;
}

function hasSubtreeDiff(rootId, goldMap, otherMap){
  const subIds = new Set([
    ...getSubtreeIds(rootId, goldMap),
    ...getSubtreeIds(rootId, otherMap),
  ]);
  for(const id of subIds){
    const g = goldMap.get(id);
    const o = otherMap.get(id);
    if(!g || !o) return true;
    if((g.head   ?? null) !== (o.head   ?? null)) return true;
    if((g.deprel ?? null) !== (o.deprel ?? null)) return true;
    if((g.upos   ?? null) !== (o.upos   ?? null)) return true;
    if((g.xpos   ?? null) !== (o.xpos   ?? null)) return true;
  }
  return false;
}

/**
 * Build a tree section DOM element.
 * @param {string} title
 * @param {string|null} sub
 * @param {string} text  — plain-text tree output from _buildTree
 * @param {object} [opts]
 *   opts.onAdoptSubtree(rootId)  — called when "→ Gold" subtree button clicked
 *   opts.subtreeDiffCheck(rootId) — returns true if subtree has diffs (button shown)
 *   opts.onAdoptToken(tokId)     — called when single-token "→" button clicked
 *   opts.tokenList               — [{id, form}] for clickable sentence header
 *   opts.arcMap                  — full token Map for arc-diagram rendering
 *   opts.arcOnSetHead(depId, newHeadId) — if provided, arc is editable (drag from token)
 *   opts.arcOnDeleteArc(depId)          — resets head for that token
 *   opts.arcOnSetDeprel(depId, deprel) — sets deprel for that token
 *   opts.arcEdgeColors                 — Map<depId, cssColorVar> for arc coloring
 */
function buildTreeSection(title, sub, text, opts = {}){
  const { onAdoptSubtree, subtreeDiffCheck, onAdoptToken, tokenList,
          arcMap, arcOnSetHead, arcOnDeleteArc, arcOnSetDeprel, arcEdgeColors } = opts;

  const section = document.createElement("div");
  section.className = "treeSection";

  const head = document.createElement("div");
  head.className = "treeHead";
  head.innerHTML = `
    <div style="display:flex;gap:8px;align-items:center">
      <div class="title">${escapeHtml(title)}</div>
      ${sub ? `<div class="sub">${escapeHtml(sub)}</div>` : ""}
    </div>
  `;
  section.appendChild(head);

  // ── Arc diagram (SVG, displaCy-style) ─────────────────────────────────────
  if(arcMap && typeof buildArcDiagram === "function"){
    const arcWrap = buildArcDiagram(arcMap, {
      onSetHead:   arcOnSetHead   || null,
      onDeleteArc: arcOnDeleteArc || null,
      onSetDeprel: arcOnSetDeprel || null,
      edgeColors:  arcEdgeColors  || null,
      scrollToTok: scrollToToken,
    });
    if(arcWrap) section.appendChild(arcWrap);
  }

  const pre = document.createElement("pre");
  pre.className = "treePre";

  const lines = text.split("\n");
  for(const line of lines){
    const rootMatch = line.match(/^🌱\s*(\d+):/);
    const tokMatch  = line.match(/→\s*(\d+):/);

    if(rootMatch){
      const rootId = parseInt(rootMatch[1], 10);
      const wrapper = document.createElement("span");
      wrapper.className = "treeLine treeLineRoot treeLineClickable";
      wrapper.title = t('tree.rootJumpTitle', { id: rootId });

      const txt = document.createElement("span");
      txt.textContent = line;
      wrapper.appendChild(txt);

      // "→ Gold" subtree button
      if(onAdoptSubtree && (!subtreeDiffCheck || subtreeDiffCheck(rootId))){
        const btn = document.createElement("button");
        btn.textContent = t('tree.toGold');
        btn.className = "treeSubtreeBtn";
        btn.title = t('tree.toGoldTitle', { id: rootId });
        btn.addEventListener("click", (e) => { e.stopPropagation(); onAdoptSubtree(rootId); });
        wrapper.appendChild(btn);
      }

      wrapper.addEventListener("click", (e) => {
        if(e.target.closest("button")) return;
        scrollToToken(rootId);
      });
      pre.appendChild(wrapper);
    } else if(tokMatch){
      const tokId = parseInt(tokMatch[1], 10);
      const hasOk   = line.includes("✅");
      const hasWarn = line.includes("⚠");
      const hasG    = line.includes("🅶");
      const hasF    = line.includes("🅵");
      let colorClass = "";
      if     (hasOk && !hasG && !hasF)  colorClass = "treeLineOk";
      else if(hasOk && (hasG || hasF))  colorClass = "treeLineWarn";
      else if(hasWarn)                   colorClass = "treeLineWarn";
      else if(hasG && !hasF)             colorClass = "treeLineGold";
      else if(hasF && !hasG)             colorClass = "treeLineFileOnly";

      const hasDiff = colorClass !== "treeLineOk";

      const wrapper = document.createElement("span");
      wrapper.className = `treeLine treeLineClickable${colorClass ? " "+colorClass : ""}`;
      wrapper.title = t('tree.jumpTitle', { id: tokId });

      const txt = document.createElement("span");
      txt.textContent = line + "\n";
      wrapper.appendChild(txt);

      // Single-token "→" adoption button (only on diff lines, only for file diff trees)
      if(hasDiff && onAdoptToken){
        const btn = document.createElement("button");
        btn.textContent = t('tree.adoptToken');
        btn.className = "treeSingleBtn";
        btn.title = t('tree.adoptTokenTitle', { id: tokId });
        btn.addEventListener("click", (e) => { e.stopPropagation(); onAdoptToken(tokId); });
        wrapper.appendChild(btn);
      }

      wrapper.addEventListener("click", (e) => {
        if(e.target.closest("button")) return;
        scrollToToken(tokId);
      });
      pre.appendChild(wrapper);
    } else {
      const span = document.createElement("span");
      span.className = "treeLine";
      span.textContent = line + "\n";
      pre.appendChild(span);
    }
  }

  section.appendChild(pre);
  return section;
}

function renderPreview(){
  const sentIndex = state.currentSent;
  const { docMaps, idList } = buildDocMapsAndIds();
  const goldMap = buildGoldTokenMap(sentIndex, idList, docMaps);

  treeGrid.innerHTML = "";
  if(state.docs.length === 0) return;

  const sentenceText = getSentenceTextFallback(sentIndex);

  const wrap = document.createElement("div");
  wrap.className = "treeBlock treeBlockStacked";

  const tokenList = Array.from(goldMap.values()).map(tk => ({ id: tk.id, form: tk.form }));

  // ── Arc edge colors: match the text-tree legend ───────────────────────────
  // Gold arc colors: compare each gold arc against all file docMaps
  const docEdgesArr = docMaps.map(dm => edgesFromMap(dm));
  const goldArcColors = new Map();
  for(const [id, tok] of goldMap.entries()){
    if(tok.head == null) continue;
    const key = `${id}|${tok.head}`;
    const gDeprel = tok.deprel ?? '_';
    let anyPresent = false, allSame = true;
    for(const de of docEdgesArr){
      if(de.has(key)){ anyPresent = true; if(de.get(key) !== gDeprel) allSame = false; }
      else allSame = false;
    }
    goldArcColors.set(id,
      (!anyPresent || !docEdgesArr.length) ? 'var(--gold)'
      : allSame ? 'var(--ok)'
      : 'var(--warn)'
    );
  }

  // goldEdges cached for file-arc comparisons
  const goldEdges = edgesFromMap(goldMap);

  const goldSection = buildTreeSection(`S${sentIndex + 1}: ⭐ GOLD`, null, renderTreePlain(sentIndex, goldMap, sentenceText), {
    tokenList,
    arcMap: goldMap,
    arcEdgeColors: goldArcColors,
    arcOnSetHead: (depId, newHeadId) => {
      pushUndo();
      setCustomField(sentIndex, depId, 'head', newHeadId);
      renderSentence();
    },
    arcOnDeleteArc: (depId) => {
      pushUndo();
      // If there is a custom head override: revert it (falls back to file's head).
      // If the arc comes purely from the file: set head=0 (root) to "delete" it.
      const rawEntry = state.custom[sentIndex]?.[depId];
      const hasCustomHead = rawEntry?.head != null; // head=0 is valid, != null catches it
      if (hasCustomHead) {
        setCustomField(sentIndex, depId, 'head',   null);
        setCustomField(sentIndex, depId, 'deprel', null);
      } else {
        setCustomField(sentIndex, depId, 'head',   0);
        setCustomField(sentIndex, depId, 'deprel', 'root');
      }
      renderSentence();
    },
    arcOnSetDeprel: (depId, deprel) => {
      pushUndo();
      setCustomField(sentIndex, depId, 'deprel', deprel);
      renderSentence();
    },
  });
  wrap.appendChild(goldSection);

  for(let i=0; i<state.docs.length; i++){
    const name     = state.docs[i]?.name ?? t('tree.fileDefault', { n: i+1 });
    const otherMap = docMaps[i];
    const diff     = renderTreeDiff(sentIndex, goldMap, otherMap, sentenceText);
    const docIdx   = i;

    // File arc colors: compare each file arc to gold
    const fileArcColors = new Map();
    for(const [id, tok] of otherMap.entries()){
      if(tok.head == null) continue;
      const key = `${id}|${tok.head}`;
      if(goldEdges.has(key))
        fileArcColors.set(id, goldEdges.get(key) === (tok.deprel ?? '_') ? 'var(--ok)' : 'var(--warn)');
      else
        fileArcColors.set(id, 'var(--file)');
    }

    const section = buildTreeSection(`S${sentIndex + 1}: ${name}`, t('tree.vsGold'), diff, {
      tokenList,
      arcMap: otherMap,
      arcEdgeColors: fileArcColors,
      onAdoptSubtree: (rootId) => {
        pushUndo();
        const subIds = new Set([
          ...getSubtreeIds(rootId, goldMap),
          ...getSubtreeIds(rootId, otherMap),
        ]);
        for(const id of subIds){
          const e = state.custom[sentIndex]?.[id];
          if(e){
            e.head   = null;
            e.deprel = null;
            if(!getCustomEntry(sentIndex, id)) delete state.custom[sentIndex][id];
          }
          setDocChoice(sentIndex, id, docIdx);
        }
        if(state.custom[sentIndex] && !Object.keys(state.custom[sentIndex]).length)
          delete state.custom[sentIndex];
        renderSentence();
      },
      subtreeDiffCheck: (rootId) => hasSubtreeDiff(rootId, goldMap, otherMap),
      onAdoptToken: (tokId) => {
        pushUndo();
        const e = state.custom[sentIndex]?.[tokId];
        if(e){
          e.head   = null;
          e.deprel = null;
          if(!getCustomEntry(sentIndex, tokId)) delete state.custom[sentIndex][tokId];
          if(state.custom[sentIndex] && !Object.keys(state.custom[sentIndex]).length)
            delete state.custom[sentIndex];
        }
        setDocChoice(sentIndex, tokId, docIdx);
        renderSentence();
      },
    });
    wrap.appendChild(section);
  }

  treeGrid.appendChild(wrap);
}
