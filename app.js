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
        
        // Disable sidebar controls to prevent PDF issues
        // this.bindSidebarControls();
        
        // Set default values and disable controls
        this.setDefaultStyles();
    }
    
    setDefaultStyles() {
        // Set all controls to default values and disable them
        const fontSize = document.getElementById('font-size');
        const lineHeight = document.getElementById('line-height');
        const pageMargins = document.getElementById('page-margins');
        const themeVariant = document.getElementById('theme-variant');
        
        // Set defaults
        fontSize.value = 14;
        lineHeight.value = 1.6;
        pageMargins.value = 15;
        themeVariant.value = 'default';
        
        // Update display values
        document.getElementById('font-size-value').textContent = '14px';
        document.getElementById('line-height-value').textContent = '1.6';
        document.getElementById('page-margins-value').textContent = '15mm';
        
        // Disable all controls to prevent changes
        fontSize.disabled = true;
        lineHeight.disabled = true;
        pageMargins.disabled = true;
        themeVariant.disabled = true;
        
        // Apply default preview styles
        this.applyPreviewStyles();
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
        
        // Force default GitHub styling - no custom changes
        preview.style.fontSize = '14px';
        preview.style.lineHeight = '1.6';
        preview.className = 'markdown-body';
        
        // Remove any dynamic styles that might interfere
        const existingStyle = document.getElementById('dynamic-styles');
        if (existingStyle) {
            existingStyle.remove();
        }
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
                            // Always set explicit dimensions - this is critical for PDF
                            svgEl.setAttribute('width', '600px');
                            svgEl.setAttribute('height', '400px');
                            svgEl.style.width = '600px';
                            svgEl.style.height = '400px';
                            svgEl.style.display = 'block';
                            svgEl.style.margin = '16px auto';
                            svgEl.style.backgroundColor = '#ffffff';
                            svgEl.style.border = '1px solid #e1e4e8';
                            svgEl.style.borderRadius = '6px';
                            svgEl.style.padding = '16px';
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
            
            // Wait for all content to be ready
            await new Promise(resolve => setTimeout(resolve, 1000));

            const marginsValue = Number(document.getElementById('page-margins').value || 15);
            
            // Fix SVGs for better PDF capture without security issues
            const svgs = preview.querySelectorAll('svg');
            console.log('Preparing', svgs.length, 'SVG diagrams for PDF...');
            
            svgs.forEach(svg => {
                // Make SVGs inline and properly sized
                svg.style.width = '600px';
                svg.style.height = '400px';
                svg.style.display = 'block';
                svg.style.margin = '20px auto';
                svg.style.backgroundColor = '#ffffff';
                svg.style.border = '2px solid #e1e4e8';
                svg.style.borderRadius = '8px';
                svg.style.padding = '20px';
                svg.setAttribute('width', '600');
                svg.setAttribute('height', '400');
                
                // Add xmlns for better compatibility
                svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
                
                // Force all text to be black and visible
                const texts = svg.querySelectorAll('text, tspan');
                texts.forEach(text => {
                    text.style.fill = '#000000';
                    text.style.fontSize = '14px';
                    text.style.fontFamily = 'Arial, sans-serif';
                });
                
                // Force all paths to be visible
                const paths = svg.querySelectorAll('path, rect, circle, line');
                paths.forEach(path => {
                    if (!path.getAttribute('fill') || path.getAttribute('fill') === 'none') {
                        path.setAttribute('stroke', '#333333');
                        path.setAttribute('stroke-width', '2');
                    }
                });
            });
            
            // Wait a bit more for styling to apply
            await new Promise(resolve => setTimeout(resolve, 800));
            
            // Enhanced PDF options for better SVG support
            const options = {
                margin: marginsValue,
                filename: 'markdown-export.pdf',
                image: { type: 'png', quality: 1.0 },
                html2canvas: {
                    scale: 1.5,
                    useCORS: false,
                    allowTaint: true,
                    backgroundColor: '#ffffff',
                    logging: true,
                    foreignObjectRendering: true,
                    removeContainer: false
                },
                jsPDF: { 
                    unit: 'mm', 
                    format: 'a4', 
                    orientation: 'portrait'
                }
            };
            
            console.log('Generating PDF...');
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