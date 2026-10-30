# CLAUDE.md

## Tech Stack

- Plain HTML, CSS, and JavaScript only.
- No frameworks or libraries (no React, Vue, Tailwind, etc.).
- No build step: files are opened or served exactly as written.

## Project Structure

The repository is nearly empty for now. Suggested layout as files are added:

```
/
├── CLAUDE.md      # This file
├── index.html     # Main page
├── css/           # Stylesheets
├── js/            # Scripts
└── assets/        # Images, icons, fonts
```

Update this section when the structure changes.

## Key Requirements

1. **Responsive design:** every page must work on desktop, tablet, and phone.
2. **Light/dark theme:** users can switch between a light and a dark theme.
   The light theme is the default.
3. **Readable text:** text must stay easy to read, with good contrast
   (a clear difference between text color and background color),
   in both the light and the dark theme.

## Feature Plan

**Portal:** BMS Interface Builder, for facilities management students.
(BMS = Building Management System, the software that runs a building's
heating, lighting, ventilation, etc.)

### Portal structure

- **Homepage** (`index.html`): portal name, theme toggle, a short intro,
  and a grid of tool cards, one card per tool.
- **Opening a tool:** clicking a card opens that tool's own page.
- **Getting back:** every tool page has the same header. The portal name
  links to the homepage, and there is a "← All tools" link.
- **Adding a tool later:** create a folder `tools/<tool-name>/` with its
  own `index.html`, CSS and JS, then add one card for it on the homepage.
  Shared styles (`css/main.css`) and the theme toggle (`js/theme.js`)
  are reused by every page.

### Phases

**Phase 1: Portal + BMS Interface Builder**
- Homepage with one tool card.
- Builder: students place push buttons and toggle switches on a
  6 × 8 snap-to-grid dashboard. They drag on desktop and tap-to-place on
  phones, and can rename, move or delete controls.
- Edit mode (arrange) and Use mode (switches flip, buttons flash).
- Layout saved automatically in the browser (`localStorage`).

**Phase 2: Link controls to building equipment**
- Connect each button or switch to a simulated device, such as a light,
  fan or pump, and show that device's state change.

**Phase 3: More tools (2–3)**
- Further tools that build on the dashboard. Details to be decided.

## Rules for Claude

- Explain technical terms in plain language.
- Ask before making big changes.
- When unsure, ask instead of guessing.
