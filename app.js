// Markdown to PDF Web App
class MarkdownToPDF {
    constructor() {
        this.md = null;
        this.debounceTimer = null;
        this.mermaidCounter = 0;
        this.init();
    }
    
    init() {
        // Initialize markdown-it
        this.md = window.markdownit({ html: true, linkify: true, typographer: true, breaks: false });
        
        // Initialize Mermaid
        mermaid.initialize({ startOnLoad: false, theme: 'default' });
        
        this.bindEvents();
        this.loadSampleMarkdown();
        this.renderMarkdown();
    }
    
    bindEvents() {
        const mdInput = document.getElementById('md-input');
        const generateBtn = document.getElementById('generate-btn');
        
        mdInput.addEventListener('input', () => {
            clearTimeout(this.debounceTimer);
            this.debounceTimer = setTimeout(() => this.renderMarkdown(), 200);
            localStorage.setItem('markdown-content', mdInput.value);
        });
        
        const saved = localStorage.getItem('markdown-content');
        if (saved) mdInput.value = saved;
        
        generateBtn.addEventListener('click', () => this.generatePDF());
        
        this.bindSidebarControls();
    }
    
    bindSidebarControls() {
        const fontSize = document.getElementById('font-size');
        const lineHeight = document.getElementById('line-height');
        const pageMargins = document.getElementById('page-margins');
        const themeVariant = document.getElementById('theme-variant');
        
        const fontSizeValue = document.getElementById('font-size-value');
        const lineHeightValue = document.getElementById('line-height-value');
        const pageMarginsValue = document.getElementById('page-margins-value');
        
        // Font size
        fontSize.addEventListener('input', (e) => {
            const value = e.target.value;
            fontSizeValue.textContent = `${value}px`;
            this.applyPreviewStyles();
        });
        
        // Line height
        lineHeight.addEventListener('input', (e) => {
            const value = e.target.value;
            lineHeightValue.textContent = value;
            this.applyPreviewStyles();
        });
        
        // Page margins
        pageMargins.addEventListener('input', (e) => {
            const value = e.target.value;
            pageMarginsValue.textContent = `${value}mm`;
        });
        
        // Theme variant
        themeVariant.addEventListener('change', () => {
            this.applyPreviewStyles();
        });
    }
    
    applyPreviewStyles() {
        const preview = document.getElementById('preview');
        const fontSize = document.getElementById('font-size').value;
        const lineHeight = document.getElementById('line-height').value;
        const themeVariant = document.getElementById('theme-variant').value;
        
        // Apply font size and line height
        preview.style.fontSize = `${fontSize}px`;
        preview.style.lineHeight = lineHeight;
        
        // Apply theme variant
        preview.className = 'markdown-body';
        if (themeVariant === 'compact') {
            preview.classList.add('theme-compact');
        } else if (themeVariant === 'spacious') {
            preview.classList.add('theme-spacious');
        }
        
        // Add theme-specific styles
        const existingStyle = document.getElementById('dynamic-styles');
        if (existingStyle) {
            existingStyle.remove();
        }
        
        const style = document.createElement('style');
        style.id = 'dynamic-styles';
        
        let css = '';
        if (themeVariant === 'compact') {
            css = `
                .theme-compact {
                    padding: 16px 24px !important;
                }
                .theme-compact h1, .theme-compact h2, .theme-compact h3,
                .theme-compact h4, .theme-compact h5, .theme-compact h6 {
                    margin-top: 16px !important;
                    margin-bottom: 8px !important;
                }
                .theme-compact p, .theme-compact ul, .theme-compact ol {
                    margin-bottom: 8px !important;
                }
            `;
        } else if (themeVariant === 'spacious') {
            css = `
                .theme-spacious {
                    padding: 48px 40px !important;
                    max-width: 800px;
                    margin: 0 auto;
                }
                .theme-spacious h1, .theme-spacious h2, .theme-spacious h3,
                .theme-spacious h4, .theme-spacious h5, .theme-spacious h6 {
                    margin-top: 32px !important;
                    margin-bottom: 16px !important;
                }
                .theme-spacious p, .theme-spacious ul, .theme-spacious ol {
                    margin-bottom: 20px !important;
                }
            `;
        }
        
        style.textContent = css;
        document.head.appendChild(style);
    }
    
