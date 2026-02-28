// Demo-Daten: drei Projekte für verschiedene Features.
//
//  Projekt 1 — Deutsch UD-Syntax-Vergleich (3 Dateien, 3 Sätze)
//    Alle Vergleichsfälle: HEAD-, DEPREL-, UPOS-, XPOS-Diff
//  Projekt 2 — Englisch Penn-Tagset (2 Dateien, 2 Sätze)
//    Eigener Tagset (Penn POS) + UD-Abhängigkeiten, garden-path Ambiguität
//  Projekt 3 — Freie Bearbeitung (1 Datei, 2 Sätze)
//    Single-file-Modus; Entsperren → Baumbearbeitung ausprobieren

// ── Tagset für Projekt 2 (Penn POS + UD-Deprels) ─────────────────────────────
const _PENN_LABELS = {
  "Core arguments":      ["nsubj", "obj", "iobj", "csubj", "ccomp", "xcomp"],
  "Non-core dependents": ["obl", "vocative", "expl", "dislocated"],
  "Modifiers":           ["advcl", "advmod", "amod", "det", "case", "mark", "nmod", "nummod", "acl", "appos"],
  "Function Words":      ["aux", "cop"],
  "Other":               ["conj", "cc", "compound", "flat", "fixed", "list", "parataxis", "punct", "root", "dep"],
  "__upos__": [
    "NN", "NNS", "NNP", "NNPS",
    "VB", "VBD", "VBZ", "VBP", "VBG", "VBN",
    "JJ", "JJR", "JJS",
    "RB", "RBR", "RBS",
    "DT", "PDT", "IN", "TO", "CC", "CD",
    "MD", "PRP", "PRP$", "WDT", "WP", "WP$", "WRB",
    "EX", "RP", "UH", "SYM", "FW", "LS", "POS",
    "``", "''", ".", ",", ":", "-LRB-", "-RRB-"
  ],
  "__xpos__": []
};

// ── CoNLL-U Inhalte ────────────────────────────────────────────────────────────

// Projekt 1: Deutsch, drei Dateien
const _DE_FILE1 = [
  "# text = Der Hund beißt den Mann .",
  "1\tDer\tder\tDET\tART\t_\t3\tdet\t_\t_",
  "2\tHund\tHund\tNOUN\tNN\t_\t3\tnsubj\t_\t_",
  "3\tbeißt\tbeißen\tVERB\tVVFIN\t_\t0\troot\t_\t_",
  "4\tden\tder\tDET\tART\t_\t5\tdet\t_\t_",
  "5\tMann\tMann\tNOUN\tNN\t_\t3\tobj\t_\t_",
  "6\t.\t.\tPUNCT\t$.\t_\t3\tpunct\t_\t_",
  "",
  "# text = Sie lächelt immer .",
  "1\tSie\tsie\tPRON\tPPER\t_\t2\tnsubj\t_\t_",
  "2\tlächelt\tlächeln\tVERB\tVVFIN\t_\t0\troot\t_\t_",
  "3\timmer\timmer\tADV\tADV\t_\t2\tadvmod\t_\t_",
  "4\t.\t.\tPUNCT\t$.\t_\t2\tpunct\t_\t_",
  "",
  "# text = Das Wetter ist schön .",
  "1\tDas\tder\tDET\tART\t_\t2\tdet\t_\t_",
  "2\tWetter\tWetter\tNOUN\tNN\t_\t3\tnsubj\t_\t_",
  "3\tist\tsein\tAUX\tVAFIN\t_\t0\troot\t_\t_",
  "4\tschön\tschön\tADJ\tADJD\t_\t3\tamod\t_\t_",
  "5\t.\t.\tPUNCT\t$.\t_\t3\tpunct\t_\t_",
  "",
].join("\n");

