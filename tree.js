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
  lines.push(`📝 S${sentIndex+1}: ${sentenceText}`);

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
    if(fg === fo) return `${tokId}:${fg}`;
    return `${tokId}:🅶${fg}|🅵${fo}`;
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

function buildTreeSection(title, sub, text){
  const section = document.createElement("div");
  section.className = "treeSection";

  const head = document.createElement("div");
  head.className = "treeHead";
  head.innerHTML = `
    <div class="title">${escapeHtml(title)}</div>
    ${sub ? `<div class="sub">${escapeHtml(sub)}</div>` : ""}
  `;
  section.appendChild(head);

  const pre = document.createElement("pre");
  pre.className = "treePre";

  const lines = text.split("\n");
  for(const line of lines){
    const tokMatch = line.match(/→\s*(\d+):/);
    if(tokMatch){
      const tokId = parseInt(tokMatch[1], 10);
      const span = document.createElement("span");
      span.className = "treeLine treeLineClickable";
      span.textContent = line + "\n";
      span.title = `Zur Zeile springen: Token ${tokId}`;
      span.addEventListener("click", () => scrollToToken(tokId));
      pre.appendChild(span);
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

  const goldSection = buildTreeSection("⭐ GOLD", null, renderTreePlain(sentIndex, goldMap, sentenceText));
  wrap.appendChild(goldSection);

  for(let i=0; i<state.docs.length; i++){
    const name = state.docs[i]?.name ?? `Datei ${i+1}`;
    const otherMap = docMaps[i];
    const diff = renderTreeDiff(sentIndex, goldMap, otherMap, sentenceText);
    const section = buildTreeSection(name, "vs Gold", diff);
    wrap.appendChild(section);
  }

  treeGrid.appendChild(wrap);
}
