# Stronger by Science (SBS) Novice Hypertrophy Progression

Dieses Dokument beschreibt die in der **HomeGym** App implementierte Progressionslogik und die dazugehörigen Komfort-Features für das Training.

---

## 📅 1. Die Progressionslogik (Das 9-Stufen-Modell)

Für jede reguläre Übung läuft das Training über eine Treppe aus **9 Stufen** bei konstantem Gewicht ab. 

### Die Stufenleiter:
1. **Stufe 1:** 3 Sätze × 8 Wiederholungen (`3 × 8`)
2. **Stufe 2:** 4 Sätze × 8 Wiederholungen (`4 × 8`)
3. **Stufe 3:** 5 Sätze × 8 Wiederholungen (`5 × 8`)
4. **Stufe 4:** 3 Sätze × 10 Wiederholungen (`3 × 10`)
5. **Stufe 5:** 4 Sätze × 10 Wiederholungen (`4 × 10`)
6. **Stufe 6:** 5 Sätze × 10 Wiederholungen (`5 × 10`)
7. **Stufe 7:** 3 Sätze × 12 Wiederholungen (`3 × 12`)
8. **Stufe 8:** 4 Sätze × 12 Wiederholungen (`4 × 12`)
9. **Stufe 9:** 5 Sätze × 12 Wiederholungen (`5 × 12`)

---

## ⚡ 2. Automatische Steigerung (Level Up & Gewicht)

Am Ende deines Workouts (beim Klick auf **"Workout abschließen"**) prüft die App für jede Übung deinen Erfolg:

- **Erfolgs-Bedingung:** Du hast mindestens alle vorgegebenen Arbeitssätze abgeschlossen und in **jedem** dieser Sätze mindestens die Ziel-Wiederholungszahl erreicht (oder übertroffen).

### Was passiert bei Erfolg?
- **Wenn du auf Stufe 1 bis 8 bist:** Du steigst für das nächste Workout um eine Stufe auf (z. B. von `3 × 8` auf `4 × 8`). Das Gewicht bleibt gleich.
- **Wenn du Stufe 9 (`5 × 12`) geschafft hast:** 
  - Die Stufe wird für das nächste Mal wieder auf **Stufe 1 (`3 × 8`)** zurückgesetzt.
  - Das Zielgewicht wird automatisch um eine Stufe deines Hantelsystems **erhöht**.
- **Wenn du die Vorgabe nicht geschafft hast:** Du verbleibst beim nächsten Workout auf deiner aktuellen Stufe mit demselben Gewicht.

### Deine Kurzhantelstufen (in kg):
Die Gewichtssteigerung orientiert sich an deinen real einstellbaren Kurzhantelgewichten:
`1,5 kg` ➔ `3 kg` ➔ `6 kg` ➔ `7 kg` ➔ `8 kg` ➔ `9 kg` ➔ `11 kg` ➔ `12 kg` ➔ `13 kg` ➔ `14 kg` ➔ `16 kg` ➔ `18 kg`

---

## 🛠️ 3. Komfort-Features beim Eintragen

### 1. Satz-Voraussortierung (Pre-Population)
Sobald du ein Workout startest, trägt die App alle Zielsätze direkt in das Protokoll ein. Du musst im Regelfall nur noch den grünen Haken pro Satz antippen, wenn du ihn abgeschlossen hast.

### 2. Automatische Aufwärmsätze (Warmup)
Bei schweren Hauptübungen (*Floor Press, Overhead Press, Pull-Up, Glute Bridge, Hip Thrust, Single-Arm Row*) werden automatisch **2 Aufwärmsätze** ganz oben in der Liste hinzugefügt:
- **Satz 1:** 10 Wiederholungen mit **50%** deines Ziel-Arbeitsgewichts.
- **Satz 2:** 5 Wiederholungen mit **70%** deines Ziel-Arbeitsgewichts.
- *Die Gewichte werden mathematisch exakt auf deine real verfügbaren Kurzhantelstufen gerundet.*
- *Bei reinen Isolationsübungen werden keine Aufwärmsätze vorausgefüllt.*

### 3. Gewichts-Fortschreibung (Weight Propagation)
Wenn du während des Trainings das Gewicht eines Satzes änderst (z. B. weil du dich stärker fühlst und von 12 kg auf 14 kg erhöhst), **übernimmt die App dieses neue Gewicht automatisch für alle folgenden, noch nicht erledigten Arbeitssätze dieser Übung**. Du musst den Wert also nur noch einmalig anfassen.

---

## 🔄 4. Manuelles Überspringen (Progression anpassen)

In jeder Übungskarte findest du während des Trainings den Button **"Progression anpassen"**. Klickst du darauf, öffnet sich ein Menü, in dem du:
- Jede der 9 Progressionstufen direkt auswählen kannst (um z. B. Stufen zu überspringen).
- Das Zielgewicht manuell anpassen kannst.

Deine manuelle Änderung wird direkt in deinem Trainingsplan abgespeichert und für das nächste Mal übernommen.
