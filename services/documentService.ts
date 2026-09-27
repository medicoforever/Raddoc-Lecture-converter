
import { 
    Packer, 
    Document, 
    Paragraph, 
    TextRun, 
    HeadingLevel, 
    ExternalHyperlink, 
    Table, 
    TableCell, 
    TableRow, 
    WidthType, 
    BorderStyle, 
    ShadingType 
} from 'docx';
import saveAs from 'file-saver';

// Comprehensive sanitizer to convert LaTeX expressions, math symbols, and raw markup into clean Unicode
export const cleanLatexAndFormatting = (text: string): string => {
    if (!text) return '';

    let cleaned = text;

    // Normalize escaped backslashes (\\approx -> \approx)
    cleaned = cleaned.replace(/\\\\([a-zA-Z]+)/g, '\\$1');

    // LaTeX degrees and angles:
    // e.g. ^\circ, ^{\circ}, ^\circ{}, \circ, \degree, \angle
    cleaned = cleaned.replace(/\^\{\\circ\}/gi, '°');
    cleaned = cleaned.replace(/\^\\circ\{\}/gi, '°');
    cleaned = cleaned.replace(/\^\\circ\b/gi, '°');
    cleaned = cleaned.replace(/\\degree\b/gi, '°');
    cleaned = cleaned.replace(/\\circ\b/gi, '°');
    cleaned = cleaned.replace(/\\angle\b/gi, '∠');

    // Mathematical operators & comparisons
    cleaned = cleaned.replace(/\\approx\b/gi, '≈');
    cleaned = cleaned.replace(/\\pm\b|\\plusminus\b/gi, '±');
    cleaned = cleaned.replace(/\\mp\b/gi, '∓');
    cleaned = cleaned.replace(/\\leq\b|\\le\b/gi, '≤');
    cleaned = cleaned.replace(/\\geq\b|\\ge\b/gi, '≥');
    cleaned = cleaned.replace(/\\times\b/gi, '×');
    cleaned = cleaned.replace(/\\div\b/gi, '÷');
    cleaned = cleaned.replace(/\\cdot\b/gi, '·');
    cleaned = cleaned.replace(/\\neq\b|\\ne\b/gi, '≠');
    cleaned = cleaned.replace(/\\equiv\b/gi, '≡');
    cleaned = cleaned.replace(/\\sim\b/gi, '~');
    cleaned = cleaned.replace(/\\propto\b/gi, '∝');
    cleaned = cleaned.replace(/\\infty\b/gi, '∞');

    // Arrows
    cleaned = cleaned.replace(/\\rightarrow\b|\\to\b/gi, '→');
    cleaned = cleaned.replace(/\\leftarrow\b/gi, '←');
    cleaned = cleaned.replace(/\\leftrightarrow\b/gi, '↔');
    cleaned = cleaned.replace(/\\Rightarrow\b|\\implies\b/gi, '⇒');
    cleaned = cleaned.replace(/\\Leftarrow\b/gi, '⇐');
    cleaned = cleaned.replace(/\\Leftrightarrow\b|\\iff\b/gi, '⇔');
    cleaned = cleaned.replace(/\\uparrow\b/gi, '↑');
    cleaned = cleaned.replace(/\\downarrow\b/gi, '↓');

    // Greek letters
    cleaned = cleaned.replace(/\\alpha\b/gi, 'α');
    cleaned = cleaned.replace(/\\beta\b/gi, 'β');
    cleaned = cleaned.replace(/\\gamma\b/g, 'γ');
    cleaned = cleaned.replace(/\\Gamma\b/g, 'Γ');
    cleaned = cleaned.replace(/\\delta\b/g, 'δ');
    cleaned = cleaned.replace(/\\Delta\b/g, 'Δ');
    cleaned = cleaned.replace(/\\epsilon\b|\\varepsilon\b/gi, 'ε');
    cleaned = cleaned.replace(/\\theta\b/gi, 'θ');
    cleaned = cleaned.replace(/\\lambda\b/g, 'λ');
    cleaned = cleaned.replace(/\\Lambda\b/g, 'Λ');
    cleaned = cleaned.replace(/\\mu\s*m\b|\\mum\b|\\mu\\text\{m\}/gi, 'µm');
    cleaned = cleaned.replace(/\\mu\b/gi, 'µ');
    cleaned = cleaned.replace(/\\pi\b/gi, 'π');
    cleaned = cleaned.replace(/\\sigma\b/g, 'σ');
    cleaned = cleaned.replace(/\\Sigma\b/g, 'Σ');
    cleaned = cleaned.replace(/\\tau\b/gi, 'τ');
    cleaned = cleaned.replace(/\\phi\b|\\varphi\b/gi, 'φ');
    cleaned = cleaned.replace(/\\chi\b/gi, 'χ');
    cleaned = cleaned.replace(/\\omega\b/g, 'ω');
    cleaned = cleaned.replace(/\\Omega\b/g, 'Ω');

    // Common LaTeX text wrappers
    cleaned = cleaned.replace(/\\textbf\{([^}]+)\}/g, '**$1**');
    cleaned = cleaned.replace(/\\textit\{([^}]+)\}/g, '*$1*');
    cleaned = cleaned.replace(/\\text\{([^}]+)\}/g, '$1');
    cleaned = cleaned.replace(/\\mathrm\{([^}]+)\}/g, '$1');
    cleaned = cleaned.replace(/\\mathbf\{([^}]+)\}/g, '$1');
    cleaned = cleaned.replace(/\\mathit\{([^}]+)\}/g, '$1');
    cleaned = cleaned.replace(/\\mathcal\{([^}]+)\}/g, '$1');

    // Fractions: \frac{a}{b} -> a/b
    cleaned = cleaned.replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '$1/$2');

    // Subscripts and superscripts
    cleaned = cleaned.replace(/\^2\b|\^\{2\}/g, '²');
    cleaned = cleaned.replace(/\^3\b|\^\{3\}/g, '³');
    cleaned = cleaned.replace(/\^0\b|\^\{0\}/g, '⁰');
    cleaned = cleaned.replace(/\^1\b|\^\{1\}/g, '¹');
    cleaned = cleaned.replace(/\^\{-1\}/g, '⁻¹');
    cleaned = cleaned.replace(/\^\{-2\}/g, '⁻²');
    cleaned = cleaned.replace(/_2\b|_\{2\}/g, '₂');
    cleaned = cleaned.replace(/_3\b|_\{3\}/g, '₃');
    cleaned = cleaned.replace(/_0\b|_\{0\}/g, '₀');
    cleaned = cleaned.replace(/_1\b|_\{1\}/g, '₁');

    // Remove block and inline LaTeX dollar delimiters $$...$$ and $...$
    cleaned = cleaned.replace(/\$\$([\s\S]*?)\$\$/g, '$1');
    cleaned = cleaned.replace(/\$([^$\n]+)\$/g, '$1');

    // Clean up residual LaTeX formatting artifacts
    cleaned = cleaned.replace(/\\qquad\b/g, '    ');
    cleaned = cleaned.replace(/\\quad\b/g, '  ');
    cleaned = cleaned.replace(/\\left\s*([(\[{|])/g, '$1');
    cleaned = cleaned.replace(/\\right\s*([)\]}|])/g, '$1');
    cleaned = cleaned.replace(/\\,/g, ' ');
    cleaned = cleaned.replace(/\\!/g, '');

    // Post-process lines to convert or remove any stray ASCII art wireframe diagrams / mindmap junk
    const processedLines = cleaned.split('\n').map((line, idx, allLines) => {
        const trimmed = line.trim();
        if (!trimmed) return line;

        // Check if line is a valid Markdown table row (e.g. | col1 | col2 |)
        const isMarkdownTableRow = trimmed.startsWith('|') && trimmed.endsWith('|') && trimmed.split('|').length >= 3;
        if (isMarkdownTableRow) {
            return line;
        }

        // Detect pure ASCII connector/tree lines (e.g. "  |   |   |", "  +-----+-----+", "  |---------|", " \ / ", " | ", "---|---")
        if (/^[\|\+\-\s\\\/_~`=\^▼▲►◄→←]+$/.test(trimmed) && !trimmed.startsWith('#')) {
            // Check if this might be a markdown table header separator (like |---|---|)
            const prevLine = idx > 0 ? allLines[idx - 1].trim() : '';
            if (prevLine.startsWith('|') && prevLine.endsWith('|') && trimmed.includes('-')) {
                return line;
            }
            // Otherwise it's a wireframe / ASCII line: strip it out
            return '';
        }

        // Convert ASCII tree branch prefixes (e.g. "|- Aneuploidy", "+-- Diagnosis", " \-- Finding") into clean bullet points
        if (/^\s*(\|[\-\+]|\+[\-]+|\\|\/)\s*(.+)$/.test(line)) {
            return line.replace(/^\s*(\|[\-\+]|\+[\-]+|\\|\/)\s*/, '* ');
        }

        return line;
    });

    return processedLines.filter((l, i, arr) => {
        // Prevent excess consecutive blank lines
        if (l === '' && i > 0 && arr[i - 1] === '') return false;
        return true;
    }).join('\n');
};

// Helper to parse markdown formatted text (bold, italic, bold-italic, links, inline code) into TextRun & ExternalHyperlink objects
const parseMarkdownLineToDocx = (rawLine: string): (TextRun | ExternalHyperlink)[] => {
    const line = cleanLatexAndFormatting(rawLine);
    const children: (TextRun | ExternalHyperlink)[] = [];
    
    // Regex matching bold-italic, bold, italic, inline code, and hyperlinks
    const parts = line.split(/(\[.*?\]\(.*?\))|(\*\*\*.*?\*\*\*)|(\*\*.*?\*\*)|(`.*?`)|(_.*?_|\*.*?\*)/g).filter(Boolean);

    parts.forEach(part => {
        if (part.startsWith('***') && part.endsWith('***') && part.length >= 6) {
            children.push(new TextRun({ text: part.slice(3, -3), bold: true, italics: true, font: "Calibri" }));
        } else if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
            children.push(new TextRun({ text: part.slice(2, -2), bold: true, font: "Calibri" }));
        } else if ((part.startsWith('*') && part.endsWith('*') && part.length >= 2) || 
                   (part.startsWith('_') && part.endsWith('_') && part.length >= 2)) {
            children.push(new TextRun({ text: part.slice(1, -1), italics: true, font: "Calibri" }));
        } else if (part.startsWith('`') && part.endsWith('`') && part.length >= 2) {
            children.push(new TextRun({ text: part.slice(1, -1), font: "Consolas", color: "1E293B" }));
        } else if (part.startsWith('[') && part.includes('](') && part.endsWith(')')) {
            const match = part.match(/\[(.*?)\]\((.*?)\)/);
            if (match) {
                const [, text, link] = match;
                children.push(new ExternalHyperlink({
                    children: [new TextRun({ text, style: "Hyperlink", font: "Calibri", color: "2563EB" })],
                    link,
                }));
            } else {
                children.push(new TextRun({ text: part, font: "Calibri" }));
            }
        } else {
            children.push(new TextRun({ text: part, font: "Calibri" }));
        }
    });

    if (children.length === 0) {
        children.push(new TextRun({ text: "", font: "Calibri" }));
    }

    return children;
};

// --- DOCX Generation ---
const generateDocx = async (markdownContent: string, fileName: string): Promise<void> => {
    const cleanedContent = cleanLatexAndFormatting(markdownContent);
    const docChildren: (Paragraph | Table)[] = [];
    const lines = cleanedContent.split('\n');

    let i = 0;
    while (i < lines.length) {
        const line = lines[i];
        const trimmedLine = line.trim();

        if (trimmedLine.startsWith('# ')) {
            docChildren.push(new Paragraph({ 
                children: parseMarkdownLineToDocx(trimmedLine.substring(2)), 
                heading: HeadingLevel.HEADING_1,
                spacing: { before: 300, after: 120 }
            }));
            i++;
        } else if (trimmedLine.startsWith('## ')) {
            docChildren.push(new Paragraph({ 
                children: parseMarkdownLineToDocx(trimmedLine.substring(3)), 
                heading: HeadingLevel.HEADING_2,
                spacing: { before: 240, after: 100 }
            }));
            i++;
        } else if (trimmedLine.startsWith('### ')) {
            docChildren.push(new Paragraph({ 
                children: parseMarkdownLineToDocx(trimmedLine.substring(4)), 
                heading: HeadingLevel.HEADING_3,
                spacing: { before: 180, after: 80 }
            }));
            i++;
        } else if (trimmedLine.startsWith('#### ')) {
            docChildren.push(new Paragraph({ 
                children: parseMarkdownLineToDocx(trimmedLine.substring(5)), 
                heading: HeadingLevel.HEADING_4,
                spacing: { before: 140, after: 60 }
            }));
            i++;
        } else if (line.match(/^(\s*)([\*\-\+]|\d+\.)\s+/)) {
            // Check for list items (including nested levels for mindmaps / outlines)
            const listMatch = line.match(/^(\s*)([\*\-\+]|\d+\.)\s+(.*)$/);
            if (listMatch) {
                const indentSpaces = listMatch[1].replace(/\t/g, '    ').length;
                const marker = listMatch[2];
                const contentText = listMatch[3];
                // Calculate nested level (0, 1, 2, 3, etc.)
                const level = Math.min(4, Math.floor(indentSpaces / 2));

                if (marker.endsWith('.')) {
                    docChildren.push(new Paragraph({ 
                        children: parseMarkdownLineToDocx(contentText), 
                        numbering: { reference: "default-numbering", level },
                        spacing: { before: 40, after: 40 }
                    }));
                } else {
                    docChildren.push(new Paragraph({ 
                        children: parseMarkdownLineToDocx(contentText), 
                        bullet: { level },
                        spacing: { before: 40, after: 40 }
                    }));
                }
            }
            i++;
        } else if (trimmedLine.startsWith('|') && trimmedLine.includes('|')) {
            const separatorLine = i + 1 < lines.length ? lines[i + 1]?.trim() : '';
            if (separatorLine.startsWith('|') && separatorLine.includes('-')) {
                const headerCells = trimmedLine.split('|').slice(1, -1).map(cell => cell.trim());
                const numColumns = headerCells.length;
                
                // Calculate column width percentage in 50ths of a percent (5000 = 100%)
                const columnWidth = Math.floor(5000 / Math.max(1, numColumns));

                const tableBorder = {
                    style: BorderStyle.SINGLE,
                    size: 4,
                    color: "CBD5E1",
                };

                const cellBorders = {
                    top: tableBorder,
                    bottom: tableBorder,
                    left: tableBorder,
                    right: tableBorder,
                };

                const tableRows: TableRow[] = [
                    new TableRow({
                        children: headerCells.map(cell => new TableCell({
                            children: [new Paragraph({ children: parseMarkdownLineToDocx(`**${cell}**`), spacing: { before: 60, after: 60 } })],
                            width: { size: columnWidth, type: WidthType.PERCENTAGE },
                            shading: { fill: "F1F5F9", type: ShadingType.CLEAR },
                            borders: cellBorders,
                            margins: { top: 120, bottom: 120, left: 160, right: 160 },
                        })),
                        tableHeader: true,
                    }),
                ];
                i += 2; // Move past header and separator
                
                let rowCount = 0;
                while (i < lines.length && lines[i].trim().startsWith('|')) {
                    const rowLine = lines[i].trim();
                    const rowCells = rowLine.split('|').slice(1, -1).map(cell => cell.trim());
                    const isEven = rowCount % 2 === 1;
                    
                    tableRows.push(new TableRow({
                        children: rowCells.slice(0, numColumns).map(cell => new TableCell({
                            children: [new Paragraph({ children: parseMarkdownLineToDocx(cell), spacing: { before: 40, after: 40 } })],
                            width: { size: columnWidth, type: WidthType.PERCENTAGE },
                            shading: isEven ? { fill: "F8FAFC", type: ShadingType.CLEAR } : undefined,
                            borders: cellBorders,
                            margins: { top: 100, bottom: 100, left: 160, right: 160 },
                        })),
                    }));
                    rowCount++;
                    i++;
                }
                const table = new Table({
                    rows: tableRows,
                    width: { size: 5000, type: WidthType.PERCENTAGE },
                });
                docChildren.push(table);
            } else {
                if (trimmedLine) {
                    docChildren.push(new Paragraph({ 
                        children: parseMarkdownLineToDocx(line),
                        spacing: { before: 60, after: 60, line: 276 }
                    }));
                }
                i++;
            }
        } else if (trimmedLine.startsWith('---') || trimmedLine.startsWith('***') || trimmedLine.startsWith('___')) {
            // Horizontal rule divider
            docChildren.push(new Paragraph({
                border: {
                    bottom: { color: "CBD5E1", size: 6, style: BorderStyle.SINGLE, space: 1 }
                },
                spacing: { before: 180, after: 180 }
            }));
            i++;
        } else if (trimmedLine) {
            docChildren.push(new Paragraph({ 
                children: parseMarkdownLineToDocx(line),
                spacing: { before: 60, after: 60, line: 276 }
            }));
            i++;
        } else {
            docChildren.push(new Paragraph({ spacing: { before: 40, after: 40 } }));
            i++;
        }
    }

    const doc = new Document({
        styles: {
            default: {
                document: {
                    run: {
                        font: "Calibri",
                        size: 22, // 11pt
                        color: "1F2937",
                    },
                    paragraph: {
                        spacing: { line: 276, before: 60, after: 60 },
                    },
                },
            },
            paragraphStyles: [
                {
                    id: "Heading1",
                    name: "Heading 1",
                    basedOn: "Normal",
                    next: "Normal",
                    quickFormat: true,
                    run: { size: 36, bold: true, color: "1E3A8A", font: "Calibri" }, // 18pt
                    paragraph: { spacing: { before: 300, after: 120 } },
                },
                {
                    id: "Heading2",
                    name: "Heading 2",
                    basedOn: "Normal",
                    next: "Normal",
                    quickFormat: true,
                    run: { size: 28, bold: true, color: "1D4ED8", font: "Calibri" }, // 14pt
                    paragraph: { spacing: { before: 240, after: 100 } },
                },
                {
                    id: "Heading3",
                    name: "Heading 3",
                    basedOn: "Normal",
                    next: "Normal",
                    quickFormat: true,
                    run: { size: 24, bold: true, color: "0F172A", font: "Calibri" }, // 12pt
                    paragraph: { spacing: { before: 180, after: 80 } },
                },
                {
                    id: "strong",
                    name: "Strong",
                    basedOn: "Normal",
                    next: "Normal",
                    run: { bold: true, font: "Calibri" },
                },
            ],
        },
        numbering: {
            config: [
                {
                    reference: "default-numbering",
                    levels: [
                        { level: 0, format: "decimal", text: "%1.", start: 1 },
                        { level: 1, format: "lowerLetter", text: "%2)", start: 1 },
                        { level: 2, format: "lowerRoman", text: "%3.", start: 1 },
                        { level: 3, format: "decimal", text: "%4.", start: 1 },
                    ],
                },
            ],
        },
        sections: [{ properties: {}, children: docChildren }],
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, `${fileName}.docx`);
};

export const downloadDocuments = async (markdownContent: string, baseFileName: string) => {
    if (!markdownContent) return;
    await generateDocx(markdownContent, baseFileName);
};


// --- Google Docs Integration ---

const markdownToHtml = (markdownContent: string): string => {
    const cleaned = cleanLatexAndFormatting(markdownContent);
    const escapeHtml = (unsafe: string) => unsafe.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");

    const parseLineToHtml = (line: string): string => {
        let htmlContent = '';
        const parts = line.split(/(\[.*?\]\(.*?\))|(\*\*\*.*?\*\*\*)|(\*\*.*?\*\*)|(`.*?`)|(_.*?_|\*.*?\*)/g).filter(Boolean);
        parts.forEach(part => {
            if (part.startsWith('***') && part.endsWith('***') && part.length >= 6) {
                htmlContent += `<strong><em>${escapeHtml(part.slice(3, -3))}</em></strong>`;
            } else if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
                htmlContent += `<strong>${escapeHtml(part.slice(2, -2))}</strong>`;
            } else if ((part.startsWith('*') && part.endsWith('*') && part.length >= 2) || 
                       (part.startsWith('_') && part.endsWith('_') && part.length >= 2)) {
                htmlContent += `<em>${escapeHtml(part.slice(1, -1))}</em>`;
            } else if (part.startsWith('`') && part.endsWith('`') && part.length >= 2) {
                htmlContent += `<code>${escapeHtml(part.slice(1, -1))}</code>`;
            } else if (part.startsWith('[') && part.includes('](') && part.endsWith(')')) {
                const match = part.match(/\[(.*?)\]\((.*?)\)/);
                if (match) {
                    htmlContent += `<a href="${escapeHtml(match[2])}" target="_blank" rel="noopener noreferrer">${escapeHtml(match[1])}</a>`;
                } else {
                    htmlContent += escapeHtml(part);
                }
            } else {
                htmlContent += escapeHtml(part);
            }
        });
        return htmlContent;
    };

    const lines = cleaned.split('\n');
    let htmlOutput = '<div style="font-family: Arial, sans-serif; font-size: 11pt; color: #1f2937; line-height: 1.6;">';
    let inList: 'ul' | 'ol' | null = null;
    let listLevel = 0;
    let inTable = false;
    let i = 0;

    const closeList = () => {
        while (listLevel > 0) {
            if (inList === 'ul') htmlOutput += '</ul>';
            if (inList === 'ol') htmlOutput += '</ol>';
            listLevel--;
        }
        inList = null;
    };

    while (i < lines.length) {
        const line = lines[i];
        const trimmedLine = line.trim();
        
        const listMatch = line.match(/^(\s*)([\*\-\+]|\d+\.)\s+(.*)$/);
        if (listMatch) {
            if (inTable) {
                htmlOutput += '</tbody></table>';
                inTable = false;
            }
            const indentSpaces = listMatch[1].replace(/\t/g, '    ').length;
            const targetLevel = Math.min(4, Math.floor(indentSpaces / 2)) + 1;
            const marker = listMatch[2];
            const content = listMatch[3];
            const isOl = marker.endsWith('.');
            const currentListType = isOl ? 'ol' : 'ul';

            if (inList !== currentListType || listLevel === 0) {
                closeList();
                inList = currentListType;
                htmlOutput += `<${currentListType} style="margin-top: 4px; margin-bottom: 4px; padding-left: 24px;">`;
                listLevel = 1;
            }

            while (listLevel < targetLevel) {
                htmlOutput += `<${currentListType} style="margin-top: 2px; margin-bottom: 2px; padding-left: 20px;">`;
                listLevel++;
            }
            while (listLevel > targetLevel) {
                htmlOutput += `</${currentListType}>`;
                listLevel--;
            }

            htmlOutput += `<li style="margin-bottom: 4px;">${parseLineToHtml(content)}</li>`;
            i++;
            continue;
        } else if (inList) {
            closeList();
        }

        if (trimmedLine.startsWith('|') && trimmedLine.includes('|')) {
            const separatorLine = i + 1 < lines.length ? lines[i + 1]?.trim() : '';
            if (separatorLine.startsWith('|') && separatorLine.includes('-')) {
                if (inTable) {
                    htmlOutput += '</tbody></table>';
                }
                htmlOutput += '<table style="border-collapse: collapse; width: 100%; margin: 12px 0; border: 1px solid #cbd5e1;">';
                inTable = true;
                const headerCells = trimmedLine.split('|').slice(1, -1);
                htmlOutput += '<thead><tr style="background-color: #f1f5f9;">';
                headerCells.forEach(cell => { 
                    htmlOutput += `<th style="border: 1px solid #cbd5e1; padding: 8px 12px; text-align: left; font-weight: bold;">${parseLineToHtml(cell.trim())}</th>`; 
                });
                htmlOutput += '</tr></thead><tbody>';
                i += 2;
                continue;
            } else if (inTable) {
                const rowCells = trimmedLine.split('|').slice(1, -1);
                htmlOutput += '<tr>';
                rowCells.forEach(cell => { 
                    htmlOutput += `<td style="border: 1px solid #cbd5e1; padding: 6px 12px;">${parseLineToHtml(cell.trim())}</td>`; 
                });
                htmlOutput += '</tr>';
                i++;
                continue;
            }
        }

        if (inTable) {
            htmlOutput += '</tbody></table>';
            inTable = false;
        }

        if (trimmedLine.startsWith('# ')) {
            htmlOutput += `<h1 style="color: #1e3a8a; font-size: 18pt; margin-top: 20px; margin-bottom: 8px;">${parseLineToHtml(trimmedLine.substring(2))}</h1>`;
        } else if (trimmedLine.startsWith('## ')) {
            htmlOutput += `<h2 style="color: #1d4ed8; font-size: 14pt; margin-top: 16px; margin-bottom: 6px;">${parseLineToHtml(trimmedLine.substring(3))}</h2>`;
        } else if (trimmedLine.startsWith('### ')) {
            htmlOutput += `<h3 style="color: #0f172a; font-size: 12pt; margin-top: 12px; margin-bottom: 4px;">${parseLineToHtml(trimmedLine.substring(4))}</h3>`;
        } else if (trimmedLine.startsWith('---') || trimmedLine.startsWith('***')) {
            htmlOutput += '<hr style="border: none; border-top: 1px solid #cbd5e1; margin: 16px 0;" />';
        } else if (trimmedLine) {
            htmlOutput += `<p style="margin-top: 4px; margin-bottom: 4px;">${parseLineToHtml(line)}</p>`;
        } else {
            htmlOutput += '<p style="margin: 4px 0;"><br></p>';
        }
        i++;
    }

    closeList();
    if (inTable) htmlOutput += '</tbody></table>';
    htmlOutput += '</div>';

    return htmlOutput;
};

export const openInGoogleDocs = async (markdownContent: string) => {
    if (!markdownContent) return;
    const html = markdownToHtml(markdownContent);
    try {
        const blob = new Blob([html], { type: 'text/html' });
        // @ts-expect-error: ClipboardItem is available in secure contexts
        const data = [new ClipboardItem({ [blob.type]: blob })];
        await navigator.clipboard.write(data);
        window.open('https://docs.google.com/document/create', '_blank');
    } catch (err) {
        console.error('Failed to copy content for Google Docs:', err);
        alert('Could not copy content to clipboard. Please copy content manually.');
    }
};