    async renderMarkdown() {
        const input = document.getElementById('md-input').value;
        const preview = document.getElementById('preview');
        
        if (!input.trim()) {
            preview.innerHTML = '<p style="color: #656d76; font-style: italic;">Preview will appear here...</p>';
            return;
        }
        
        try {
            // Render markdown into the DOM first
            preview.innerHTML = this.md.render(input);
            
            // Find mermaid code blocks in the DOM to avoid HTML entity issues
            const codeBlocks = preview.querySelectorAll('pre > code.language-mermaid');
            const renderTasks = [];
            
            codeBlocks.forEach((codeEl) => {
                const pre = codeEl.closest('pre');
                const container = document.createElement('div');
                const id = `mermaid-${this.mermaidCounter++}`;
                container.className = 'diagram';
                container.id = id;
                
                // Read raw text (decoded), not innerHTML, so --> stays as -->, not &gt;
                const mermaidCode = codeEl.textContent.trim();
                
                // Replace the <pre> with our diagram container
                if (pre && pre.parentNode) pre.parentNode.replaceChild(container, pre);
                
                // Queue render
                const task = mermaid
                    .render(`diagram-${id}`, mermaidCode)
                    .then(({ svg }) => {
                        container.innerHTML = svg;
                        // Ensure SVG has explicit pixel dimensions for html2canvas
                        const svgEl = container.querySelector('svg');
                        if (svgEl) {
                            // Use viewBox to determine size if width/height not set
                            const viewBox = svgEl.getAttribute('viewBox');
                            if (viewBox) {
                                const [, , w, h] = viewBox.split(' ').map(Number);
                                if (w && h) {
                                    svgEl.setAttribute('width', `${Math.round(w)}px`);
                                    svgEl.setAttribute('height', `${Math.round(h)}px`);
                                    svgEl.style.width = `${Math.round(w)}px`;
                                    svgEl.style.height = `${Math.round(h)}px`;
                                }
                            }
                        }
                    })
                    .catch((error) => {
                        console.error('Mermaid rendering error:', error);
                        container.innerHTML = `<pre style="color: #d1242f; background: #fff8f8; padding: 16px; border-radius: 6px; border-left: 4px solid #d1242f;">Mermaid Error: ${error.message}</pre>`;
                    });
                renderTasks.push(task);
            });
            
            // Wait for all diagrams to finish (don't throw on individual failures)
            if (renderTasks.length) {
                await Promise.allSettled(renderTasks);
            }
            
            // Apply current styles
            this.applyPreviewStyles();
            
        } catch (error) {
            console.error('Markdown rendering error:', error);
            preview.innerHTML = `<pre style="color: #d1242f;">Error rendering markdown: ${error.message}</pre>`;
        }
    }
    
    toggleSidebarControls(disabled) {
        const controls = document.querySelectorAll('.sidebar input, .sidebar select');
        controls.forEach(control => {
            control.disabled = disabled;
        });
    }
    
    async generatePDF() {
        const generateBtn = document.getElementById('generate-btn');
        const btnText = generateBtn.querySelector('.btn-text');
        const btnLoading = generateBtn.querySelector('.btn-loading');
        const preview = document.getElementById('preview');
        
        generateBtn.disabled = true;
        btnText.style.display = 'none';
        btnLoading.style.display = 'block';
        this.toggleSidebarControls(true);
        
        try {
            // Ensure content fully rendered
            await this.renderMarkdown();

            const marginsValue = Number(document.getElementById('page-margins').value || 15);
            const margins = [marginsValue, marginsValue, marginsValue, marginsValue];
            const options = {
                margin: margins,
                filename: 'markdown-export.pdf',
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: {
                    scale: 2,
                    useCORS: true,
                    backgroundColor: '#ffffff',
                    letterRendering: true,
                    allowTaint: false,
                    removeContainer: true,
                    windowWidth: preview.scrollWidth
                },
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait', compress: true },
                pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
            };
            await html2pdf().set(options).from(preview).save();
        } catch (error) {
            console.error('PDF generation error:', error);
            alert('Error generating PDF. Please try again.');
        } finally {
            generateBtn.disabled = false;
            btnText.style.display = 'block';
            btnLoading.style.display = 'none';
            this.toggleSidebarControls(false);
        }
    }
    
    loadSampleMarkdown() {
        const sample = `# Markdown to PDF Demo

This is a **modern**, *elegant* Markdown to PDF converter.

## Features

- ✅ Live preview with GitHub styling
- ✅ Mermaid diagram support
- ✅ Clean PDF export
- ✅ Customizable styling options

## Code Example

\`\`\`javascript
function hello() {
    console.log("Hello, World!");
    return "Ready to convert!";
}
\`\`\`

## Sample Diagram

\`\`\`mermaid
graph TD
    A[Paste Markdown] --> B[Live Preview]
    B --> C[Adjust Styling]
    C --> D[Generate PDF]
    D --> E[Download Result]
\`\`\`

## Table Example

| Feature | Status | Notes |
|---------|--------|-------|
| Markdown | ✅ | Full support |
| Mermaid | ✅ | SVG diagrams |
| PDF Export | ✅ | Clean output |

> **Tip**: Use the sidebar to adjust font size, line height, and margins for your PDF output.

---

*Ready to create your own PDF? Clear this text and paste your Markdown!*`;
        
        const mdInput = document.getElementById('md-input');
        if (!mdInput.value.trim()) {
            mdInput.value = sample;
        }
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new MarkdownToPDF();
});