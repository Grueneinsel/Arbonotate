// Auto-generated — do not edit manually.
// Regenerate with:  python make_readme_js.py

window.README_CONTENT_DE = `# CoNLL-U Vergleich

Browserbasiertes Tool zum Vergleichen und Annotieren mehrerer CoNLL-U-Dateien.
Läuft vollständig lokal ohne Server — einfach \`index.html\` im Browser öffnen.

---

## Schnellstart

1. \`index.html\` im Browser öffnen
2. Mindestens zwei \`.conllu\`-Dateien laden — oder **„Demo laden"** klicken
3. Satz auswählen → Baumansicht und Vergleichstabelle erscheinen automatisch
4. Gold-Zellen klicken oder Tastaturkürzel nutzen, um Annotationen zu bearbeiten
5. Fertigen Satz mit **„✓ Bestätigen"** markieren (oder \`Space\`)
6. **💾 Session speichern** — Fortschritt jederzeit als JSON sichern und später fortsetzen

---

## Projekte

Das Tool unterstützt mehrere **Projekte** gleichzeitig — jedes mit eigenen Dateien, Annotationen und Undo-Verlauf.

### Projekt-Tab-Leiste

Die Tab-Leiste erscheint direkt unterhalb des Headers. Jeder Tab hat:

| Schaltfläche | Funktion |
|---|---|
| **◀ / ▶** | Projekt in der Reihenfolge verschieben |
| **✎** | Projekt umbenennen |
| **×** | Projekt löschen (nur wenn mehr als 1 Projekt vorhanden) |
| **+** (rechts außen) | Neues leeres Projekt anlegen |

Klick auf einen Tab → wechselt zum Projekt. Der Zustand (Dateien, Satzposition, Undo-Stack) wird beim Wechsel automatisch gespeichert und wiederhergestellt.

### Tastaturkürzel für Projekte

| Taste | Funktion |
|---|---|
| \`[\` | Vorheriges Projekt |
| \`]\` | Nächstes Projekt |

### Automatische Zuweisung beim Laden

Werden Dateien mit **unterschiedlichen Satzzahlen** geladen, ordnet das Tool sie automatisch den passenden Projekten zu:

1. **Eigenes Projekt** (aktiv) — wenn leer oder passende Satzzahl
2. **Anderes bestehendes Projekt** — mit übereinstimmender Satzzahl
3. **Anderes leeres Projekt** — als letzter Ausweg
4. **Neues Projekt anlegen** — nur wenn kein passendes gefunden

Wenn ein neues Projekt automatisch angelegt wurde, erscheint kurz eine Hinweismeldung.

---

## 1) Dateien laden

| Aktion | Beschreibung |
|--------|-------------|
| **„Dateien hinzufügen"** | Öffnet den Datei-Dialog; \`.conllu\`, \`.conll\`, \`.txt\` und \`.json\` wählbar |
| **Drag & Drop** | Dateien direkt auf die Seite ziehen |
| **Drag & Drop (Session)** | \`.json\`-Session-Datei auf die Seite ziehen → wird automatisch importiert |
| **„Demo laden"** | Drei vorgefertigte Beispieldateien, die alle Vergleichsfälle abdecken |
| **„Reset"** | Alle Dateien und Annotationen zurücksetzen |

Unterstützte Formate: \`.conllu\`, \`.conll\`, \`.txt\` (Daten) · \`.json\` (Session)

### Datei-Aktionen pro Zeile

Jede geladene Datei hat folgende Schaltflächen:

| Schaltfläche | Funktion |
|---|---|
| **⬇** | Datei als CoNLL-U herunterladen (Original-Inhalt) |
| **Projekt-Dropdown** | Datei in ein anderes Projekt verschieben; **＋ Neues Projekt …** legt ein neues an und verschiebt sofort |
| **▲ / ▼** | Reihenfolge innerhalb des Projekts tauschen |
| **Löschen** | Datei aus dem Projekt entfernen |

### Textkonsistenzwarnung

Haben zwei Dateien bei gleicher Satznummer unterschiedliche Tokens:
- **⚠️-Badge** neben dem Dateinamen
- Oranges **Warnbanner** unterhalb der Dateiliste

---

## 2) Satz wählen

### Dropdown

Jede Option zeigt:
- Satznummer und Stern \`★\` wenn bestätigt
- Tokenanzahl
- Anzahl der Abweichungen (\`· N Diffs\`) oder Haken (\`· ✓\`) bei vollständiger Übereinstimmung

**Farben im Dropdown:**

| Farbe | Bedeutung |
|-------|-----------|
| Grün | Keine Abweichungen |
| Rot | Mindestens eine Abweichung |
| Gold | Satz wurde bestätigt (\`★\`) |

Der **Rahmen des Dropdowns** spiegelt den Status des aktuellen Satzes wider (grün / rot / gold).

### Satztext

Der Satztext erscheint als klickbare Tokens. Ein Klick auf ein Wort:
- Springt zur entsprechenden Zeile in der Vergleichstabelle
- Hebt das Token im Satztext hervor (blauer Rahmen)
- Funktioniert auch andersrum: Tastaturnavigation (↑/↓) hebt das aktive Wort im Satztext hervor

### Satz-Map

Unterhalb des Satztextes erscheint eine Reihe kleiner **farbiger Punkte** — einer pro Satz:

| Farbe | Bedeutung |
|-------|-----------|
| Dunkelgrün | Kein Diff |
| Dunkelrot | Hat Diffs |
| Gold | Bestätigt |
| Blauer Rahmen | Aktuell ausgewählter Satz |

Klick auf einen Punkt springt direkt zu diesem Satz.

### Gold bestätigen

Über **„✓ Bestätigen"** (oder \`Space\`) wird der aktuelle Satz als abgeschlossen markiert.
Bestätigte Sätze werden gold eingefärbt (Dropdown, Satz-Map, Satztext-Rahmen, Button).
Erneutes Drücken hebt die Bestätigung wieder auf.

### Notiz pro Satz

Unterhalb des Satztextes gibt es ein **Notizfeld** — freier Text, der pro Satz gespeichert und mit der Session exportiert wird.

### CoNLL-U kopieren

Der **„Copy CoNLL-U"-Button** (oder Taste \`c\`) kopiert die Gold-Annotation des aktuellen Satzes als CoNLL-U in die Zwischenablage.

---

## 3) Baumansicht

Zeigt den aktuellen Satz als Abhängigkeitsbäume. Für jede geladene Datei gibt es einen Diff-Baum gegen die Gold-Annotation.

### Legende

| Symbol/Farbe | Bedeutung |
|---|---|
| ✅ grün | Kante identisch mit Gold |
| ⚠️ gelb | Gleicher HEAD, aber abweichendes DEPREL / UPOS / XPOS (\`🅶X\\|🅵Y\`) |
| 🅶 gold | Kante nur in Gold vorhanden |
| 🅵 blau | Kante nur in dieser Datei vorhanden |
| 🌱 | Wurzel eines Teilbaums |

UPOS- und XPOS-Unterschiede werden ebenfalls als \`[UPOS:🅶X\\|🅵Y]\` bzw. \`[XPOS:🅶X\\|🅵Y]\` annotiert.

### Interaktion

- **Klick auf eine Zeile** → springt zur zugehörigen Zeile in der Vergleichstabelle
- **„→ Gold"-Button** an jeder 🌱-Zeile → übernimmt den gesamten Teilbaum als Gold-Annotation

---

## 4) Vergleichstabelle

### Spalten

| Spalte | Inhalt |
|--------|--------|
| **ID** | Token-ID |
| **FORM** | Wortform |
| **UPOS** | Gold-UPOS; gelber Rahmen wenn Dateien abweichen; pinker Rahmen bei Unterschied |
| **XPOS** | Gold-XPOS; pinker Rahmen bei Unterschied |
| **GOLD** | Aktuelle Gold-Annotation (\`HEAD / DEPREL · UPOS·XPOS\`); Badge \`C\` = Custom, \`D1\`/\`D2\`/… = Datei |
| **Datei-Spalten** | Annotation jeder Datei; grün = identisch mit Gold, rot = abweichend |

In den Datei-Spalten werden HEAD/DEPREL und UPOS·XPOS jeweils einzeln hervorgehoben — abweichende Felder erscheinen **rot** (\`.fDiff\`).

### Gold-Auswahl

- **Klick auf eine Datei-Zelle** → wählt diese Datei als Gold-Quelle für diesen Token (Badge \`D1\`, \`D2\`, …)
- Ist ein Custom-Wert gesetzt, haben Custom-Werte immer Vorrang; Datei-Zellen sind dann ausgegraut

### Gold-Popup (Bearbeiten)

**Klick auf eine Gold-Zelle** öffnet ein Popup zum direkten Bearbeiten:

| Feld | Eingabe |
|------|---------|
| HEAD | Dropdown aller Tokens des aktuellen Satzes |
| DEPREL | Dropdown (aus \`labels.js\`) |
| UPOS | Dropdown oder Freitextfeld |
| XPOS | Dropdown oder Freitextfeld |

Änderungen werden sofort als Custom-Eintrag gespeichert. **„Zurücksetzen"** löscht den Custom-Eintrag für diesen Token.

**Tastatur im Popup:** \`Tab\`/\`Shift+Tab\` wechselt Felder · \`Enter\` schließt · \`r\` zurücksetzen · \`Esc\` schließen

### Custom-Annotation

- **„Custom aus [Datei]"-Buttons** kopieren alle Werte der gewählten Datei als Custom-Ausgangsbasis
- **„Custom Satz löschen"** entfernt alle Custom-Einträge für den aktuellen Satz (mit Bestätigung)
- Sobald ein Custom-Wert gesetzt ist, gilt dieser Token als Gold (\`C\`-Badge)

### Spalten ein-/ausblenden

Über die **Spalten-Toggle-Leiste** lassen sich Datei-Spalten ein- und ausblenden.

---

## 5) Export

### Einzelne Datei

Der **⬇-Button** neben jeder Datei lädt den Original-Inhalt der Datei als \`.conllu\` herunter.

### Alle Sätze (Gold-Annotation)

| Button | Inhalt |
|--------|--------|
| **Gold CoNLL-U herunterladen** | Alle Sätze mit aktuellen Gold-Annotationen (HEAD, DEPREL, UPOS, XPOS); LEMMA/FEATS/DEPS/MISC aus Quelldatei |
| **Baumansicht herunterladen** | Alle Sätze als Text-Bäume mit Gold-Baum und Diff-Bäumen pro Datei |

Tastaturkürzel: \`e\` → CoNLL-U · \`E\` → Baumansicht · \`c\` → aktuellen Satz in Zwischenablage

### Session Export / Import

Der **Session-Mechanismus** sichert den vollständigen Arbeitsstand aller Projekte:

- Alle Projekte mit Namen, Dateien und Annotationen
- Custom-Annotationen und Gold-Auswahl
- Bestätigte Sätze und Notizen
- Vollständiger Undo-/Redo-Verlauf pro Projekt
- Labelkonfiguration (\`labels.js\`)

| Aktion | Beschreibung |
|--------|-------------|
| **💾 Session speichern** | Exportiert alles als \`.json\`-Datei |
| **📂 Session laden** | Importiert eine gespeicherte Session-Datei |
| **Drag & Drop** | \`.json\`-Datei auf die Seite ziehen → wird automatisch als Session erkannt |

Das Session-Format ist versioniert (\`version: 2\`) und als JSON lesbar. Ältere Sessions (\`version: 1\`) werden automatisch als einzelnes Projekt importiert.

### Autosave

Der Arbeitsstand wird alle **30 Sekunden** automatisch im Browser-LocalStorage gesichert. Beim nächsten Öffnen der Seite erscheint ein Banner mit der Option, den Stand wiederherzustellen oder zu verwerfen.

---

## 6) Undo / Redo

Alle Annotationsänderungen (Datei-Auswahl, Custom-Popup, Bestätigen, Teilbaum-Übernahme) sind rückgängig machbar. Jedes Projekt hat seinen eigenen Undo-Stack.

| Aktion | Beschreibung |
|--------|-------------|
| **↩ Undo** / \`Ctrl+Z\` | Letzte Änderung rückgängig |
| **↪ Redo** / \`Ctrl+Y\` | Rückgängige Änderung wiederherstellen |

Der Verlauf wird in der Session mitgespeichert (bis zu 80 Schritte pro Projekt).

---

## Tastaturkürzel

| Taste | Funktion |
|-------|----------|
| \`←\` / \`→\` | Vorheriger / nächster Satz |
| \`Ctrl+←\` / \`Ctrl+→\` | Erster / letzter Satz |
| \`n\` / \`N\` | Nächster / vorheriger Satz mit Diffs |
| \`[\` / \`]\` | Vorheriges / nächstes Projekt |
| \`↑\` / \`↓\` | Tabellenzeile navigieren |
| \`Enter\` | Gold-Popup für fokussierte Zeile öffnen |
| \`Space\` | Satz bestätigen / Bestätigung aufheben |
| \`1\`–\`9\` | Datei N als Gold-Quelle für fokussierte Zeile wählen |
| \`Ctrl+1\`–\`9\` | Custom aus Datei N laden |
| \`Ctrl+Z\` | Undo |
| \`Ctrl+Y\` | Redo |
| \`Del\` / \`Backspace\` | Custom des aktuellen Satzes löschen |
| \`c\` | Aktuellen Satz als CoNLL-U in Zwischenablage kopieren |
| \`e\` | Gold CoNLL-U exportieren |
| \`E\` (Shift+e) | Baumansicht exportieren |
| \`?\` | Hilfe öffnen / schließen |
| \`Esc\` | Fokus / Popup / Hilfe schließen |

---

## Mehrsprachigkeit

Die Oberfläche unterstützt **Deutsch** und **Englisch** — umschaltbar über die Flaggen-Buttons oben rechts. Die gewählte Sprache wird im Browser gespeichert (\`localStorage\`).

### Weitere Sprachen hinzufügen

1. Neue Datei \`lang/xx.js\` anlegen (nach dem Schema von \`lang/de.js\`):

\`\`\`javascript
window.LANG_XX = {
  'sec.files':   '...',
  // alle Schlüssel aus lang/de.js übersetzen
};
\`\`\`

2. In \`index.html\` einbinden (vor \`js/i18n.js\`):

\`\`\`html
<script src="lang/xx.js"></script>
\`\`\`

3. Flaggen-Button hinzufügen:

\`\`\`html
<button class="langBtn" data-lang="xx" onclick="setLang('xx')" title="...">🏳️</button>
\`\`\`

Oder dynamisch zur Laufzeit:

\`\`\`javascript
registerLang('xx', window.LANG_XX);
\`\`\`

---

## labels.js

Im gleichen Ordner wie \`index.html\` liegt \`labels.js\`, die Dropdown-Inhalte definiert:

\`\`\`javascript
const LABELS = {
  "Core arguments": ["nsubj", "obj", "iobj", ...],
  "Non-core dependents": ["obl", "advmod", ...],
  // ...
  "__upos__": ["ADJ", "ADP", "ADV", "AUX", ...],
  "__xpos__": ["ADJA", "ADJD", "NN", "NE", ...]
};
\`\`\`

| Schlüssel | Beschreibung |
|-----------|-------------|
| Beliebige Strings | Gruppierter Abschnitt im DEPREL-Dropdown |
| \`__upos__\` | Optionen für das UPOS-Feld (leer → Freitextfeld) |
| \`__xpos__\` | Optionen für das XPOS-Feld (leer → Freitextfeld) |

Labels werden mit der Session gespeichert und beim Laden wiederhergestellt.

---

## Hilfe-Modal

Der **\`?\`-Button** oben rechts (oder Taste \`?\`) öffnet diese Dokumentation direkt im Browser.

Die Hilfe wird aus \`generated/readme_content.js\` geladen — einem vorgefertigten JS-Bundle:

\`\`\`bash
python make_readme_js.py
\`\`\`

Das Skript liest \`README.md\` und schreibt \`generated/readme_content.js\`. Nach Änderungen an der README einmal ausführen und die Seite neu laden.

---

## Einschränkungen

- **Multi-Word-Tokens** (IDs mit \`-\` oder \`.\`) werden ignoriert
- Mindestens **zwei Dateien** nötig für Vergleich und Baumansicht
- Daten liegen nur im **Browser-Speicher** — Session-Export verwenden, um den Stand dauerhaft zu sichern
`;

