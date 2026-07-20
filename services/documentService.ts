
import { Packer, Document, Paragraph, TextRun, HeadingLevel, ExternalHyperlink, Table, TableCell, TableRow, WidthType } from 'docx';
import saveAs from 'file-saver';

// Helper to parse a line of markdown text into an array of TextRun and ExternalHyperlink objects for DOCX
const parseMarkdownLineToDocx = (line: string): (TextRun | ExternalHyperlink)[] => {
    const children: (TextRun | ExternalHyperlink)[] = [];
    // Regex to find bold, italics, and links
    const parts = line.split(/(\[.*?\]\(.*?\))|(\*\*.*?\*\*)|(_.*?_|\*.*?\*)/g).filter(Boolean);

    parts.forEach(part => {
        if (part.startsWith('**') && part.endsWith('**')) {
            children.push(new TextRun({ text: part.slice(2, -2), bold: true }));
        } else if ((part.startsWith('*') && part.endsWith('*')) || (part.startsWith('_') && part.endsWith('_'))) {
            children.push(new TextRun({ text: part.slice(1, -1), italics: true }));
        } else if (part.startsWith('[') && part.includes('](') && part.endsWith(')')) {
            const match = part.match(/\[(.*?)\]\((.*?)\)/);
            if (match) {
                const [, text, link] = match;
                children.push(new ExternalHyperlink({
                    children: [new TextRun({ text, style: "Hyperlink" })],
                    link,
                }));
            } else {
                children.push(new TextRun(part));
            }
        } else {
            children.push(new TextRun(part));
        }
    });
    return children;
};