const _DE_FILE2 = [
  "# text = Der Hund beißt den Mann .",
  "1\tDer\tder\tPRON\tART\t_\t3\tdet\t_\t_",      // UPOS DET→PRON
  "2\tHund\tHund\tNOUN\tNN\t_\t3\tsubj\t_\t_",     // deprel nsubj→subj
  "3\tbeißt\tbeißen\tVERB\tVVFIN\t_\t0\troot\t_\t_",
  "4\tden\tder\tDET\tART\t_\t5\tdet\t_\t_",
  "5\tMann\tMann\tPROPN\tNN\t_\t3\tdobj\t_\t_",    // deprel obj→dobj + UPOS NOUN→PROPN
  "6\t.\t.\tPUNCT\t$.\t_\t3\tpunct\t_\t_",
  "",
  "# text = Sie lächelt immer .",
  "1\tSie\tsie\tPRON\tPPER\t_\t2\tnsubj\t_\t_",
  "2\tlächelt\tlächeln\tVERB\tVVFIN\t_\t0\troot\t_\t_",
  "3\timmer\timmer\tADV\tADV\t_\t2\tmod\t_\t_",    // deprel advmod→mod
  "4\t.\t.\tPUNC\t$.\t_\t2\tpunct\t_\t_",          // UPOS PUNCT→PUNC
  "",
  "# text = Das Wetter ist schön .",
  "1\tDas\tder\tDET\tART\t_\t2\tdet\t_\t_",
  "2\tWetter\tWetter\tNOUN\tNN\t_\t3\tnsubj\t_\t_",
  "3\tist\tsein\tAUX\tVAFIN\t_\t0\troot\t_\t_",
  "4\tschön\tschön\tADJ\tADJD\t_\t3\tamod\t_\t_",
  "5\t.\t.\tPUNCT\t$.\t_\t3\tpunct\t_\t_",         // identisch ✅
  "",
].join("\n");

const _DE_FILE3 = [
  "# text = Der Hund beißt den Mann .",
  "1\tDer\tder\tDET\tART\t_\t2\tdet\t_\t_",        // head 3→2
  "2\tHund\tHund\tNOUN\tNN\t_\t3\tnsubj\t_\t_",
  "3\tbeißt\tbeißen\tVERB\tVVFIN\t_\t0\troot\t_\t_",
  "4\tden\tder\tDET\tART\t_\t5\tdet\t_\t_",
  "5\tMann\tMann\tNOUN\tNN\t_\t3\tobj\t_\t_",
  "6\t.\t.\tPUNCT\tBEL\t_\t3\tpunct\t_\t_",        // XPOS $.→BEL
  "",
  "# text = Sie lächelt immer .",
  "1\tSie\tsie\tPRON\tPPER\t_\t2\tnsubj\t_\t_",
  "2\tlächelt\tlächeln\tVERB\tVVPS\t_\t0\troot\t_\t_", // XPOS VVFIN→VVPS
  "3\timmer\timmer\tADV\tADV\t_\t1\tadvmod\t_\t_",  // head 2→1
  "4\t.\t.\tPUNCT\t$.\t_\t2\tpunct\t_\t_",
  "",
  "# text = Das Wetter ist schön .",
  "1\tDas\tder\tDET\tART\t_\t2\tdet\t_\t_",
  "2\tWetter\tWetter\tNOUN\tNN\t_\t3\tnsubj\t_\t_",
  "3\tist\tsein\tAUX\tVAFIN\t_\t0\troot\t_\t_",
  "4\tschön\tschön\tADV\tADV\t_\t3\tamod\t_\t_",   // UPOS ADJ→ADV + XPOS ADJD→ADV
  "5\t.\t.\tPUNCT\t$.\t_\t3\tpunct\t_\t_",
  "",
].join("\n");