window.README_CONTENT_EN = `# CoNLL-U Comparison

Browser-based tool for comparing and annotating multiple CoNLL-U files.
Runs entirely locally without a server — simply open \`index.html\` in your browser.

---

## Quick Start

1. Open \`index.html\` in your browser
2. Load at least two \`.conllu\` files — or click **"Load demo"**
3. Select a sentence → tree view and comparison table appear automatically
4. Click Gold cells or use keyboard shortcuts to edit annotations
5. Mark a finished sentence with **"✓ Confirm"** (or \`Space\`)
6. **💾 Save session** — save your progress as JSON at any time and resume later

---

## Projects

The tool supports multiple **projects** simultaneously — each with its own files, annotations, and undo history.

### Project Tab Bar

The tab bar appears directly below the header. Each tab has:

| Button | Function |
|---|---|
| **◀ / ▶** | Reorder projects |
| **✎** | Rename project |
| **×** | Delete project (only when more than one project exists) |
| **+** (far right) | Create a new empty project |

Click a tab to switch to that project. State (files, sentence position, undo stack) is automatically saved and restored on switch.

### Keyboard Shortcuts for Projects

| Key | Function |
|---|---|
| \`[\` | Previous project |
| \`]\` | Next project |

### Automatic Assignment on Load

When files with **different sentence counts** are loaded, the tool assigns them to projects automatically:

1. **Own project** (active) — if empty or matching sentence count
2. **Other existing project** — with matching sentence count
3. **Other empty project** — as a last resort
4. **Create new project** — only if no match found

A brief notification appears when a new project is created automatically.

---

## 1) Load Files

| Action | Description |
|--------|-------------|
| **"Add files"** | Opens the file dialog; \`.conllu\`, \`.conll\`, \`.txt\` and \`.json\` files selectable |
| **Drag & Drop** | Drop files directly onto the page |
| **Drag & Drop (Session)** | Drop a \`.json\` session file onto the page → imported automatically |
| **"Load demo"** | Three pre-built example files covering all comparison cases |
| **"Reset"** | Reset all files and annotations |

Supported formats: \`.conllu\`, \`.conll\`, \`.txt\` (data) · \`.json\` (session)

### Per-File Actions

Each loaded file has the following buttons:

| Button | Function |
|---|---|
| **⬇** | Download file as CoNLL-U (original content) |
| **Project dropdown** | Move file to another project; **＋ New project …** creates one and moves the file immediately |
| **▲ / ▼** | Change order within the project |
| **Remove** | Remove file from the project |

### Text Consistency Warning

If two files have different tokens at the same sentence index:
- **⚠️ badge** next to the filename
- Orange **warning banner** below the file list

---

## 2) Select Sentence

### Dropdown

Each option shows:
- Sentence number and star \`★\` if confirmed
- Token count
- Number of differences (\`· N diffs\`) or a checkmark (\`· ✓\`) if fully matching

**Colours in the dropdown:**

| Colour | Meaning |
|--------|---------|
| Green | No differences |
| Red | At least one difference |
| Gold | Sentence confirmed (\`★\`) |

The **dropdown border** reflects the status of the current sentence (green / red / gold).

### Sentence Text

The sentence text is rendered as clickable tokens. Clicking a word:
- Jumps to the corresponding row in the comparison table
- Highlights the token in the sentence text (blue outline)
- Works in reverse too: keyboard navigation (↑/↓) highlights the active word in the sentence text

### Sentence Map

Below the sentence text, a row of small **coloured dots** appears — one per sentence:

| Colour | Meaning |
|--------|---------|
| Dark green | No diff |
| Dark red | Has diffs |
| Gold | Confirmed |
| Blue outline | Currently selected sentence |

Click a dot to jump directly to that sentence.

### Confirm Gold

Use **"✓ Confirm"** (or \`Space\`) to mark the current sentence as finished.
Confirmed sentences are coloured gold (dropdown, sentence map, sentence text border, button).
Pressing again removes the confirmation.

### Note per Sentence

Below the sentence text there is a **note field** — free text, saved per sentence and exported with the session.

### Copy CoNLL-U

The **"Copy CoNLL-U" button** (or key \`c\`) copies the Gold annotation of the current sentence as CoNLL-U to the clipboard.

---

## 3) Tree View

Shows the current sentence as dependency trees. For each loaded file a diff tree against the Gold annotation is displayed.

### Legend

| Symbol/Colour | Meaning |
|---|---|
| ✅ green | Edge identical to Gold |
| ⚠️ yellow | Same HEAD but different DEPREL / UPOS / XPOS (\`🅶X\\|🅵Y\`) |
| 🅶 gold | Edge only in Gold |
| 🅵 blue | Edge only in this file |
| 🌱 | Subtree root |

UPOS and XPOS differences are also annotated as \`[UPOS:🅶X\\|🅵Y]\` and \`[XPOS:🅶X\\|🅵Y]\`.

### Interaction

- **Click a line** → jumps to the corresponding row in the comparison table
- **"→ Gold" button** at each 🌱 line → adopts the entire subtree as the Gold annotation

---

## 4) Comparison Table

### Columns

| Column | Content |
|--------|---------|
| **ID** | Token ID |
| **FORM** | Word form |
| **UPOS** | Gold UPOS; yellow border when files differ; pink border on mismatch |
| **XPOS** | Gold XPOS; pink border on mismatch |
| **GOLD** | Current Gold annotation (\`HEAD / DEPREL · UPOS·XPOS\`); badge \`C\` = custom, \`D1\`/\`D2\`/… = file |
| **File columns** | Each file's annotation; green = matches Gold, red = differs |

In file columns, HEAD/DEPREL and UPOS·XPOS are highlighted individually — differing fields appear **red** (\`.fDiff\`).

### Gold Selection

- **Click a file cell** → selects that file as the Gold source for this token (badge \`D1\`, \`D2\`, …)
- If a custom value is set, custom values always take precedence; file cells are then greyed out

### Gold Popup (Edit)

**Click a Gold cell** to open an edit popup:

| Field | Input |
|-------|-------|
| HEAD | Dropdown of all tokens in the current sentence |
| DEPREL | Dropdown (from \`labels.js\`) |
| UPOS | Dropdown or free-text field |
| XPOS | Dropdown or free-text field |

Changes are saved immediately as a custom entry. **"Reset"** removes the custom entry for this token.

**Keyboard in popup:** \`Tab\`/\`Shift+Tab\` switch fields · \`Enter\` closes · \`r\` reset · \`Esc\` close

### Custom Annotation

- **"Custom from [file]" buttons** copy all values of the chosen file as a custom starting point
- **"Clear custom sentence"** removes all custom entries for the current sentence (with confirmation)
- Once a custom value is set, that token is treated as Gold (\`C\` badge)

### Show/Hide Columns

Use the **column toggle bar** to show or hide individual file columns.

---

## 5) Export

### Individual File

The **⬇ button** next to each file downloads the original file content as \`.conllu\`.

### All Sentences (Gold Annotation)

| Button | Content |
|--------|---------|
| **Download Gold CoNLL-U** | All sentences with current Gold annotations (HEAD, DEPREL, UPOS, XPOS); LEMMA/FEATS/DEPS/MISC from source file |
| **Download tree view** | All sentences as plain-text trees with Gold tree and diff trees per file |

Keyboard shortcuts: \`e\` → CoNLL-U · \`E\` → tree view · \`c\` → copy current sentence to clipboard

### Session Export / Import

The **session mechanism** saves the complete working state of all projects:

- All projects with names, files, and annotations
- Custom annotations and Gold selection
- Confirmed sentences and notes
- Full undo/redo history per project
- Label configuration (\`labels.js\`)

| Action | Description |
|--------|-------------|
| **💾 Save session** | Exports everything as a \`.json\` file |
| **📂 Load session** | Imports a saved session file |
| **Drag & Drop** | Drop a \`.json\` file onto the page → automatically recognised as a session |

The session format is versioned (\`version: 2\`) and human-readable JSON. Older sessions (\`version: 1\`) are automatically imported as a single project.

### Autosave

The working state is automatically saved to the browser's LocalStorage every **30 seconds**. On the next page load, a banner offers the option to restore or dismiss the saved state.

---

## 6) Undo / Redo

All annotation changes (file selection, custom popup, confirm, subtree adoption) can be undone. Each project has its own undo stack.

| Action | Description |
|--------|-------------|
| **↩ Undo** / \`Ctrl+Z\` | Undo last change |
| **↪ Redo** / \`Ctrl+Y\` | Redo undone change |

The history is saved with the session (up to 80 steps per project).

---

## Keyboard Shortcuts

| Key | Function |
|-----|----------|
| \`←\` / \`→\` | Previous / next sentence |
| \`Ctrl+←\` / \`Ctrl+→\` | First / last sentence |
| \`n\` / \`N\` | Next / previous sentence with diffs |
| \`[\` / \`]\` | Previous / next project |
| \`↑\` / \`↓\` | Navigate table rows |
| \`Enter\` | Open Gold popup for focused row |
| \`Space\` | Confirm / unconfirm sentence |
| \`1\`–\`9\` | Select file N as Gold source for focused row |
| \`Ctrl+1\`–\`9\` | Load custom from file N |
| \`Ctrl+Z\` | Undo |
| \`Ctrl+Y\` | Redo |
| \`Del\` / \`Backspace\` | Delete custom for current sentence |
| \`c\` | Copy current sentence as CoNLL-U to clipboard |
| \`e\` | Export Gold CoNLL-U |
| \`E\` (Shift+e) | Export tree view |
| \`?\` | Open / close help |
| \`Esc\` | Clear focus / close popup / close help |

---

## Multiple Languages

The interface supports **German** and **English** — switchable via the flag buttons in the top right. The chosen language is stored in the browser (\`localStorage\`).

### Adding More Languages

1. Create a new file \`lang/xx.js\` (following the pattern of \`lang/en.js\`):

\`\`\`javascript
window.LANG_XX = {
  'sec.files':   '...',
  // translate all keys from lang/en.js
};
\`\`\`

2. Include it in \`index.html\` (before \`js/i18n.js\`):

\`\`\`html
<script src="lang/xx.js"></script>
\`\`\`

3. Add a flag button:

\`\`\`html
<button class="langBtn" data-lang="xx" onclick="setLang('xx')" title="...">🏳️</button>
\`\`\`

Or register dynamically at runtime:

\`\`\`javascript
registerLang('xx', window.LANG_XX);
\`\`\`

---

## labels.js

\`labels.js\` in the same folder as \`index.html\` defines the dropdown contents:

\`\`\`javascript
const LABELS = {
  "Core arguments": ["nsubj", "obj", "iobj", ...],
  "Non-core dependents": ["obl", "advmod", ...],
  // ...
  "__upos__": ["ADJ", "ADP", "ADV", "AUX", ...],
  "__xpos__": ["ADJA", "ADJD", "NN", "NE", ...]
};
\`\`\`

| Key | Description |
|-----|-------------|
| Any string | Grouped section in the DEPREL dropdown |
| \`__upos__\` | Options for the UPOS field (empty → free-text input) |
| \`__xpos__\` | Options for the XPOS field (empty → free-text input) |

Labels are saved with the session and restored on load.

---

## Help Modal

The **\`?\` button** in the top right (or press \`?\`) opens this documentation directly in the browser.

The help is loaded from \`generated/readme_content.js\` — a pre-built JS bundle:

\`\`\`bash
python make_readme_js.py
\`\`\`

This script reads \`README.md\` and \`README.en.md\` and writes \`generated/readme_content.js\`. Run it once after editing either README, then reload the page.

---

## Limitations

- **Multi-word tokens** (IDs with \`-\` or \`.\`) are ignored
- At least **two files** are required for comparison and tree view
- Data lives only in **browser memory** — use session export to save your progress permanently
`;
