# Concise Plan — Markdown → PDF Web App

Goal: Minimal, client-only app to paste Markdown, preview (GitHub style), render Mermaid, and export clean, unclipped PDFs.

## 1) Setup
1. [ ] Files: `index.html`, `styles.css`, `app.js`, `README.md`
2. [ ] CDN libs: `markdown-it`, `mermaid`, `html2pdf.js`, `github-markdown-css`
3. [ ] Meta: charset + viewport

## 2) UI/UX (modern, elegant, clean)
1. [ ] Minimal layout: main Markdown paste area + right sidebar for optional styling
2. [ ] Default styling = GitHub; user may tweak options (optional)
3. [ ] Generate button at bottom triggers PDF; lock styling controls during export
4. [ ] Desktop: split; Mobile: stacked; no heavy/bad gradients; ample whitespace; system fonts
5. [ ] Elements: `#md-input` textarea, `#preview.markdown-body`, sidebar controls, bottom Generate
6. [ ] Accessibility: labels, titles, keyboard focus states

## 3) CSS
1. [ ] Layout with flex/grid; editor + preview area; right sidebar scrollable; editor resizable horizontally
2. [ ] Apply `github-markdown-css` to `.markdown-body`; neutral palette; clean sidebar controls
3. [ ] Print breaks: avoid inside `.mermaid`, `.diagram`, `pre`, `code`, `table`; avoid orphan headings; images/diagrams scale

## 4) JS
1. [ ] Markdown-it init (html, linkify, typographer)
2. [ ] Debounced input → render to `#preview`
3. [ ] Sidebar styling controls (optional): font size, line height, margins, theme tweak (GitHub-based defaults)
4. [ ] Mermaid: detect fenced `mermaid`; render to SVG; wrap in `.diagram`; safe re-renders
5. [ ] Generate: disable/lock sidebar controls during export; re-enable after
6. [ ] PDF: wait for diagrams; html2pdf target `#preview`; margins 10–15mm (or user-set); A4 portrait; scale≈2
7. [ ] Nice-to-have: sample Markdown; try/catch around Mermaid; optional localStorage

## 5) Test checklist
1. [ ] Content: headings, code (long lines), images, long table, 2+ Mermaid diagrams
2. [ ] Defaults: GitHub style applied when user doesn't change settings
3. [ ] Sidebar: controls apply styling live; controls disabled during export; re-enabled after
4. [ ] PDF: no clipping; sensible page breaks; readable margins
5. [ ] Responsive: desktop split, mobile stack, resizable input

## 6) Constraints
1. [ ] html2pdf rasterizes; keep scale reasonable
2. [ ] Mermaid is async; wait for promises
3. [ ] Wide tables: scroll on screen, scale for print

## 7) Files needed
1. [ ] `/index.html`
2. [ ] `/styles.css`
3. [ ] `/app.js`
4. [ ] `/README.md`