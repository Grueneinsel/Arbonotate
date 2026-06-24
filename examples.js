// Demo-Daten: drei Projekte für verschiedene Features.
//
//  Projekt 1 — Deutsch UD-Syntax-Vergleich (3 Dateien, 3 Sätze)
//    Alle Vergleichsfälle: HEAD-, DEPREL-, UPOS-, XPOS-Diff
//  Projekt 2 — Englisch Penn-Tagset (2 Dateien, 2 Sätze)
//    Eigener Tagset (Penn POS) + UD-Abhängigkeiten, garden-path Ambiguität
//  Projekt 3 — Freie Bearbeitung (1 Datei, 2 Sätze)
//    Single-file-Modus; Entsperren → Baumbearbeitung ausprobieren

// ── Tagset für Projekt 2 (Penn POS + UD-Deprels) ─────────────────────────────
// UPOS = Universal POS tags; XPOS = Penn Treebank POS tags
// Neues Format: __cols__ (Label-Spalten) + __dep_cols__ (Dependenz-Spalten).
const _PENN_LABELS = {
  "__cols__": [
    {
      key: "upos", name: "UPOS",
      values: ["ADJ", "ADP", "ADV", "AUX", "CCONJ", "DET", "INTJ", "NOUN", "NUM", "PART", "PRON", "PROPN", "PUNCT", "SCONJ", "SYM", "VERB", "X"],
    },
    {
      key: "xpos", name: "XPOS (Penn)",
      values: [
        "NN", "NNS", "NNP", "NNPS",
        "VB", "VBD", "VBZ", "VBP", "VBG", "VBN",
        "JJ", "JJR", "JJS",
        "RB", "RBR", "RBS",
        "DT", "PDT", "IN", "TO", "CC", "CD",
        "MD", "PRP", "PRP$", "WDT", "WP", "WP$", "WRB",
        "EX", "RP", "UH", "SYM", "FW", "LS", "POS",
        "``", "''", ".", ",", ":", "-LRB-", "-RRB-",
      ],
    },
  ],
  "__dep_cols__": [
    {
      key: "dep", name: "DepRel",
      groups: {
        "Core arguments":      ["nsubj", "obj", "iobj", "csubj", "ccomp", "xcomp"],
        "Non-core dependents": ["obl", "vocative", "expl", "dislocated"],
        "Modifiers":           ["advcl", "advmod", "amod", "det", "case", "mark", "nmod", "nummod", "acl", "appos"],
        "Function Words":      ["aux", "cop"],
        "Other":               ["conj", "cc", "compound", "flat", "fixed", "list", "parataxis", "punct", "root", "dep"],
      },
    },
  ],
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
// UPOS = Universal POS, XPOS = Penn POS
// S1: "The quick brown fox jumps over the lazy dog ."
// S2: "Time flies like an arrow ."  (garden-path Ambiguität)
const _EN_FILE_A = [
  "# sent_id = en-1",
  "# text = The quick brown fox jumps over the lazy dog .",
  "1\tThe\tthe\tDET\tDT\t_\t4\tdet\t_\t_",
  "2\tquick\tquick\tADJ\tJJ\t_\t4\tamod\t_\t_",
  "3\tbrown\tbrown\tADJ\tJJ\t_\t4\tamod\t_\t_",
  "4\tfox\tfox\tNOUN\tNN\t_\t5\tnsubj\t_\t_",
  "5\tjumps\tjump\tVERB\tVBZ\t_\t0\troot\t_\t_",
  "6\tover\tover\tADP\tIN\t_\t9\tcase\t_\t_",
  "7\tthe\tthe\tDET\tDT\t_\t9\tdet\t_\t_",
  "8\tlazy\tlazy\tADJ\tJJ\t_\t9\tamod\t_\t_",
  "9\tdog\tdog\tNOUN\tNN\t_\t5\tobl\t_\t_",
  "10\t.\t.\tPUNCT\t.\t_\t5\tpunct\t_\t_",
  "",
  "# sent_id = en-2",
  "# text = Time flies like an arrow .",
  "1\tTime\ttime\tNOUN\tNN\t_\t2\tnsubj\t_\t_",
  "2\tflies\tfly\tVERB\tVBZ\t_\t0\troot\t_\t_",
  "3\tlike\tlike\tADP\tIN\t_\t5\tcase\t_\t_",
  "4\tan\tan\tDET\tDT\t_\t5\tdet\t_\t_",
  "5\tarrow\tarrow\tNOUN\tNN\t_\t2\tobl\t_\t_",
  "6\t.\t.\tPUNCT\t.\t_\t2\tpunct\t_\t_",
  "",
].join("\n");

// Annotator B: abweichende Annotationen (jeweils ein gültiger, aber abweichender Baum)
//   S1: Token 2 XPOS JJ→JJR (falsche Komparativform),
//       Token 6 "over" head 9→5 + deprel case→prep (hängt am Verb statt am Nomen),
//       Token 9 "dog" head 5→6 + deprel obl→dobj (hängt an der Präposition)
//   S2: garden-path Lesart — Token 1 UPOS NOUN→VERB, XPOS NN→VB, deprel nsubj→root,
//       Token 2 UPOS VERB→NOUN, XPOS VBZ→NNS, deprel root→nsubj
const _EN_FILE_B = [
  "# sent_id = en-1",
  "# text = The quick brown fox jumps over the lazy dog .",
  "1\tThe\tthe\tDET\tDT\t_\t4\tdet\t_\t_",
  "2\tquick\tquick\tADJ\tJJR\t_\t4\tamod\t_\t_",  // XPOS JJ→JJR
  "3\tbrown\tbrown\tADJ\tJJ\t_\t4\tamod\t_\t_",
  "4\tfox\tfox\tNOUN\tNN\t_\t5\tnsubj\t_\t_",
  "5\tjumps\tjump\tVERB\tVBZ\t_\t0\troot\t_\t_",
  "6\tover\tover\tADP\tIN\t_\t5\tprep\t_\t_",      // head 9→5 + deprel case→prep
  "7\tthe\tthe\tDET\tDT\t_\t9\tdet\t_\t_",
  "8\tlazy\tlazy\tADJ\tJJ\t_\t9\tamod\t_\t_",
  "9\tdog\tdog\tNOUN\tNN\t_\t6\tdobj\t_\t_",        // head 5→6 + deprel obl→dobj
  "10\t.\t.\tPUNCT\t.\t_\t5\tpunct\t_\t_",
  "",
  "# sent_id = en-2",
  "# text = Time flies like an arrow .",
  "1\tTime\ttime\tVERB\tVB\t_\t0\troot\t_\t_",     // UPOS NOUN→VERB, XPOS NN→VB, deprel nsubj→root
  "2\tflies\tfly\tNOUN\tNNS\t_\t1\tnsubj\t_\t_",   // UPOS VERB→NOUN, XPOS VBZ→NNS, deprel root→nsubj
  "3\tlike\tlike\tADP\tIN\t_\t5\tcase\t_\t_",
  "4\tan\tan\tDET\tDT\t_\t5\tdet\t_\t_",
  "5\tarrow\tarrow\tNOUN\tNN\t_\t1\tobl\t_\t_",    // head 2→1
  "6\t.\t.\tPUNCT\t.\t_\t1\tpunct\t_\t_",          // head 2→1
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

// ── Projekt 4: Extremes Teilbaum-Beispiel ───────────────────────────────────
// Sehr tief verschachtelte Bäume (rechtsverzweigende Relativsätze + PP-Kette).
// Annotator B setzt Unterschiede tief im Baum, damit der ⑂-Teilbaum-Button auf
// JEDER darüberliegenden Verzweigung erscheint — der ganze Pfad zur Wurzel.
//
// Satz 1 — Relativsatz-Kette (acl), Tiefe ~6:
//   2(saw) → 4(man) → 6(knows) → 8(woman) → 10(owns) → 12(dog) → 14(chased) → 16(cat)
const _DEEP_A = [
  "# sent_id = deep-1",
  "# text = I saw the man who knows the woman that owns the dog which chased the cat .",
  "1\tI\tI\tPRON\tPRP\t_\t2\tnsubj\t_\t_",
  "2\tsaw\tsee\tVERB\tVBD\t_\t0\troot\t_\t_",
  "3\tthe\tthe\tDET\tDT\t_\t4\tdet\t_\t_",
  "4\tman\tman\tNOUN\tNN\t_\t2\tobj\t_\t_",
  "5\twho\twho\tPRON\tWP\t_\t6\tnsubj\t_\t_",
  "6\tknows\tknow\tVERB\tVBZ\t_\t4\tacl\t_\t_",
  "7\tthe\tthe\tDET\tDT\t_\t8\tdet\t_\t_",
  "8\twoman\twoman\tNOUN\tNN\t_\t6\tobj\t_\t_",
  "9\tthat\tthat\tPRON\tWDT\t_\t10\tnsubj\t_\t_",
  "10\towns\town\tVERB\tVBZ\t_\t8\tacl\t_\t_",
  "11\tthe\tthe\tDET\tDT\t_\t12\tdet\t_\t_",
  "12\tdog\tdog\tNOUN\tNN\t_\t10\tobj\t_\t_",
  "13\twhich\twhich\tPRON\tWDT\t_\t14\tnsubj\t_\t_",
  "14\tchased\tchase\tVERB\tVBD\t_\t12\tacl\t_\t_",
  "15\tthe\tthe\tDET\tDT\t_\t16\tdet\t_\t_",
  "16\tcat\tcat\tNOUN\tNN\t_\t14\tobj\t_\t_",
  "17\t.\t.\tPUNCT\t.\t_\t2\tpunct\t_\t_",
  "",
  // Satz 2 — PP-/nmod-Kette, Tiefe ~5:
  //   3(sat) → 6(mat) → 9(table) → 12(chair) → 15(wall)
  "# sent_id = deep-2",
  "# text = The cat sat on the mat under the table beside the chair near the wall .",
  "1\tThe\tthe\tDET\tDT\t_\t2\tdet\t_\t_",
  "2\tcat\tcat\tNOUN\tNN\t_\t3\tnsubj\t_\t_",
  "3\tsat\tsit\tVERB\tVBD\t_\t0\troot\t_\t_",
  "4\ton\ton\tADP\tIN\t_\t6\tcase\t_\t_",
  "5\tthe\tthe\tDET\tDT\t_\t6\tdet\t_\t_",
  "6\tmat\tmat\tNOUN\tNN\t_\t3\tobl\t_\t_",
  "7\tunder\tunder\tADP\tIN\t_\t9\tcase\t_\t_",
  "8\tthe\tthe\tDET\tDT\t_\t9\tdet\t_\t_",
  "9\ttable\ttable\tNOUN\tNN\t_\t6\tnmod\t_\t_",
  "10\tbeside\tbeside\tADP\tIN\t_\t12\tcase\t_\t_",
  "11\tthe\tthe\tDET\tDT\t_\t12\tdet\t_\t_",
  "12\tchair\tchair\tNOUN\tNN\t_\t9\tnmod\t_\t_",
  "13\tnear\tnear\tADP\tIN\t_\t15\tcase\t_\t_",
  "14\tthe\tthe\tDET\tDT\t_\t15\tdet\t_\t_",
  "15\twall\twall\tNOUN\tNN\t_\t12\tnmod\t_\t_",
  "16\t.\t.\tPUNCT\t.\t_\t3\tpunct\t_\t_",
  "",
].join("\n");

// Annotator B: Unterschiede bewusst TIEF im Baum platziert.
//   S1: 6 XPOS VBZ→VBD, 10 deprel acl→ccomp, 13 head 14→12 (tief),
//       16 UPOS NOUN→PROPN + deprel obj→nmod (tiefste Stelle)
//   S2: 4 deprel case→mark, 9 XPOS NN→NNS, 12 head 9→6,
//       15 head 12→3 + deprel nmod→obl (tiefste Stelle)
const _DEEP_B = [
  "# sent_id = deep-1",
  "# text = I saw the man who knows the woman that owns the dog which chased the cat .",
  "1\tI\tI\tPRON\tPRP\t_\t2\tnsubj\t_\t_",
  "2\tsaw\tsee\tVERB\tVBD\t_\t0\troot\t_\t_",
  "3\tthe\tthe\tDET\tDT\t_\t4\tdet\t_\t_",
  "4\tman\tman\tNOUN\tNN\t_\t2\tobj\t_\t_",
  "5\twho\twho\tPRON\tWP\t_\t6\tnsubj\t_\t_",
  "6\tknows\tknow\tVERB\tVBD\t_\t4\tacl\t_\t_",        // XPOS VBZ→VBD
  "7\tthe\tthe\tDET\tDT\t_\t8\tdet\t_\t_",
  "8\twoman\twoman\tNOUN\tNN\t_\t6\tobj\t_\t_",
  "9\tthat\tthat\tPRON\tWDT\t_\t10\tnsubj\t_\t_",
  "10\towns\town\tVERB\tVBZ\t_\t8\tccomp\t_\t_",        // deprel acl→ccomp
  "11\tthe\tthe\tDET\tDT\t_\t12\tdet\t_\t_",
  "12\tdog\tdog\tNOUN\tNN\t_\t10\tobj\t_\t_",
  "13\twhich\twhich\tPRON\tWDT\t_\t12\tnsubj\t_\t_",    // head 14→12
  "14\tchased\tchase\tVERB\tVBD\t_\t12\tacl\t_\t_",
  "15\tthe\tthe\tDET\tDT\t_\t16\tdet\t_\t_",
  "16\tcat\tcat\tPROPN\tNN\t_\t14\tnmod\t_\t_",          // UPOS NOUN→PROPN + deprel obj→nmod
  "17\t.\t.\tPUNCT\t.\t_\t2\tpunct\t_\t_",
  "",
  "# sent_id = deep-2",
  "# text = The cat sat on the mat under the table beside the chair near the wall .",
  "1\tThe\tthe\tDET\tDT\t_\t2\tdet\t_\t_",
  "2\tcat\tcat\tNOUN\tNN\t_\t3\tnsubj\t_\t_",
  "3\tsat\tsit\tVERB\tVBD\t_\t0\troot\t_\t_",
  "4\ton\ton\tADP\tIN\t_\t6\tmark\t_\t_",                // deprel case→mark
  "5\tthe\tthe\tDET\tDT\t_\t6\tdet\t_\t_",
  "6\tmat\tmat\tNOUN\tNN\t_\t3\tobl\t_\t_",
  "7\tunder\tunder\tADP\tIN\t_\t9\tcase\t_\t_",
  "8\tthe\tthe\tDET\tDT\t_\t9\tdet\t_\t_",
  "9\ttable\ttable\tNOUN\tNNS\t_\t6\tnmod\t_\t_",         // XPOS NN→NNS
  "10\tbeside\tbeside\tADP\tIN\t_\t12\tcase\t_\t_",
  "11\tthe\tthe\tDET\tDT\t_\t12\tdet\t_\t_",
  "12\tchair\tchair\tNOUN\tNN\t_\t6\tnmod\t_\t_",         // head 9→6
  "13\tnear\tnear\tADP\tIN\t_\t15\tcase\t_\t_",
  "14\tthe\tthe\tDET\tDT\t_\t15\tdet\t_\t_",
  "15\twall\twall\tNOUN\tNN\t_\t3\tobl\t_\t_",            // head 12→3 + deprel nmod→obl
  "16\t.\t.\tPUNCT\t.\t_\t3\tpunct\t_\t_",
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
    {
      name: "Teilbaum — Tiefe Bäume",
      docs: [
        { name: "annotator_A.conllu", content: _DEEP_A },
        { name: "annotator_B.conllu", content: _DEEP_B },
      ],
      custom: {}, goldPick: {}, confirmed: [], notes: {}, flags: {},
      currentSent: 0, maxSents: 2, hiddenCols: [],
      undo: [], redo: [], labels: _PENN_LABELS, unlocked: false,
    },
  ],
});

// Rückwärtskompatibel: EXAMPLES für direkten Einzeldatei-Zugriff
const EXAMPLES = [
  { name: "datei1_referenz.conllu",    content: _DE_FILE1 },
  { name: "datei2_deprel_upos.conllu", content: _DE_FILE2 },
  { name: "datei3_head_xpos.conllu",   content: _DE_FILE3 },
];
