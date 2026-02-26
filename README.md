# CoNLL-U Vergleich

Browserbasiertes Tool zum Vergleichen und Annotieren mehrerer CoNLL-U-Dateien.
Läuft vollständig lokal ohne Server — einfach `index.html` im Browser öffnen.

---

## Schnellstart

1. `index.html` im Browser öffnen
2. Mindestens zwei `.conllu`-Dateien laden — oder **„Demo laden"** klicken
3. Satz auswählen → Baumansicht und Vergleichstabelle erscheinen automatisch
4. Gold-Zellen klicken oder Tastaturkürzel nutzen, um Annotationen zu bearbeiten
5. Fertigen Satz mit **„✓ Bestätigen"** markieren (oder `Space`)
6. **💾 Session speichern** — Fortschritt jederzeit als JSON sichern und später fortsetzen

---

## 1) Dateien laden

| Aktion | Beschreibung |
|--------|-------------|
| **„Dateien hinzufügen"** | Öffnet den Datei-Dialog; mehrere Dateien gleichzeitig wählbar |
| **Drag & Drop** | `.conllu`/`.conll`/`.txt`-Dateien direkt auf die Seite ziehen |
| **Drag & Drop (Session)** | `.json`-Session-Datei auf die Seite ziehen → wird automatisch importiert |
| **„Demo laden"** | Drei vorgefertigte Beispieldateien, die alle Vergleichsfälle abdecken |
| **„Löschen"** | Einzelne Datei aus der Liste entfernen |
| **„Reset"** | Alle Dateien und Annotationen zurücksetzen |

Unterstützte Formate: `.conllu`, `.conll`, `.txt`

### Textkonsistenzwarnung

Haben zwei Dateien bei gleicher Satznummer unterschiedliche Tokens:
- **⚠️-Badge** neben dem Dateinamen
- Oranges **Warnbanner** unterhalb der Dateiliste

---

## 2) Satz wählen

### Dropdown

Jede Option zeigt:
- Satznummer und Stern `★` wenn bestätigt
- Tokenanzahl
- Anzahl der Abweichungen (`· N Diffs`) oder Haken (`· ✓`) bei vollständiger Übereinstimmung

**Farben im Dropdown:**

| Farbe | Bedeutung |
|-------|-----------|
| Grün | Keine Abweichungen |
| Rot | Mindestens eine Abweichung |
| Gold | Satz wurde bestätigt (`★`) |

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

Über **„✓ Bestätigen"** (oder `Space`) wird der aktuelle Satz als abgeschlossen markiert.
Bestätigte Sätze werden gold eingefärbt (Dropdown, Satz-Map, Satztext-Rahmen, Button).
Erneutes Drücken hebt die Bestätigung wieder auf.

---

## 3) Baumansicht

Zeigt den aktuellen Satz als Abhängigkeitsbäume. Für jede geladene Datei gibt es einen Diff-Baum gegen die Gold-Annotation.

### Legende

| Symbol/Farbe | Bedeutung |
|---|---|
| ✅ grün | Kante identisch mit Gold |
| ⚠️ gelb | Gleicher HEAD, aber abweichendes DEPREL / UPOS / XPOS (`🅶X\|🅵Y`) |
| 🅶 gold | Kante nur in Gold vorhanden |
| 🅵 blau | Kante nur in dieser Datei vorhanden |
| 🌱 | Wurzel eines Teilbaums |

UPOS- und XPOS-Unterschiede werden ebenfalls als `[UPOS:🅶X\|🅵Y]` bzw. `[XPOS:🅶X\|🅵Y]` annotiert.

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
| **GOLD** | Aktuelle Gold-Annotation (`HEAD / DEPREL · UPOS·XPOS`); Badge `C` = Custom, `D1`/`D2`/… = Datei |
| **Datei-Spalten** | Annotation jeder Datei; grün = identisch mit Gold, rot = abweichend |

In den Datei-Spalten werden HEAD/DEPREL und UPOS·XPOS jeweils einzeln hervorgehoben — abweichende Felder erscheinen **rot** (`.fDiff`).

### Gold-Auswahl

- **Klick auf eine Datei-Zelle** → wählt diese Datei als Gold-Quelle für diesen Token (Badge `D1`, `D2`, …)
- Ist ein Custom-Wert gesetzt, haben Custom-Werte immer Vorrang; Datei-Zellen sind dann ausgegraut

### Gold-Popup (Bearbeiten)

**Klick auf eine Gold-Zelle** öffnet ein Popup zum direkten Bearbeiten:

| Feld | Eingabe |
|------|---------|
| HEAD | Dropdown aller Tokens des aktuellen Satzes |
| DEPREL | Dropdown (aus `labels.js`) |
| UPOS | Dropdown oder Freitextfeld |
| XPOS | Dropdown oder Freitextfeld |

Änderungen werden sofort als Custom-Eintrag gespeichert. **„Zurücksetzen"** löscht den Custom-Eintrag für diesen Token.

**Tastatur im Popup:** `Tab`/`Shift+Tab` wechselt Felder · `Enter` schließt · `r` zurücksetzen · `Esc` schließen

### Custom-Annotation

- **„Custom aus [Datei]"-Buttons** kopieren alle Werte der gewählten Datei als Custom-Ausgangsbasis
- **„Custom Satz löschen"** entfernt alle Custom-Einträge für den aktuellen Satz (mit Bestätigung)
- Sobald ein Custom-Wert gesetzt ist, gilt dieser Token als Gold (`C`-Badge)

### Spalten ein-/ausblenden