// Projekt 2: Englisch, zwei Annotator-Dateien, Penn-POS-Tagset
// S1: "The quick brown fox jumps over the lazy dog ."
// S2: "Time flies like an arrow ."  (garden-path Ambiguität)
const _EN_FILE_A = [
  "# sent_id = en-1",
  "# text = The quick brown fox jumps over the lazy dog .",
  "1\tThe\tthe\tDT\tDT\t_\t4\tdet\t_\t_",
  "2\tquick\tquick\tJJ\tJJ\t_\t4\tamod\t_\t_",
  "3\tbrown\tbrown\tJJ\tJJ\t_\t4\tamod\t_\t_",
  "4\tfox\tfox\tNN\tNN\t_\t5\tnsubj\t_\t_",
  "5\tjumps\tjump\tVBZ\tVBZ\t_\t0\troot\t_\t_",
  "6\tover\tover\tIN\tIN\t_\t9\tcase\t_\t_",
  "7\tthe\tthe\tDT\tDT\t_\t9\tdet\t_\t_",
  "8\tlazy\tlazy\tJJ\tJJ\t_\t9\tamod\t_\t_",
  "9\tdog\tdog\tNN\tNN\t_\t5\tobl\t_\t_",
  "10\t.\t.\t.\t.\t_\t5\tpunct\t_\t_",
  "",
  "# sent_id = en-2",
  "# text = Time flies like an arrow .",
  "1\tTime\ttime\tNN\tNN\t_\t2\tnsubj\t_\t_",
  "2\tflies\tfly\tVBZ\tVBZ\t_\t0\troot\t_\t_",
  "3\tlike\tlike\tIN\tIN\t_\t5\tcase\t_\t_",
  "4\tan\tan\tDT\tDT\t_\t5\tdet\t_\t_",
  "5\tarrow\tarrow\tNN\tNN\t_\t2\tobl\t_\t_",
  "6\t.\t.\t.\t.\t_\t2\tpunct\t_\t_",
  "",
].join("\n");

// Annotator B: abweichende Annotationen
//   S1: Token 2 JJ→JJR (falsche Komparativform), Token 6 case→prep,
//       Token 9 head 5→6 + obl→dobj (Fehler: hängt an Präposition)
//   S2: garden-path Lesart — Token 1 NN→VB + nsubj→root (Time = Verb),
//       Token 2 VBZ→NNS + root→nsubj (flies = Substantiv)
const _EN_FILE_B = [
  "# sent_id = en-1",
  "# text = The quick brown fox jumps over the lazy dog .",
  "1\tThe\tthe\tDT\tDT\t_\t4\tdet\t_\t_",
  "2\tquick\tquick\tJJR\tJJR\t_\t4\tamod\t_\t_",  // UPOS JJ→JJR
  "3\tbrown\tbrown\tJJ\tJJ\t_\t4\tamod\t_\t_",
  "4\tfox\tfox\tNN\tNN\t_\t5\tnsubj\t_\t_",
  "5\tjumps\tjump\tVBZ\tVBZ\t_\t0\troot\t_\t_",
  "6\tover\tover\tIN\tIN\t_\t9\tprep\t_\t_",       // deprel case→prep
  "7\tthe\tthe\tDT\tDT\t_\t9\tdet\t_\t_",
  "8\tlazy\tlazy\tJJ\tJJ\t_\t9\tamod\t_\t_",
  "9\tdog\tdog\tNN\tNN\t_\t6\tdobj\t_\t_",          // head 5→6 + obl→dobj
  "10\t.\t.\t.\t.\t_\t5\tpunct\t_\t_",
  "",
  "# sent_id = en-2",
  "# text = Time flies like an arrow .",
  "1\tTime\ttime\tVB\tVB\t_\t0\troot\t_\t_",       // NN→VB + nsubj→root (garden-path)
  "2\tflies\tfly\tNNS\tNNS\t_\t1\tnsubj\t_\t_",    // VBZ→NNS + root→nsubj
  "3\tlike\tlike\tIN\tIN\t_\t5\tcase\t_\t_",
  "4\tan\tan\tDT\tDT\t_\t5\tdet\t_\t_",
  "5\tarrow\tarrow\tNN\tNN\t_\t1\tobl\t_\t_",       // head 2→1
  "6\t.\t.\t.\t.\t_\t1\tpunct\t_\t_",              // head 2→1
  "",
].join("\n");

