# CoNLL-U Comparison

Browser-based tool for comparing and annotating multiple CoNLL-U files.
Runs entirely locally without a server — simply open `index.html` in your browser.

---

## Quick Start

1. Open `index.html` in your browser
2. Load at least two `.conllu` files — or click **"Load demo"**
3. Select a sentence → tree view and comparison table appear automatically
4. Click Gold cells or use keyboard shortcuts to edit annotations
5. Mark a finished sentence with **"✓ Confirm"** (or `Space`)
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
| `[` | Previous project |
| `]` | Next project |

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
| **"Add files"** | Opens the file dialog; `.conllu`, `.conll`, `.txt` and `.json` files selectable |
| **Drag & Drop** | Drop files directly onto the page |
| **Drag & Drop (Session)** | Drop a `.json` session file onto the page → imported automatically |
| **"Load demo"** | Three pre-built example files covering all comparison cases |
| **"Reset"** | Reset all files and annotations |

Supported formats: `.conllu`, `.conll`, `.txt` (data) · `.json` (session)

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
- Sentence number and star `★` if confirmed
- Token count
- Number of differences (`· N diffs`) or a checkmark (`· ✓`) if fully matching

**Colours in the dropdown:**

| Colour | Meaning |
|--------|---------|
| Green | No differences |
| Red | At least one difference |
| Gold | Sentence confirmed (`★`) |

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

Use **"✓ Confirm"** (or `Space`) to mark the current sentence as finished.
Confirmed sentences are coloured gold (dropdown, sentence map, sentence text border, button).
Pressing again removes the confirmation.

### Note per Sentence

Below the sentence text there is a **note field** — free text, saved per sentence and exported with the session.

### Copy CoNLL-U

The **"Copy CoNLL-U" button** (or key `c`) copies the Gold annotation of the current sentence as CoNLL-U to the clipboard.

---

## 3) Tree View

Shows the current sentence as dependency trees. For each loaded file a diff tree against the Gold annotation is displayed.

### Legend

| Symbol/Colour | Meaning |
|---|---|
| ✅ green | Edge identical to Gold |
| ⚠️ yellow | Same HEAD but different DEPREL / UPOS / XPOS (`🅶X\|🅵Y`) |
| 🅶 gold | Edge only in Gold |
| 🅵 blue | Edge only in this file |
| 🌱 | Subtree root |

UPOS and XPOS differences are also annotated as `[UPOS:🅶X\|🅵Y]` and `[XPOS:🅶X\|🅵Y]`.

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
| **GOLD** | Current Gold annotation (`HEAD / DEPREL · UPOS·XPOS`); badge `C` = custom, `D1`/`D2`/… = file |
| **File columns** | Each file's annotation; green = matches Gold, red = differs |

In file columns, HEAD/DEPREL and UPOS·XPOS are highlighted individually — differing fields appear **red** (`.fDiff`).

### Gold Selection

- **Click a file cell** → selects that file as the Gold source for this token (badge `D1`, `D2`, …)
- If a custom value is set, custom values always take precedence; file cells are then greyed out

### Gold Popup (Edit)

**Click a Gold cell** to open an edit popup:

| Field | Input |
|-------|-------|
| HEAD | Dropdown of all tokens in the current sentence |
| DEPREL | Dropdown (from `labels.js`) |
| UPOS | Dropdown or free-text field |
| XPOS | Dropdown or free-text field |

Changes are saved immediately as a custom entry. **"Reset"** removes the custom entry for this token.

**Keyboard in popup:** `Tab`/`Shift+Tab` switch fields · `Enter` closes · `r` reset · `Esc` close

### Custom Annotation

- **"Custom from [file]" buttons** copy all values of the chosen file as a custom starting point
- **"Clear custom sentence"** removes all custom entries for the current sentence (with confirmation)
- Once a custom value is set, that token is treated as Gold (`C` badge)

### Show/Hide Columns

Use the **column toggle bar** to show or hide individual file columns.

---

## 5) Export

### Individual File

The **⬇ button** next to each file downloads the original file content as `.conllu`.

### All Sentences (Gold Annotation)

| Button | Content |
|--------|---------|
| **Download Gold CoNLL-U** | All sentences with current Gold annotations (HEAD, DEPREL, UPOS, XPOS); LEMMA/FEATS/DEPS/MISC from source file |
| **Download tree view** | All sentences as plain-text trees with Gold tree and diff trees per file |

