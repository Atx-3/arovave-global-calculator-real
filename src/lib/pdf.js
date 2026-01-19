/**
 * PDF Quotation Generator for Export Rate Calculator
 * Uses jsPDF for client-side PDF generation
 */

import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { formatCurrency } from './calculator';

/**
 * Generate a quotation PDF
 * @param {Object} data - Quotation data
 * @returns {jsPDF} PDF document
 */
export function generateQuotationPDF(data) {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Colors
    const primaryColor = [0, 168, 168];
    const darkColor = [15, 23, 42];
    const grayColor = [100, 116, 139];

    // Header
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, pageWidth, 45, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('AROVAVE GLOBAL', 20, 25);

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('Export Quotation', 20, 35);

    // Quotation Details
    const today = new Date();
    const refNo = `QT-${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;

    doc.setTextColor(...grayColor);
    doc.setFontSize(10);
    doc.text(`Date: ${today.toLocaleDateString('en-IN')}`, pageWidth - 60, 20);
    doc.text(`Ref: ${refNo}`, pageWidth - 60, 28);

    let yPos = 60;

    // Product Details Section
    doc.setFillColor(248, 250, 252);
    doc.rect(15, yPos, pageWidth - 30, 45, 'F');

    doc.setTextColor(...darkColor);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('PRODUCT DETAILS', 20, yPos + 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(...grayColor);

    yPos += 22;
    doc.text(`Product: ${data.productName}`, 25, yPos);
    doc.text(`HSN Code: ${data.hsnCode}`, 120, yPos);

    yPos += 8;
    doc.text(`Quantity: ${data.quantity} ${data.unit}`, 25, yPos);
    doc.text(`Unit Price: ${formatCurrency(data.basePrice)}`, 120, yPos);

    yPos += 8;
    doc.text(`Origin: ${data.factoryLocation}, India`, 25, yPos);
    doc.text(`Port of Loading: ${data.loadingPort}`, 120, yPos);

    yPos += 8;
    doc.text(`Destination: ${data.destinationPort}, ${data.country}`, 25, yPos);

    yPos += 20;

    // Price Summary
    doc.setFillColor(...primaryColor);
    doc.rect(15, yPos, pageWidth - 30, 10, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('PRICE SUMMARY', 20, yPos + 7);

    yPos += 15;

    // Price Cards
    const cardWidth = (pageWidth - 45) / 3;

    // EX-FACTORY
    doc.setFillColor(248, 250, 252);
    doc.rect(15, yPos, cardWidth, 35, 'F');
    doc.setTextColor(...grayColor);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('EX-FACTORY', 15 + cardWidth / 2, yPos + 10, { align: 'center' });
    doc.setTextColor(...darkColor);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(formatCurrency(data.pricing.exFactory), 15 + cardWidth / 2, yPos + 25, { align: 'center' });

    // FOB
    doc.setFillColor(248, 250, 252);
    doc.rect(20 + cardWidth, yPos, cardWidth, 35, 'F');
    doc.setTextColor(...grayColor);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('FOB', 20 + cardWidth + cardWidth / 2, yPos + 10, { align: 'center' });
    doc.setTextColor(...darkColor);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(formatCurrency(data.pricing.fob), 20 + cardWidth + cardWidth / 2, yPos + 25, { align: 'center' });

    // CIF (highlighted)
    doc.setFillColor(...primaryColor);
    doc.rect(25 + 2 * cardWidth, yPos, cardWidth, 35, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('CIF', 25 + 2 * cardWidth + cardWidth / 2, yPos + 10, { align: 'center' });
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(formatCurrency(data.pricing.cif), 25 + 2 * cardWidth + cardWidth / 2, yPos + 25, { align: 'center' });

    yPos += 45;

    // Cost Breakdown Table
    doc.setTextColor(...darkColor);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('COST BREAKDOWN', 20, yPos);

    yPos += 5;

    const breakdown = data.pricing.breakdown;
    const tableData = [
        ['Base Product Price', `${formatCurrency(breakdown.basePrice)} × ${breakdown.quantity}`, formatCurrency(breakdown.subtotal)],
        ['Inland Transport', '', formatCurrency(breakdown.inlandTransport)],
        ['Port Handling', '', formatCurrency(breakdown.portHandling)],
        ['Documentation', '', formatCurrency(breakdown.documentation)],
    ];

    // Add certifications
    if (breakdown.certifications && breakdown.certifications.length > 0) {
        breakdown.certifications.forEach(cert => {
            tableData.push([cert.name, '', formatCurrency(cert.cost)]);
        });
    }

    tableData.push(
        ['International Freight', '', formatCurrency(breakdown.freight)],
        ['Insurance', `${breakdown.insurancePercent}% of FOB`, formatCurrency(breakdown.insurance)]
    );

    doc.autoTable({
        startY: yPos,
        head: [['Description', 'Details', 'Amount (USD)']],
        body: tableData,
        theme: 'plain',
        headStyles: {
            fillColor: [248, 250, 252],
            textColor: [...grayColor],
            fontStyle: 'bold',
            fontSize: 9
        },
        bodyStyles: {
            textColor: [...darkColor],
            fontSize: 9
        },
        columnStyles: {
            0: { cellWidth: 70 },
            1: { cellWidth: 60, halign: 'center' },
            2: { cellWidth: 40, halign: 'right', fontStyle: 'bold' }
        },
        margin: { left: 20, right: 20 }
    });

    yPos = doc.lastAutoTable.finalY + 15;

    // Certifications included
    if (data.certifications && data.certifications.length > 0) {
        doc.setTextColor(...grayColor);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.text(`Certifications Included: ${data.certifications.join(', ')}`, 20, yPos);
        yPos += 15;
    }

    // Footer
    doc.setFillColor(248, 250, 252);
    doc.rect(15, yPos, pageWidth - 30, 25, 'F');

    doc.setTextColor(...grayColor);
    doc.setFontSize(9);
    doc.text('Validity: 7 days from date of quotation', 20, yPos + 10);
    doc.text('Terms: As per mutual agreement', 20, yPos + 18);
    doc.text('Payment: As per contract terms', 120, yPos + 10);
    doc.text('Incoterms: 2020', 120, yPos + 18);

    // Bottom footer
    yPos = doc.internal.pageSize.getHeight() - 20;
    doc.setDrawColor(...grayColor);
    doc.line(20, yPos - 5, pageWidth - 20, yPos - 5);

    doc.setFontSize(8);
    doc.setTextColor(...grayColor);
    doc.text('AROVAVE GLOBAL | www.arovaveglobal.com | exports@arovaveglobal.com', pageWidth / 2, yPos, { align: 'center' });
    doc.text('This is a computer-generated quotation', pageWidth / 2, yPos + 6, { align: 'center' });

    return doc;
}

/**
 * Download the quotation PDF
 * @param {Object} data - Quotation data
 */
export function downloadQuotationPDF(data) {
    const doc = generateQuotationPDF(data);
    const filename = `Quotation_${data.productName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(filename);
}

/**
 * Get PDF as blob for sharing
 * @param {Object} data - Quotation data
 * @returns {Blob} PDF blob
 */
export function getQuotationPDFBlob(data) {
    const doc = generateQuotationPDF(data);
    return doc.output('blob');
}
