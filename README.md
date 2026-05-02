# Science Student Assessment

A simple browser-based app for science teachers to assess students on three factors — **writing test**, **oral evaluation**, and **observation** — and arrive at an overall **level of understanding** (Beginner / Developing / Proficient / Advanced).

All data is stored locally in your browser. Nothing is sent to any server unless you explicitly enable AI suggestions with an Anthropic API key.

## Features

- Multiple **classes / sections** with their own student lists.
- Track **assessments over time** (each one has a date and topic).
- **Rubric** rating per factor: Beginner / Developing / Proficient / Advanced.
- **Free-text notes** per factor, per student, per assessment.
- **Class overview** table — see every student's overall level across recent assessments at a glance.
- **Per-student progress view** with full history.
- **Printable report card** for each student (use your browser's print dialog).
- **AI observation evaluator** — when you write an observation note, the app suggests a rubric level (you confirm or override). Choose your provider in Settings: built-in local keyword scorer (offline, no setup), **Google Gemini** (free with a Google account), or **Anthropic Claude** (paid pay-as-you-go).
- **Export / Import** your data as JSON for backup or moving between devices.

## How to run

You can either:

1. **Just open `index.html`** in your browser (Chrome, Firefox, Safari, Edge). No install needed.
2. Or serve the folder locally:

   ```bash
   python3 -m http.server 8000
   # then open http://localhost:8000
   ```

## How to use

1. **Add a class** on the home page (e.g., "Grade 7 Science").
2. **Open the class** and add students.
3. Click **+ New assessment**, give it a topic ("Photosynthesis") and date.
4. For each student, click the rubric buttons for **Writing test**, **Oral evaluation**, and **Observation**, and add notes if you like. The overall level is computed for you.
5. When you type into an **observation** notes field, the app suggests a rubric level — click **Accept** to use it or just click a different rubric button.
6. View any student to see their full history and **Print report card**.

## AI observation evaluator (optional)

By default the app uses a built-in keyword-based scorer that works offline with no setup. You can also pick one of two AI providers in **Settings → Provider**:

### Option A — Google Gemini (free)

1. Go to <https://aistudio.google.com/app/apikey> and sign in with a Google account.
2. Click **Create API key** and copy the key (starts with `AIza...`).
3. In the app, open **Settings**, set **Provider** to **Google Gemini**, paste the key, and click **Save**.

The free tier on Gemini 2.5 Flash is plenty for daily classroom use (no credit card required).

### Option B — Anthropic Claude (paid)

1. Get an API key at <https://console.anthropic.com> (requires adding billing — a few dollars of credit lasts a long time).
2. In the app, open **Settings**, set **Provider** to **Anthropic Claude**, paste the key, and click **Save**.

The app uses `claude-haiku-4-5` for fast, low-cost classifications.

> **Important:** API keys are stored in this browser's `localStorage`, which means anyone with access to this browser/device could read them. Use the **Clear keys** button on shared computers.

## Backing up your data

- Click **Export data** on the Classes page to download a JSON backup.
- Use **Import data** to restore from a backup (overwrites current data).
- All data lives under the `ssa_data_v1` and `ssa_settings_v1` keys in your browser's `localStorage`. Clearing site data will wipe it — back up first.

## Project structure

```
.
├── index.html
├── css/styles.css
└── js/
    ├── storage.js      # localStorage helpers + data model
    ├── rubric.js       # rubric levels + overall computation
    ├── evaluator.js    # Claude API + local rule-based fallback
    ├── app.js          # tiny router + render helpers
    └── views/
        ├── classes.js
        ├── classView.js
        ├── assessment.js
        ├── student.js
        └── settings.js
```

No build step. No npm. Vanilla HTML / CSS / JavaScript.