Keyboard shortcuts: `e` → CoNLL-U · `E` → tree view · `c` → copy current sentence to clipboard

### Session Export / Import

The **session mechanism** saves the complete working state of all projects:

- All projects with names, files, and annotations
- Custom annotations and Gold selection
- Confirmed sentences and notes
- Full undo/redo history per project
- Label configuration (`labels.js`)

| Action | Description |
|--------|-------------|
| **💾 Save session** | Exports everything as a `.json` file |
| **📂 Load session** | Imports a saved session file |
| **Drag & Drop** | Drop a `.json` file onto the page → automatically recognised as a session |

The session format is versioned (`version: 2`) and human-readable JSON. Older sessions (`version: 1`) are automatically imported as a single project.

### Autosave

The working state is automatically saved to the browser's LocalStorage every **30 seconds**. On the next page load, a banner offers the option to restore or dismiss the saved state.

---

## 6) Undo / Redo

All annotation changes (file selection, custom popup, confirm, subtree adoption) can be undone. Each project has its own undo stack.

| Action | Description |
|--------|-------------|
| **↩ Undo** / `Ctrl+Z` | Undo last change |
| **↪ Redo** / `Ctrl+Y` | Redo undone change |

The history is saved with the session (up to 80 steps per project).

---

## Keyboard Shortcuts

| Key | Function |
|-----|----------|
| `←` / `→` | Previous / next sentence |
| `Ctrl+←` / `Ctrl+→` | First / last sentence |
| `n` / `N` | Next / previous sentence with diffs |
| `[` / `]` | Previous / next project |
| `↑` / `↓` | Navigate table rows |
| `Enter` | Open Gold popup for focused row |
| `Space` | Confirm / unconfirm sentence |
| `1`–`9` | Select file N as Gold source for focused row |
| `Ctrl+1`–`9` | Load custom from file N |
| `Ctrl+Z` | Undo |
| `Ctrl+Y` | Redo |
| `Del` / `Backspace` | Delete custom for current sentence |
| `c` | Copy current sentence as CoNLL-U to clipboard |
| `e` | Export Gold CoNLL-U |
| `E` (Shift+e) | Export tree view |
| `?` | Open / close help |
| `Esc` | Clear focus / close popup / close help |

---

## Multiple Languages

The interface supports **German** and **English** — switchable via the flag buttons in the top right. The chosen language is stored in the browser (`localStorage`).

### Adding More Languages

1. Create a new file `lang/xx.js` (following the pattern of `lang/en.js`):

```javascript
window.LANG_XX = {
  'sec.files':   '...',
  // translate all keys from lang/en.js
};
```

2. Include it in `index.html` (before `js/i18n.js`):

```html
<script src="lang/xx.js"></script>
```

3. Add a flag button:

```html
<button class="langBtn" data-lang="xx" onclick="setLang('xx')" title="...">🏳️</button>
```

Or register dynamically at runtime:

```javascript
registerLang('xx', window.LANG_XX);
```

---

## labels.js

`labels.js` in the same folder as `index.html` defines the dropdown contents:

```javascript
const LABELS = {
  "Core arguments": ["nsubj", "obj", "iobj", ...],
  "Non-core dependents": ["obl", "advmod", ...],
  // ...
  "__upos__": ["ADJ", "ADP", "ADV", "AUX", ...],
  "__xpos__": ["ADJA", "ADJD", "NN", "NE", ...]
};
```

| Key | Description |
|-----|-------------|
| Any string | Grouped section in the DEPREL dropdown |
| `__upos__` | Options for the UPOS field (empty → free-text input) |
| `__xpos__` | Options for the XPOS field (empty → free-text input) |

Labels are saved with the session and restored on load.

---

## Help Modal

The **`?` button** in the top right (or press `?`) opens this documentation directly in the browser.

The help is loaded from `generated/readme_content.js` — a pre-built JS bundle:

```bash
python make_readme_js.py
```

This script reads `README.md` and `README.en.md` and writes `generated/readme_content.js`. Run it once after editing either README, then reload the page.

---

## Limitations

- **Multi-word tokens** (IDs with `-` or `.`) are ignored
- At least **two files** are required for comparison and tree view
- Data lives only in **browser memory** — use session export to save your progress permanently