// --- DOCX Generation ---
const generateDocx = async (markdownContent: string, fileName: string): Promise<void> => {
    const docChildren: (Paragraph | Table)[] = [];
    const lines = markdownContent.split('\n');

    let i = 0;
    while (i < lines.length) {
        const line = lines[i];
        const trimmedLine = line.trim();

        if (trimmedLine.startsWith('# ')) {
            docChildren.push(new Paragraph({ children: parseMarkdownLineToDocx(trimmedLine.substring(2)), heading: HeadingLevel.HEADING_1 }));
            i++;
        } else if (trimmedLine.startsWith('## ')) {
            docChildren.push(new Paragraph({ children: parseMarkdownLineToDocx(trimmedLine.substring(3)), heading: HeadingLevel.HEADING_2 }));
            i++;
        } else if (trimmedLine.startsWith('### ')) {
            docChildren.push(new Paragraph({ children: parseMarkdownLineToDocx(trimmedLine.substring(4)), heading: HeadingLevel.HEADING_3 }));
            i++;
        } else if (trimmedLine.startsWith('* ')) {
            docChildren.push(new Paragraph({ children: parseMarkdownLineToDocx(trimmedLine.substring(2)), bullet: { level: 0 } }));
            i++;
        } else if (trimmedLine.match(/^\d+\. /)) {
            docChildren.push(new Paragraph({ children: parseMarkdownLineToDocx(trimmedLine.replace(/^\d+\. /, '')), numbering: { reference: "default-numbering", level: 0 } }));
            i++;
        } else if (trimmedLine.startsWith('|') && trimmedLine.includes('|')) {
            const separatorLine = i + 1 < lines.length ? lines[i + 1]?.trim() : '';
            if (separatorLine.startsWith('|') && separatorLine.includes('-')) {
                const headerCells = trimmedLine.split('|').slice(1, -1).map(cell => cell.trim());
                const numColumns = headerCells.length;
                
                // Calculate column width percentage. WidthType.PERCENTAGE is in 50ths of a percent (5000 = 100%)
                const columnWidth = Math.floor(5000 / Math.max(1, numColumns));

                const tableRows: TableRow[] = [
                    new TableRow({
                        children: headerCells.map(cell => new TableCell({
                            children: [new Paragraph({ children: parseMarkdownLineToDocx(cell), style: "strong" })],
                            width: { size: columnWidth, type: WidthType.PERCENTAGE }
                        })),
                        tableHeader: true,
                    }),
                ];
                i += 2; // Move past header and separator
                
                while (i < lines.length && lines[i].trim().startsWith('|')) {
                    const rowLine = lines[i].trim();
                    const rowCells = rowLine.split('|').slice(1, -1).map(cell => cell.trim());
                    
                    tableRows.push(new TableRow({
                        children: rowCells.slice(0, numColumns).map(cell => new TableCell({
                            children: [new Paragraph({ children: parseMarkdownLineToDocx(cell) })],
                            width: { size: columnWidth, type: WidthType.PERCENTAGE }
                        })),
                    }));
                    i++;
                }
                const table = new Table({
                    rows: tableRows,
                    width: { size: 5000, type: WidthType.PERCENTAGE },
                });
                docChildren.push(table);
            } else {
                if (trimmedLine) docChildren.push(new Paragraph({ children: parseMarkdownLineToDocx(line) }));
                i++;
            }
        } else if (trimmedLine) {
            docChildren.push(new Paragraph({ children: parseMarkdownLineToDocx(line) }));
            i++;
        } else {
            docChildren.push(new Paragraph(""));
            i++;
        }
    }

    const doc = new Document({
        styles: {
            paragraphStyles: [{
                id: "strong",
                name: "Strong",
                basedOn: "Normal",
                next: "Normal",
                run: { bold: true },
            }],
        },
        numbering: {
            config: [
                {
                    reference: "default-numbering",
                    levels: [
                        { level: 0, format: "decimal", text: "%1.", start: 1 },
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
    const escapeHtml = (unsafe: string) => unsafe.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");

    const parseLineToHtml = (line: string): string => {
        let htmlContent = '';
        const parts = line.split(/(\[.*?\]\(.*?\))|(\*\*.*?\*\*)|(_.*?_|\*.*?\*)/g).filter(Boolean);
        parts.forEach(part => {
            if (part.startsWith('**') && part.endsWith('**')) {
                htmlContent += `<strong>${escapeHtml(part.slice(2, -2))}</strong>`;
            } else if ((part.startsWith('*') && part.endsWith('*')) || (part.startsWith('_') && part.endsWith('_'))) {
                htmlContent += `<em>${escapeHtml(part.slice(1, -1))}</em>`;
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

    const lines = markdownContent.split('\n');
    let htmlOutput = '';
    let inList: 'ul' | 'ol' | null = null;
    let inTable = false;
    let i = 0;

    const closeList = () => {
        if (inList === 'ul') htmlOutput += '</ul>';
        if (inList === 'ol') htmlOutput += '</ol>';
        inList = null;
    };

    while (i < lines.length) {
        const line = lines[i];
        const trimmedLine = line.trim();
        
        const isUl = trimmedLine.startsWith('* ');
        const isOl = trimmedLine.match(/^\d+\. /);
        if (!isUl && !isOl && inList) {
            closeList();
        }

        if (trimmedLine.startsWith('|') && trimmedLine.includes('|')) {
            closeList();
            const separatorLine = i + 1 < lines.length ? lines[i + 1]?.trim() : '';
            if (separatorLine.startsWith('|') && separatorLine.includes('-')) {
                if (inTable) { // close previous table if any
                    htmlOutput += '</tbody></table>';
                }
                htmlOutput += '<table>';
                inTable = true;
                const headerCells = trimmedLine.split('|').slice(1, -1);
                htmlOutput += '<thead><tr>';
                headerCells.forEach(cell => { htmlOutput += `<th>${parseLineToHtml(cell.trim())}</th>`; });
                htmlOutput += '</tr></thead><tbody>';
                i += 2;
                continue;
            } else if (inTable) {
                const rowCells = trimmedLine.split('|').slice(1, -1);
                htmlOutput += '<tr>';
                rowCells.forEach(cell => { htmlOutput += `<td>${parseLineToHtml(cell.trim())}</td>`; });
                htmlOutput += '</tr>';
                i++;
                continue;
            }
        }

        if (inTable) {
            htmlOutput += '</tbody></table>';
            inTable = false;
        }

        if (trimmedLine.startsWith('# ')) htmlOutput += `<h1>${parseLineToHtml(trimmedLine.substring(2))}</h1>`;
        else if (trimmedLine.startsWith('## ')) htmlOutput += `<h2>${parseLineToHtml(trimmedLine.substring(3))}</h2>`;
        else if (trimmedLine.startsWith('### ')) htmlOutput += `<h3>${parseLineToHtml(trimmedLine.substring(4))}</h3>`;
        else if (isUl) {
            if (inList !== 'ul') { htmlOutput += '<ul>'; inList = 'ul'; }
            htmlOutput += `<li>${parseLineToHtml(trimmedLine.substring(2))}</li>`;
        } else if (isOl) {
            if (inList !== 'ol') { htmlOutput += '<ol>'; inList = 'ol'; }
            htmlOutput += `<li>${parseLineToHtml(trimmedLine.replace(/^\d+\. /, ''))}</li>`;
        } else if (trimmedLine) {
            htmlOutput += `<p>${parseLineToHtml(line)}</p>`;
        } else {
            htmlOutput += '<p><br></p>';
        }
        i++;
    }

    closeList();
    if (inTable) htmlOutput += '</tbody></table>';

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
