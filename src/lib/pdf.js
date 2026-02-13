/**
 * PDF Quotation Generator for Export Rate Calculator
 * Premium Invoice-Style Design
 */

import { jsPDF } from 'jspdf';
// Note: jspdf-autotable is loaded dynamically in generateQuotationPDF to avoid SSR issues

// Format currency as USD
function formatCurrency(value) {
    if (value === null || value === undefined || isNaN(value)) return '$0.00';
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(value);
}

// Format INR
function formatINR(value) {
    if (value === null || value === undefined || isNaN(value)) return '₹0';
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(value);
}

// Colors - Cream/Beige theme (shared for all pages)
const bgColor = [250, 247, 240];       // Cream background
const textDark = [30, 30, 30];         // Almost black
const textMuted = [100, 100, 100];     // Gray
const accentColor = [0, 150, 150];     // Teal accent

// Helper to draw beige background on any page
function drawPageBackground(doc) {
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    doc.setFillColor(...bgColor);
    doc.rect(0, 0, pageWidth, pageHeight, 'F');
}

/**
 * Generate a premium invoice-style quotation PDF
 * @param {Object} data - Quotation data
 * @param {Object} clientInfo - Client details (name, phone, company)
 * @param {string} logoDataUrl - Base64 data URL of the logo (optional)
 * @returns {Promise<jsPDF>} PDF document
 */
