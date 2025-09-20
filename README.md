# Markdown to PDF Web App

A modern, minimalist client-side web application that converts Markdown to PDF with live preview, GitHub styling, and Mermaid diagram support.

## Features

- 🚀 **Live Preview** - Instant rendering as you type (debounced)
- 🎨 **GitHub Styling** - Clean, professional GitHub Markdown CSS
- 📊 **Mermaid Diagrams** - Full support for Mermaid flowcharts, sequences, etc.
- 📄 **Clean PDF Export** - No clipped content, proper page breaks
- ⚙️ **Customizable** - Adjust font size, line height, margins, and theme variants
- 💾 **Auto-save** - Remembers your content in localStorage
- 📱 **Responsive** - Works on desktop and mobile

## How to Use

1. **Open** `index.html` in your web browser
2. **Paste** your Markdown content into the left textarea
3. **Preview** appears instantly on the right with GitHub styling
4. **Adjust** optional styling settings in the right sidebar:
   - Font size (12-20px)
   - Line height (1.2-2.0)
   - PDF margins (10-25mm)
   - Theme variant (Default, Compact, Spacious)
5. **Generate PDF** using the bottom button - styling controls lock during export

## Tech Stack

- **Markdown-it** - Fast Markdown parser with HTML, links, and typography support
- **Mermaid** - Diagram rendering (flowcharts, sequence diagrams, etc.)
- **html2pdf.js** - Client-side PDF generation (html2canvas + jsPDF)
- **GitHub Markdown CSS** - Authentic GitHub styling

## File Structure

```
├── index.html      # Main app layout with sidebar controls
├── styles.css      # Modern CSS with GitHub styling and print rules
├── app.js          # JavaScript class handling Markdown, Mermaid, PDF export
└── README.md       # This file
```

## Usage Tips

### Mermaid Diagrams
Use fenced code blocks with `mermaid` language:

\`\`\`mermaid
graph TD
    A[Start] --> B{Decision}
    B -->|Yes| C[Action]
    B -->|No| D[End]
\`\`\`

### PDF Export
- Diagrams, code blocks, and tables won't split across pages
- Margins are configurable (10-25mm)
- Output is A4 portrait with 2x scale for sharp text

### Styling Options
- **Default**: Standard GitHub look
- **Compact**: Tighter spacing for more content per page  
- **Spacious**: More whitespace for presentations

## Browser Compatibility

Works in all modern browsers with:
- ES6 class support
- Async/await
- Fetch API
- localStorage

## Local Development

Simply open `index.html` in your browser - no build step or server required. All dependencies are loaded via CDN.

## Future Enhancements

- Multiple export themes (dark mode, presentation mode)
- File upload/download
- Advanced PDF options (watermarks, headers/footers, TOC)
- Offline mode with local library hosting

---

*Created as a minimalist, client-side solution for Markdown to PDF conversion.*