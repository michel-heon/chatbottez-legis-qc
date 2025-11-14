#!/usr/bin/env node

/**
 * PDF to Text Converter
 * Converts PDF files to text using pdf2json library
 * Usage: node scripts/pdf-to-text.js <path-to-pdf>
 */

const fs = require('fs');
const path = require('path');
const PDFParser = require('pdf2json');

async function convertPdfToText(pdfPath) {
    return new Promise((resolve, reject) => {
        try {
            // Check if file exists
            if (!fs.existsSync(pdfPath)) {
                console.error(`Error: File not found: ${pdfPath}`);
                process.exit(1);
            }

            console.log(`Reading PDF: ${pdfPath}`);
            
            const pdfParser = new PDFParser();
            
            pdfParser.on('pdfParser_dataError', errData => {
                console.error('Error parsing PDF:', errData.parserError);
                reject(errData.parserError);
            });
            
            pdfParser.on('pdfParser_dataReady', pdfData => {
                console.log('Parsing complete!');
                
                // Extract text from all pages
                let fullText = '';
                
                if (pdfData.Pages) {
                    pdfData.Pages.forEach((page, pageIndex) => {
                        fullText += `\n\n=== Page ${pageIndex + 1} ===\n\n`;
                        if (page.Texts) {
                            page.Texts.forEach(text => {
                                if (text.R && text.R[0] && text.R[0].T) {
                                    fullText += decodeURIComponent(text.R[0].T) + ' ';
                                }
                            });
                        }
                    });
                }
                
                console.log('\n=== PDF METADATA ===');
                console.log(`Pages: ${pdfData.Pages ? pdfData.Pages.length : 0}`);
                console.log('\n=== TEXT CONTENT ===\n');
                console.log(fullText);
                
                // Save to text file
                const outputPath = pdfPath.replace('.pdf', '.txt');
                fs.writeFileSync(outputPath, fullText, 'utf8');
                console.log(`\n✓ Text saved to: ${outputPath}`);
                
                resolve(fullText);
            });
            
            console.log('Parsing PDF...');
            pdfParser.loadPDF(pdfPath);
            
        } catch (error) {
            console.error('Error converting PDF:', error.message);
            reject(error);
        }
    });
}

// Main execution
const pdfPath = process.argv[2];

if (!pdfPath) {
    console.error('Usage: node scripts/pdf-to-text.js <path-to-pdf>');
    console.error('Example: node scripts/pdf-to-text.js appPackage/docs/report.pdf');
    process.exit(1);
}

const absolutePath = path.resolve(pdfPath);
convertPdfToText(absolutePath);