Über die **Spalten-Toggle-Leiste** lassen sich Datei-Spalten ein- und ausblenden.

---

## 5) Export

### CoNLL-U & Baumansicht

| Button | Inhalt |
|--------|--------|
| **Gold CoNLL-U herunterladen** | Alle Sätze mit aktuellen Gold-Annotationen (HEAD, DEPREL, UPOS, XPOS); LEMMA/FEATS/DEPS/MISC aus Quelldatei |
| **Baumansicht herunterladen** | Alle Sätze als Text-Bäume mit Gold-Baum und Diff-Bäumen pro Datei |

Tastaturkürzel: `e` → CoNLL-U · `E` → Baumansicht

### Session Export / Import

Der **Session-Mechanismus** sichert den vollständigen Arbeitsstand:

- Alle geladenen CoNLL-U-Dateien (Inhalt)
- Custom-Annotationen und Gold-Auswahl
- Bestätigte Sätze
- Vollständiger Undo-/Redo-Verlauf
- Labelkonfiguration (`labels.js`)

| Aktion | Beschreibung |
|--------|-------------|
| **💾 Session speichern** | Exportiert alles als `.json`-Datei |
| **📂 Session laden** | Importiert eine gespeicherte Session-Datei |
| **Drag & Drop** | `.json`-Datei auf die Seite ziehen → wird automatisch als Session erkannt |

Das Session-Format ist versioniert (`version: 1`) und als JSON lesbar.

---

## 6) Undo / Redo

Alle Annotationsänderungen (Datei-Auswahl, Custom-Popup, Bestätigen, Teilbaum-Übernahme) sind rückgängig machbar.

| Aktion | Beschreibung |
|--------|-------------|
| **↩ Undo** / `Ctrl+Z` | Letzte Änderung rückgängig |
| **↪ Redo** / `Ctrl+Y` | Rückgängige Änderung wiederherstellen |

Der Verlauf wird in der Session mitgespeichert (bis zu 80 Schritte).

---

## Tastaturkürzel

| Taste | Funktion |
|-------|----------|
| `←` / `→` | Vorheriger / nächster Satz |
| `Ctrl+←` / `Ctrl+→` | Erster / letzter Satz |
| `n` / `N` | Nächster / vorheriger Satz mit Diffs |
| `↑` / `↓` | Tabellenzeile navigieren |
| `Enter` | Gold-Popup für fokussierte Zeile öffnen |
| `Space` | Satz bestätigen / Bestätigung aufheben |
| `1`–`9` | Datei N als Gold-Quelle für fokussierte Zeile wählen |
| `Ctrl+1`–`9` | Custom aus Datei N laden |
| `Ctrl+Z` | Undo |
| `Ctrl+Y` | Redo |
| `Del` / `Backspace` | Custom des aktuellen Satzes löschen |
| `e` | Gold CoNLL-U exportieren |
| `E` (Shift+e) | Baumansicht exportieren |
| `?` | Hilfe öffnen / schließen |
| `Esc` | Fokus / Popup / Hilfe schließen |

---

## Mehrsprachigkeit

Die Oberfläche unterstützt **Deutsch** und **Englisch** — umschaltbar über die Flaggen-Buttons oben rechts. Die gewählte Sprache wird im Browser gespeichert (`localStorage`).

### Weitere Sprachen hinzufügen

1. Neue Datei `lang/xx.js` anlegen (nach dem Schema von `lang/de.js`):

```javascript
window.LANG_XX = {
  'sec.files':   '...',
  // alle Schlüssel aus lang/de.js übersetzen
};
```

2. In `index.html` einbinden (vor `js/i18n.js`):

```html
<script src="lang/xx.js"></script>
```

3. Flaggen-Button hinzufügen:

```html
<button class="langBtn" data-lang="xx" onclick="setLang('xx')" title="...">🏳️</button>
```

Oder dynamisch zur Laufzeit:

```javascript
registerLang('xx', window.LANG_XX);
```

---

## labels.js

Im gleichen Ordner wie `index.html` liegt `labels.js`, die Dropdown-Inhalte definiert:

```javascript
const LABELS = {
  "Core arguments": ["nsubj", "obj", "iobj", ...],
  "Non-core dependents": ["obl", "advmod", ...],
  // ...
  "__upos__": ["ADJ", "ADP", "ADV", "AUX", ...],
  "__xpos__": ["ADJA", "ADJD", "NN", "NE", ...]
};
```

| Schlüssel | Beschreibung |
|-----------|-------------|
| Beliebige Strings | Gruppierter Abschnitt im DEPREL-Dropdown |
| `__upos__` | Optionen für das UPOS-Feld (leer → Freitextfeld) |
| `__xpos__` | Optionen für das XPOS-Feld (leer → Freitextfeld) |

Labels werden mit der Session gespeichert und beim Laden wiederhergestellt.

---

## Hilfe-Modal

Der **`?`-Button** oben rechts (oder Taste `?`) öffnet diese Dokumentation direkt im Browser.

Die Hilfe wird aus `generated/readme_content.js` geladen — einem vorgefertigten JS-Bundle:

```bash
python make_readme_js.py
```

Das Skript liest `README.md` und schreibt `generated/readme_content.js`. Nach Änderungen an der README einmal ausführen und die Seite neu laden.

---

## Einschränkungen

- **Multi-Word-Tokens** (IDs mit `-` oder `.`) werden ignoriert
- Mindestens **zwei Dateien** nötig für Vergleich und Baumansicht
- Daten liegen nur im **Browser-Speicher** — Session-Export verwenden, um den Stand dauerhaft zu sichern