export async function generateQuotationPDF(data, clientInfo = {}, logoDataUrl = null, currency = 'USD', shareOptions = null) {
    // Currency formatter based on selection
    const fmt = (value) => currency === 'INR' ? formatINR(value) : formatCurrency(value);
    // Dynamically import jspdf-autotable to avoid SSR issues
    await import('jspdf-autotable');

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Fill background on first page
    drawPageBackground(doc);

    let yPos = 20;

    // ============================================
    // HEADER - Logo + Invoice Number
    // ============================================

    // Add logo if provided
    if (logoDataUrl) {
        try {
            // Logo on the left - 40x50 size to fit the triangle design
            doc.addImage(logoDataUrl, 'PNG', 20, yPos - 5, 35, 44);
        } catch (e) {
            console.error('Error adding logo:', e);
        }
    }

    // Invoice title and number (right side)
    const today = new Date();
    const invoiceNo = `${String(today.getDate()).padStart(2, '0')}${String(today.getMonth() + 1).padStart(2, '0')}${today.getFullYear().toString().slice(-2)}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;

    // Date (top right)
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...textMuted);
    doc.text(today.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }), pageWidth - 20, yPos + 5, { align: 'right' });

    // Invoice Number (below date)
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...textDark);
    doc.setFontSize(11);
    doc.text(`No. ${invoiceNo}`, pageWidth - 20, yPos + 14, { align: 'right' });

    // "Invoice" title - BOLD and large (right aligned, below invoice number)
    doc.setTextColor(...textDark);
    doc.setFontSize(48);
    doc.setFont('helvetica', 'bold');
    doc.text('Invoice', pageWidth - 20, yPos + 42, { align: 'right' });

    yPos += 55;

    // Horizontal line
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.5);
    doc.line(20, yPos, pageWidth - 20, yPos);

    yPos += 15;

    // ============================================
    // PRICING SUMMARY - Ex-Factory Price Only
    // ============================================
    const exFactoryPrice = currency === 'INR'
        ? (data.pricing?.exFactory?.inr || 0)
        : (data.pricing?.exFactory?.usd || 0);
    const perUnitPrice = data.pricing?.perUnit?.exFactory || 0;

    // Single prominent price box - full width
    const priceBoxWidth = pageWidth - 40;
    const priceBoxHeight = 35;
    doc.setFillColor(0, 150, 150);  // Teal accent
    doc.roundedRect(20, yPos, priceBoxWidth, priceBoxHeight, 4, 4, 'F');

    // Tier label
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(255, 255, 255);
    doc.text('EX-FACTORY', pageWidth / 2, yPos + 10, { align: 'center' });

    // Price (large, bold)
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(fmt(exFactoryPrice), pageWidth / 2, yPos + 26, { align: 'center' });

    yPos += priceBoxHeight + 12;

    // ============================================
    // BILLED TO & SHIPMENT DETAILS (Two columns)
    // ============================================
    const colWidth = (pageWidth - 50) / 2;
    const leftCol = 20;
    const rightColStart = leftCol + colWidth + 10;

    // Left Column - Billed To
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...textDark);
    doc.text('Billed To', leftCol, yPos);

    let leftY = yPos + 8;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...textMuted);

    const clientName = clientInfo.name || 'Valued Customer';
    const clientPhone = clientInfo.phone || '';
    const clientCompany = clientInfo.company || '';

    doc.text(clientName, leftCol, leftY);
    leftY += 5;
    if (clientCompany) {
        doc.text(clientCompany, leftCol, leftY);
        leftY += 5;
    }
    if (clientPhone) {
        doc.text(`Tel: ${clientPhone}`, leftCol, leftY);
        leftY += 5;
    }

    // Right Column - Shipment Details
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...textDark);
    doc.text('Shipment Details', rightColStart, yPos);

    let rightY = yPos + 8;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);

    // Product info
    doc.setTextColor(...textMuted);
    doc.text('Product:', rightColStart, rightY);
    doc.setTextColor(...textDark);
    doc.text(`${data.productName || 'N/A'}`, rightColStart + 35, rightY);
    rightY += 5;

    // HSN
    doc.setTextColor(...textMuted);
    doc.text('HSN:', rightColStart, rightY);
    doc.setTextColor(...textDark);
    doc.text(`${data.hsnCode || 'N/A'}`, rightColStart + 35, rightY);
    rightY += 5;

    // Quantity
    doc.setTextColor(...textMuted);
    doc.text('Quantity:', rightColStart, rightY);
    doc.setTextColor(...textDark);
    doc.text(`${data.quantity?.toLocaleString() || 0} ${data.unit || 'KG'}`, rightColStart + 35, rightY);
    rightY += 5;

    yPos = Math.max(leftY, rightY) + 8;

    // Horizontal line
    doc.setDrawColor(200, 200, 200);
    doc.line(20, yPos, pageWidth - 20, yPos);
    yPos += 8;

    // ============================================
    // ROUTE DETAILS (single row - Origin only)
    // ============================================
    doc.setFontSize(9);
    doc.setTextColor(...textMuted);
    doc.text('Origin:', leftCol, yPos);
    doc.setTextColor(...textDark);
    doc.text(`${data.factoryLocation || 'India'}`, leftCol + 25, yPos);

    yPos += 15;

    // ============================================
    // COST BREAKDOWN TABLE
    // ============================================
    const breakdown = data.pricing?.breakdown || {};
    const selectedTier = data.pricing?.selectedTier || 'cif';
    const tableBody = [];

    // If shareOptions provided, use selected items; otherwise build from breakdown
    if (shareOptions && shareOptions.items && shareOptions.items.length > 0) {
        shareOptions.items.forEach(item => {
            tableBody.push([
                item.label,
                '-',
                '-',
                fmt(item.amount || 0)
            ]);
        });
        // Add "Other Charges" if enabled and there's a balance
        if (shareOptions.showOther && shareOptions.otherAmount > 0) {
            tableBody.push([
                'Other Charges',
                '-',
                '-',
                fmt(shareOptions.otherAmount)
            ]);
        }
    } else {
        // Default: show all items (no profit separately)
        if (breakdown.productBase) {
            tableBody.push([
                'Product Cost',
                `${formatCurrency(breakdown.productBase.perUnit || 0)}/${data.unit || 'KG'}`,
                `${breakdown.productBase.quantity || 0} ${data.unit || 'KG'}`,
                fmt(breakdown.productBase.total || 0)
            ]);
        }
        if (breakdown.innerPacking?.total > 0) {
            tableBody.push(['Inner Packing', '-', `${breakdown.innerPacking.quantity || 0} units`, fmt(breakdown.innerPacking.total)]);
        }
        if (breakdown.outerPacking?.total > 0) {
            tableBody.push(['Outer Box Packing', '-', `${breakdown.totalBoxes || 0} boxes`, fmt(breakdown.outerPacking.total)]);
        }
        if (breakdown.bankCharges?.total > 0) {
            tableBody.push([`Bank Charges (${breakdown.bankCharges.rate || 0}%)`, 'On Total', '-', fmt(breakdown.bankCharges.total)]);
        }
        // NOTE: Profit is intentionally NOT shown as a separate line - it's included in the total
    }

    doc.autoTable({
        startY: yPos,
        head: [['Description', 'Rate', 'Qty/Details', 'Amount']],
        body: tableBody,
        theme: 'plain',
        styles: {
            fontSize: 9,
            cellPadding: 4,
        },
        headStyles: {
            fillColor: bgColor,
            textColor: textMuted,
            fontStyle: 'bold',
            fontSize: 9,
            lineWidth: { bottom: 0.5 },
            lineColor: [200, 200, 200]
        },
        bodyStyles: {
            textColor: textDark,
            lineWidth: { bottom: 0.2 },
            lineColor: [230, 230, 230]
        },
        columnStyles: {
            0: { cellWidth: 60 },
            1: { cellWidth: 35, halign: 'center' },
            2: { cellWidth: 40, halign: 'center' },
            3: { cellWidth: 35, halign: 'right', fontStyle: 'bold' }
        },
        margin: { left: 20, right: 20 },
        didDrawPage: function (data) {
            // Ensure beige background on all pages (including subsequent pages)
            if (data.pageNumber > 1) {
                drawPageBackground(doc);
            }
        }
    });

    yPos = doc.lastAutoTable.finalY + 10;

    // ============================================
    // TOTALS Section (right aligned)
    // ============================================
    const rightCol = pageWidth - 20;
    const labelCol = rightCol - 60;

    // Per unit rate
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...textMuted);
    doc.text(`Rate per ${data.unit || 'KG'}`, labelCol, yPos, { align: 'right' });
    doc.setTextColor(...textDark);
    doc.text(formatCurrency(perUnitPrice), rightCol, yPos, { align: 'right' });

    yPos += 6;

    // TOTAL (bold, larger) - Ex-Factory final price
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...textDark);
    doc.text('Total (Ex-Factory)', labelCol, yPos, { align: 'right' });
    doc.setFontSize(14);
    doc.text(fmt(exFactoryPrice), rightCol, yPos, { align: 'right' });

    // ============================================
    // FOOTER - Payment Info & Company Info
    // ============================================
    yPos = pageHeight - 60;

    // Horizontal line
    doc.setDrawColor(200, 200, 200);
    doc.line(20, yPos, pageWidth - 20, yPos);

    yPos += 12;

    // Left column - Payment Information
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...textDark);
    doc.text('Payment Information', 20, yPos);

    yPos += 7;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...textMuted);
    doc.setFontSize(9);
    doc.text('Arovave Global', 20, yPos);
    yPos += 5;
    doc.text('Bank: [Your Bank Name]', 20, yPos);
    yPos += 5;
    doc.text('Account No: [Account Number]', 20, yPos);
    yPos += 5;
    doc.text('SWIFT: [SWIFT Code]', 20, yPos);

    // Right column - Company Info
    yPos = pageHeight - 48;
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...textDark);
    doc.setFontSize(10);
    doc.text('Arovave Global', pageWidth / 2 + 10, yPos);

    yPos += 7;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...textMuted);
    doc.setFontSize(8);
    doc.text('MDH 5/25, Sector H, Jankipuram,', pageWidth / 2 + 10, yPos);
    yPos += 4;
    doc.text('Lucknow, Uttar Pradesh 226021', pageWidth / 2 + 10, yPos);
    yPos += 5;
    doc.text('+91 9305764815', pageWidth / 2 + 10, yPos);
    yPos += 4;
    doc.text('exports@arovaveglobal.com', pageWidth / 2 + 10, yPos);

    // Validity note at bottom
    yPos = pageHeight - 15;
    doc.setFontSize(8);
    doc.setTextColor(...textMuted);
    doc.text('This quotation is valid for 7 days from the date of issue. Prices subject to market fluctuations.', pageWidth / 2, yPos, { align: 'center' });

    return doc;
}

/**
 * Load logo image and convert to base64
 * @returns {Promise<string|null>} Base64 data URL or null
 */
async function loadLogoAsBase64() {
    try {
        const response = await fetch('/logo.png');
        const blob = await response.blob();
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = () => resolve(null);
            reader.readAsDataURL(blob);
        });
    } catch (e) {
        console.error('Error loading logo:', e);
        return null;
    }
}

/**
 * Download the quotation PDF
 * @param {Object} data - Quotation data
 * @param {Object} clientInfo - Client details
 */
export async function downloadQuotationPDF(data, clientInfo = {}, currency = 'USD', shareOptions = null) {
    const logoDataUrl = await loadLogoAsBase64();
    const doc = await generateQuotationPDF(data, clientInfo, logoDataUrl, currency, shareOptions);
    const filename = `Arovave_Quotation_${data.productName?.replace(/\s+/g, '_') || 'Export'}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(filename);
}

/**
 * Get PDF as blob for sharing
 * @param {Object} data - Quotation data
 * @param {Object} clientInfo - Client details
 * @returns {Promise<Blob>} PDF blob
 */
export async function getQuotationPDFBlob(data, clientInfo = {}, currency = 'USD', shareOptions = null) {
    const logoDataUrl = await loadLogoAsBase64();
    const doc = await generateQuotationPDF(data, clientInfo, logoDataUrl, currency, shareOptions);
    return doc.output('blob');
}
