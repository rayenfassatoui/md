// Sample markdown content
const sample = `# Markdown to PDF Converter

## Features

- **Real-time preview** of your markdown
- **Mermaid diagram** support
- **GitHub-style** rendering
- **PDF generation** with proper formatting

## Sample Mermaid Diagram

\`\`\`mermaid
graph TD
    A[Start] --> B{Is it working?}
    B -->|Yes| C[Great!]
    B -->|No| D[Debug]
    D --> B
    C --> E[Generate PDF]
\`\`\`

## Code Example

\`\`\`javascript
function generatePDF() {
    console.log('Generating PDF...');
}
\`\`\`

## Lists

### Todo List
- [x] Implement markdown rendering
- [x] Add Mermaid support
- [ ] Add more themes
- [ ] Add export options

### Features
1. Live preview
2. PDF export
3. Diagram support
4. GitHub styling

---

**Ready to generate your PDF!**`;

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
                            // Responsive styling: let it scale to container width, preserve aspect ratio
                            svgEl.removeAttribute('width');
                            svgEl.removeAttribute('height');
                            svgEl.style.maxWidth = '30%';
                            svgEl.style.height = 'auto';
                            svgEl.style.display = 'block';
                            svgEl.style.margin = '16px auto';
                            // Optional neutral background for better contrast in some viewers
                            svgEl.style.backgroundColor = 'transparent';
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
    
    async generatePDF() {
        const generateBtn = document.getElementById('generate-btn');
        const btnText = generateBtn.querySelector('.btn-text');
        const btnLoading = generateBtn.querySelector('.btn-loading');
        const preview = document.getElementById('preview');

        // Show loading state
        btnText.style.display = 'none';
        btnLoading.style.display = 'inline';
        generateBtn.disabled = true;

        const resetBtn = () => {
            setTimeout(() => {
                btnText.style.display = 'inline';
                btnLoading.style.display = 'none';
                generateBtn.disabled = false;
            }, 600);
        };

        try {
            // Wait for markdown + mermaid to finish
            await this.wait(400);

            // Validate content
            if (!preview.innerHTML.trim() || preview.innerHTML.includes('Preview will appear here')) {
                alert('Please add some markdown content before generating PDF.');
                return;
            }

            // Clone the preview so we can tweak for print without touching UI
            const clone = preview.cloneNode(true);
            // Ensure GitHub markdown class is present
            clone.className = 'markdown-body';
            // Compute content width in px based on A4 and chosen margins
            const pxPerMm = 96 / 25.4;
            const pageWidthMm = 210;
            const pageHeightMm = 297;
            const marginMm = 12; // friendlier white space
            const contentWidthPx = Math.floor((pageWidthMm - 2 * marginMm) * pxPerMm);
            const contentHeightPx = Math.floor((pageHeightMm - 2 * marginMm) * pxPerMm);

            // Constrain width to fit page content area
            clone.style.maxWidth = contentWidthPx + 'px';
            clone.style.margin = '0 auto';

            // Do NOT allow diagrams to split across pages; add a subtle frame
            clone.querySelectorAll('.diagram').forEach(d => {
                d.style.pageBreakInside = 'avoid';
                d.style.breakInside = 'avoid';
                d.style.border = '1px solid #eaeef2';
                d.style.borderRadius = '8px';
                d.style.padding = '12px';
                d.style.background = '#ffffff';
                d.style.margin = '16px auto';
            });

            // Important: convert inline SVGs to raster images to avoid html2canvas SVG issues
            await this.convertMermaidSvgsToImages(clone);

            // Wrap in a container to be passed to html2pdf (no padding; margins handled by html2pdf)
            const wrapper = document.createElement('div');
            wrapper.style.padding = '0';
            wrapper.style.background = '#ffffff';
            wrapper.appendChild(clone);

            // Use html2pdf to preserve full HTML/CSS formatting
            // Fallback to old jsPDF flow if html2pdf is missing
            if (window.html2pdf) {
                const opt = {
                    margin:       marginMm, // mm
                    filename:     'markdown-document.pdf',
                    image:        { type: 'jpeg', quality: 0.98 },
                    html2canvas:  {
                        scale: 2,
                        useCORS: true,
                        backgroundColor: '#ffffff',
                        logging: false,
                        // Allow large canvases for long docs
                        windowWidth: wrapper.scrollWidth
                    },
                    jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' },
                    pagebreak:    {
                        mode: ['css', 'legacy', 'avoid-all'],
                        avoid: ['.diagram']
                    }
                };

                // Create a transient container off-screen
                const tmp = document.createElement('div');
                tmp.style.position = 'fixed';
                tmp.style.left = '-10000px';
                tmp.style.top = '0';
                tmp.style.width = Math.max(contentWidthPx + 40, 800) + 'px';
                tmp.style.background = '#ffffff';
                tmp.appendChild(wrapper);
                document.body.appendChild(tmp);

                await window.html2pdf().set(opt).from(wrapper).save();

                // Cleanup
                document.body.removeChild(tmp);
            } else {
                // Fallback: text-based export (re-uses existing logic)
                const { jsPDF } = window.jspdf;
                const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
                const markdownContent = document.getElementById('md-input').value || '';
                await this.addMarkdownContentToPDF(pdf, markdownContent);
                pdf.save('markdown-document.pdf');
            }
        } catch (error) {
            console.error('PDF generation error:', error);
            alert('Error generating PDF: ' + (error && error.message ? error.message : error));
        } finally {
            resetBtn();
        }
    }

    // Small helper to pause
    wait(ms) {
        return new Promise(res => setTimeout(res, ms));
    }

    // Convert any .diagram svg elements within container to <img> with PNG data URL
    async convertMermaidSvgsToImages(container) {
        const svgs = Array.from(container.querySelectorAll('.diagram svg'));
        if (!svgs.length) return;

        // Convert sequentially to reduce memory spikes on very large docs
        for (const svg of svgs) {
            try {
                // Determine intrinsic SVG dimensions from viewBox when available
                let w = 0;
                let h = 0;
                const vb = svg.getAttribute('viewBox');
                if (vb) {
                    const parts = vb.split(/\s+/).map(Number);
                    if (parts.length === 4 && isFinite(parts[2]) && isFinite(parts[3])) {
                        w = parts[2];
                        h = parts[3];
                    }
                }
                if (!w || !h) {
                    const aw = parseFloat((svg.getAttribute('width') || '').replace('px',''));
                    const ah = parseFloat((svg.getAttribute('height') || '').replace('px',''));
                    if (isFinite(aw) && isFinite(ah) && aw > 0 && ah > 0) {
                        w = aw; h = ah;
                    } else {
                        const rect = svg.getBoundingClientRect();
                        w = rect.width || 600; h = rect.height || 400;
                    }
                }

                const dataUrl = await this.svgToImageData(svg, { width: w, height: h, scale: 2 });

                const img = document.createElement('img');
                img.src = dataUrl;
                img.alt = 'Diagram';
                img.style.display = 'block';
                img.style.margin = '16px auto';
                img.style.maxWidth = '100%';
                img.style.height = 'auto';
                // Do not force intrinsic attributes; let it resize to container

                // Replace the SVG with the raster image
                const parent = svg.parentNode;
                if (parent) parent.replaceChild(img, svg);

                // After insertion, ensure image fits within one page height to avoid cropping
                try {
                    const pxPerMm = 96 / 25.4;
                    const pageHeightMm = 297;
                    const marginMm = 12;
                    const safePx = Math.floor((pageHeightMm - 2 * marginMm) * pxPerMm * 0.9); // small cushion
                    img.style.maxHeight = safePx + 'px';
                } catch {}
            } catch (e) {
                console.warn('Failed to rasterize SVG, keeping original:', e);
            }
        }
    }

    // Render an inline SVG element to a PNG data URL with optional width/height and scale
    async svgToImageData(svgElement, opts = {}) {
        return new Promise((resolve, reject) => {
            try {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');

                // Determine target render size
                let w = opts.width || parseFloat((svgElement.getAttribute('width') || '').replace('px',''));
                let h = opts.height || parseFloat((svgElement.getAttribute('height') || '').replace('px',''));
                if (!isFinite(w) || !isFinite(h) || w <= 0 || h <= 0) {
                    const rect = svgElement.getBoundingClientRect();
                    w = rect.width || 600; h = rect.height || 400;
                }
                const scale = opts.scale && opts.scale > 0 ? opts.scale : 1;
                canvas.width = Math.max(1, Math.round(w * scale));
                canvas.height = Math.max(1, Math.round(h * scale));

                // Serialize SVG and ensure namespace
                let svgData = new XMLSerializer().serializeToString(svgElement);
                if (!svgData.includes('xmlns')) {
                    svgData = svgData.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
                }
                const svgDataUrl = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgData);

                const img = new Image();
                img.crossOrigin = 'anonymous';

                img.onload = function() {
                    try {
                        // White background for better PDF rendering
                        ctx.fillStyle = '#ffffff';
                        ctx.fillRect(0, 0, canvas.width, canvas.height);
                        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                        const imageData = canvas.toDataURL('image/png', 1.0);
                        resolve(imageData);
                    } catch (err) {
                        console.warn('Canvas toDataURL failed:', err);
                        resolve(svgDataUrl);
                    }
                };
                img.onerror = function(e) {
                    console.warn('Image load failed:', e);
                    reject(new Error('Failed to load SVG'));
                };
                img.src = svgDataUrl;
            } catch (error) {
                console.error('SVG conversion error:', error);
                reject(error);
            }
        });
    }
    
    async addMarkdownContentToPDF(pdf, markdownContent) {
        let yPos = 20; // Start position from top
        const pageHeight = 280; // A4 height minus margins
        const pageWidth = 190; // A4 width minus margins
        const lineHeight = 6;
        const marginLeft = 10;
        
        // Set default font
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(11);
        
        // Split content into lines and process each
        const lines = markdownContent.split('\n');
        
        for (const line of lines) {
            // Check if we need a new page
            if (yPos > pageHeight - 20) {
                pdf.addPage();
                yPos = 20;
            }
            
            const trimmedLine = line.trim();
            
            if (!trimmedLine) {
                // Empty line - add small space
                yPos += lineHeight / 2;
                continue;
            }
            
            // Handle different markdown elements
            if (trimmedLine.startsWith('# ')) {
                // H1 - Large title
                pdf.setFont('helvetica', 'bold');
                pdf.setFontSize(20);
                const text = trimmedLine.substring(2);
                pdf.text(text, marginLeft, yPos);
                yPos += lineHeight * 2;
                pdf.setFont('helvetica', 'normal');
                pdf.setFontSize(11);
                
            } else if (trimmedLine.startsWith('## ')) {
                // H2 - Section header
                pdf.setFont('helvetica', 'bold');
                pdf.setFontSize(16);
                const text = trimmedLine.substring(3);
                pdf.text(text, marginLeft, yPos);
                yPos += lineHeight * 1.5;
                pdf.setFont('helvetica', 'normal');
                pdf.setFontSize(11);
                
            } else if (trimmedLine.startsWith('### ')) {
                // H3 - Subsection header
                pdf.setFont('helvetica', 'bold');
                pdf.setFontSize(14);
                const text = trimmedLine.substring(4);
                pdf.text(text, marginLeft, yPos);
                yPos += lineHeight * 1.3;
                pdf.setFont('helvetica', 'normal');
                pdf.setFontSize(11);
                
            } else if (trimmedLine.startsWith('- ') || trimmedLine.startsWith('* ')) {
                // Bullet points
                const text = '• ' + trimmedLine.substring(2);
                const splitText = pdf.splitTextToSize(text, pageWidth - 20);
                pdf.text(splitText, marginLeft + 5, yPos);
                yPos += splitText.length * lineHeight;
                
            } else if (trimmedLine.match(/^\d+\. /)) {
                // Numbered lists
                const splitText = pdf.splitTextToSize(trimmedLine, pageWidth - 20);
                pdf.text(splitText, marginLeft + 5, yPos);
                yPos += splitText.length * lineHeight;
                
            } else if (trimmedLine.startsWith('```mermaid')) {
                // Mermaid diagram placeholder
                pdf.setFont('helvetica', 'italic');
                pdf.setFontSize(10);
                pdf.text('[Mermaid Diagram - see original for visual]', marginLeft, yPos);
                yPos += lineHeight * 3; // Space for diagram
                pdf.setFont('helvetica', 'normal');
                pdf.setFontSize(11);
                
                // Skip to end of mermaid block
                let mermaidContent = '';
                let i = lines.indexOf(line) + 1;
                while (i < lines.length && !lines[i].trim().startsWith('```')) {
                    mermaidContent += lines[i] + '\n';
                    i++;
                }
                
                // Add mermaid code as text
                pdf.setFont('courier', 'normal');
                pdf.setFontSize(9);
                const mermaidLines = mermaidContent.trim().split('\n');
                for (const mLine of mermaidLines) {
                    if (yPos > pageHeight - 20) {
                        pdf.addPage();
                        yPos = 20;
                    }
                    pdf.text(mLine, marginLeft + 10, yPos);
                    yPos += lineHeight * 0.8;
                }
                pdf.setFont('helvetica', 'normal');
                pdf.setFontSize(11);
                yPos += lineHeight;
                
            } else if (trimmedLine.startsWith('```')) {
                // Code blocks
                if (trimmedLine === '```') {
                    // End of code block
                    continue;
                }
                pdf.setFont('courier', 'normal');
                pdf.setFontSize(9);
                const codeText = trimmedLine.substring(3); // Remove ```
                if (codeText) {
                    pdf.text(codeText, marginLeft + 5, yPos);
                    yPos += lineHeight;
                }
                
            } else if (trimmedLine.startsWith('`') && trimmedLine.endsWith('`')) {
                // Inline code
                pdf.setFont('courier', 'normal');
                const text = trimmedLine.substring(1, trimmedLine.length - 1);
                const splitText = pdf.splitTextToSize(text, pageWidth - 10);
                pdf.text(splitText, marginLeft, yPos);
                yPos += splitText.length * lineHeight;
                pdf.setFont('helvetica', 'normal');
                
            } else if (trimmedLine.includes('**') || trimmedLine.includes('*')) {
                // Bold/italic text (simplified - just treat as normal for now)
                let text = trimmedLine.replace(/\*\*(.*?)\*\*/g, '$1'); // Remove bold markers
                text = text.replace(/\*(.*?)\*/g, '$1'); // Remove italic markers
                const splitText = pdf.splitTextToSize(text, pageWidth - 10);
                pdf.text(splitText, marginLeft, yPos);
                yPos += splitText.length * lineHeight;
                
            } else {
                // Regular paragraph text
                const splitText = pdf.splitTextToSize(trimmedLine, pageWidth - 10);
                pdf.text(splitText, marginLeft, yPos);
                yPos += splitText.length * lineHeight;
            }
            
            // Add small spacing between elements
            yPos += 2;
        }
    }
        
    loadSampleMarkdown() {

        
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