// Projekt 3: Einzeldatei, reichere Syntax für Bearbeitungs-Demo
const _EDIT_FILE = [
  "# sent_id = edit-1",
  "# text = Die Wissenschaftlerin erklärt den Studenten die komplexe Theorie .",
  "1\tDie\tder\tDET\tART\t_\t2\tdet\t_\t_",
  "2\tWissenschaftlerin\tWissenschaftlerin\tNOUN\tNN\t_\t3\tnsubj\t_\t_",
  "3\terklärt\terklären\tVERB\tVVFIN\t_\t0\troot\t_\t_",
  "4\tden\tder\tDET\tART\t_\t5\tdet\t_\t_",
  "5\tStudenten\tStudent\tNOUN\tNN\t_\t3\tiobj\t_\t_",
  "6\tdie\tder\tDET\tART\t_\t8\tdet\t_\t_",
  "7\tkomplexe\tkomplex\tADJ\tADJA\t_\t8\tamod\t_\t_",
  "8\tTheorie\tTheorie\tNOUN\tNN\t_\t3\tobj\t_\t_",
  "9\t.\t.\tPUNCT\t$.\t_\t3\tpunct\t_\t_",
  "",
  "# sent_id = edit-2",
  "# text = Neue Erkenntnisse verändern unser Verständnis grundlegend .",
  "1\tNeue\tneu\tADJ\tADJA\t_\t2\tamod\t_\t_",
  "2\tErkenntnisse\tErkenntnis\tNOUN\tNN\t_\t3\tnsubj\t_\t_",
  "3\tverändern\tverändern\tVERB\tVVFIN\t_\t0\troot\t_\t_",
  "4\tunser\tunser\tDET\tPPOSAT\t_\t5\tdet\t_\t_",
  "5\tVerständnis\tVerständnis\tNOUN\tNN\t_\t3\tobj\t_\t_",
  "6\tgrundlegend\tgrundlegend\tADV\tADV\t_\t3\tadvmod\t_\t_",
  "7\t.\t.\tPUNCT\t$.\t_\t3\tpunct\t_\t_",
  "",
].join("\n");

// ── Vollständiges Demo-Session-Objekt (v2 Multi-Projekt) ──────────────────────
const DEMO_SESSION = JSON.stringify({
  version: 2,
  activeProjectIdx: 0,
  projects: [
    {
      name: "Deutsch — UD-Syntax-Vergleich",
      docs: [
        { name: "datei1_referenz.conllu",    content: _DE_FILE1 },
        { name: "datei2_deprel_upos.conllu", content: _DE_FILE2 },
        { name: "datei3_head_xpos.conllu",   content: _DE_FILE3 },
      ],
      custom: {}, goldPick: {}, confirmed: [], notes: {}, flags: {},
      currentSent: 0, maxSents: 3, hiddenCols: [],
      undo: [], redo: [], labels: null, unlocked: false,
    },
    {
      name: "English — Penn Tagset",
      docs: [
        { name: "annotator_A.conllu", content: _EN_FILE_A },
        { name: "annotator_B.conllu", content: _EN_FILE_B },
      ],
      custom: {}, goldPick: {}, confirmed: [], notes: {}, flags: {},
      currentSent: 0, maxSents: 2, hiddenCols: [],
      undo: [], redo: [], labels: _PENN_LABELS, unlocked: false,
    },
    {
      name: "Bearbeitung — Single File",
      docs: [
        { name: "edit_demo.conllu", content: _EDIT_FILE },
      ],
      custom: {}, goldPick: {}, confirmed: [], notes: {}, flags: {},
      currentSent: 0, maxSents: 2, hiddenCols: [],
      undo: [], redo: [], labels: null, unlocked: false,
    },
  ],
});

// Rückwärtskompatibel: EXAMPLES für direkten Einzeldatei-Zugriff
const EXAMPLES = [
  { name: "datei1_referenz.conllu",    content: _DE_FILE1 },
  { name: "datei2_deprel_upos.conllu", content: _DE_FILE2 },
  { name: "datei3_head_xpos.conllu",   content: _DE_FILE3 },
];
