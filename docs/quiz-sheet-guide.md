# Quiz sheet guide

This sheet is how ACE writes quiz questions for the app. Put one question on each row. The first row names the columns, so leave it exactly as it is.

Start from `quiz-sheet-template.csv`. Its three rows that start with **EXAMPLE:** show one of each kind of question. Delete them before you send the sheet.

## The columns

| Column | What to write |
|---|---|
| **Cor** | The Cor the question suits: Crua, Ouro, Sol, Mar, Floresta, Ametista, Camaleão, Rubi or Diamante. Leave it blank if you're not sure. |
| **module** | Movements, Music, Culture or Graduation. |
| **topic** | A short name for the quiz, like *Instruments*. Rows with the same module and topic become one quiz. |
| **kind** | *multiple choice*, *matching* or *fill in the blank*. A blank cell means multiple choice. |
| **prompt** | The question, the way a kid will read it. Keep it short. |
| **options or pairs** | **Multiple choice:** the options, split by a bar: `Pandeiro \| Berimbau \| Atabaque`.<br>**Matching:** the pairs, each written as left = right, split by a bar: `Berimbau = A bow with one steel string \| Pandeiro = A tambourine with jingles`.<br>**Fill in the blank:** leave it empty. |
| **accepted answers** | **Multiple choice:** the right option, spelled the same as in the options.<br>**Fill in the blank:** every answer you'll accept, split by a bar: `Brasil \| Brazil`.<br>**Matching:** leave it empty, because the pairs are the answer. |
| **explanation** | Optional. One or two sentences kids see after they answer. |
| **ignore accents** | Optional, and only for fill in the blank. Write *yes* to accept *axe* for *Axé*. Leave it blank to require the accents. |

## Every row needs an answer

A row with no answer is turned away, and the import says which row and what's missing. The same goes for a multiple-choice answer that isn't one of the options, or a pair with no `=`.

## What the app forgives

For typed answers, the app ignores capital letters and extra spaces. It ignores accents only when **ignore accents** says *yes*. It doesn't fix spelling, so list the spellings you'll accept in **accepted answers**.

## Good to know

- Don't use `|` or `=` inside a question or an option, because they split items. A line break inside a cell splits items too.
- Once a quiz is live, add new questions at the bottom of its topic instead of moving rows around.
- Matching and fill-in-the-blank questions show up in lessons only after ACE approves the new formats. Until then, multiple choice is the only kind on screen.

## Sending it

In Google Sheets, choose **File → Download → Comma-separated values (.csv)**. In Excel, choose **Save As → CSV UTF-8**. Send the file to Camren.
