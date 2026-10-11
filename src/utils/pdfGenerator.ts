import type { jsPDF } from 'jspdf';
import type { UserOptions } from 'jspdf-autotable';
import { Branch, Project, Asset, ConstructionCost, SystemSettings } from '../types';
import { BRAND } from '../config/brand';

// Dynamic loader for heavy PDF generation libraries
const loadPDFModules = async () => {
  const { jsPDF } = await import('jspdf');
  const autoTableModule = await import('jspdf-autotable');
  const autoTable = (autoTableModule as any).default || autoTableModule;
  return { jsPDF, autoTable };
};

// Palette definitions for crisp enterprise PDF printing
const COLORS = {
  primaryDark: [15, 23, 42] as [number, number, number],      // Slate 900
  secondaryDark: [30, 41, 59] as [number, number, number],    // Slate 800
  emeraldAccent: [16, 185, 129] as [number, number, number],  // Emerald 500
  emeraldDark: [5, 150, 105] as [number, number, number],     // Emerald 600
  textMuted: [100, 116, 139] as [number, number, number],     // Slate 500
  textDark: [15, 23, 42] as [number, number, number],         // Slate 900
  lightBg: [248, 250, 252] as [number, number, number],       // Slate 50
  borderGrey: [226, 232, 240] as [number, number, number],    // Slate 200
  white: [255, 255, 255] as [number, number, number],
  amberAlert: [217, 119, 6] as [number, number, number]       // Amber 600
};

export interface InspectionCheckItem {
  area: string;
  check: string;
  status: 'Passed' | 'Action Required' | 'Pending';
  remarks: string;
}

export interface InspectionSheetParams {
  branch: Branch;
  project?: Project | null;
  settings: SystemSettings;
  inspectionDate?: string;
  inspectorName?: string;
  items: InspectionCheckItem[];
  overallRemarks?: string;
  docReference?: string;
}

export interface PaymentVoucherParams {
  branch: Branch;
  project?: Project | null;
  settings: SystemSettings;
  costItem: ConstructionCost;
  voucherNumber?: string;
  issueDate?: string;
  preparedBy?: string;
  retentionPercent?: number; // e.g. 5%
  paymentMethod?: string;
  notes?: string;
}

export interface AssetHandoverParams {
  branch: Branch;
  project?: Project | null;
  settings: SystemSettings;
  assets: Asset[];
  handoverDate?: string;
  handedOverBy?: string;
  receivedBy?: string;
  certificateNumber?: string;
  custodyTerms?: string;
}

/**
 * Internal helper to draw the standardized MK Innovexa branded header banner
 */
function drawBrandedHeader(
  doc: jsPDF,
  settings: SystemSettings,
  documentTitle: string,
  docRef: string
) {
  // Top Banner background
  doc.setFillColor(...COLORS.primaryDark);
  doc.rect(0, 0, 210, 30, 'F');

  // Emerald brand line accent
  doc.setFillColor(...COLORS.emeraldAccent);
  doc.rect(0, 30, 210, 1.5, 'F');

  // Left: Corporate Restaurant Group / Client branding
  doc.setTextColor(...COLORS.white);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text((settings.companyName || 'RESTAURANT GROUP').toUpperCase(), 14, 11);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(203, 213, 225);
  doc.text(settings.companyTagline || 'Hospitality fit-out & asset operations', 14, 17);

  // Document reference badge
  doc.setFontSize(7.5);
  doc.setTextColor(...COLORS.emeraldAccent);
  doc.text(`DOC REF: ${docRef}  |  STATUS: OFFICIAL CERTIFIED`, 14, 24);

  // Right: MK Innovexa Parent Technology Issuer Box
  const rightBoxX = 142;
  doc.setFillColor(...COLORS.secondaryDark);
  doc.roundedRect(rightBoxX, 5, 54, 20, 2, 2, 'F');
  
  // MK Monogram mark
  doc.setFillColor(...COLORS.primaryDark);
  doc.roundedRect(rightBoxX + 3, 7.5, 9, 9, 1.5, 1.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(...COLORS.emeraldAccent);
  doc.text('MK', rightBoxX + 4.5, 13.5);

  // MK Innovexa text
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(...COLORS.white);
  doc.text(BRAND.companyName.toUpperCase(), rightBoxX + 15, 11.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(148, 163, 184);
  doc.text(BRAND.productName, rightBoxX + 15, 16);
  doc.text('Enterprise Operations Suite', rightBoxX + 15, 20);

  // Document Title below header banner
  doc.setTextColor(...COLORS.textDark);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text(documentTitle, 14, 40);
}

/**
 * Internal helper to draw the branch operational context card
 */
function drawBranchContextBox(
  doc: jsPDF,
  branch: Branch,
  project: Project | null | undefined,
  metaPairs: [string, string][]
) {
  const startY = 44;
  doc.setFillColor(...COLORS.lightBg);
  doc.setDrawColor(...COLORS.borderGrey);
  doc.roundedRect(14, startY, 182, 23, 2, 2, 'FD');

  // Left column: Branch details
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.textDark);
  doc.text(`Branch: ${branch.name} (${branch.code})`, 18, startY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...COLORS.textMuted);
  doc.text(`Location: ${branch.address}, ${branch.city}`, 18, startY + 12);
  doc.text(`General Manager: ${branch.branchManager || 'Branch Incharge'} | Tel: ${branch.contactNumber}`, 18, startY + 18);

  // Right column: Project & Metadata
  const col2X = 110;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.textDark);
  doc.text(`Project: ${project?.projectName || 'Standard Branch Operations'}`, col2X, startY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...COLORS.textMuted);
  if (metaPairs.length > 0) {
    doc.text(`${metaPairs[0][0]}: ${metaPairs[0][1]}`, col2X, startY + 12);
  }
  if (metaPairs.length > 1) {
    doc.text(`${metaPairs[1][0]}: ${metaPairs[1][1]}`, col2X, startY + 18);
  }
}

/**
 * Universal multi-page footer with page numbering and MK Innovexa copyright
 */
function drawUniversalFooter(doc: jsPDF) {
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    const pageHeight = doc.internal.pageSize.height;
    
    // Top border line for footer
    doc.setDrawColor(...COLORS.borderGrey);
    doc.setLineWidth(0.3);
    doc.line(14, pageHeight - 14, 196, pageHeight - 14);

    // Left: System Attribution
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(...COLORS.textMuted);
    doc.text(
      `${BRAND.productName} · Developed by ${BRAND.companyName} · ${BRAND.copyrightNotice}`,
      14,
      pageHeight - 9
    );

    // Right: Page number & timestamp
    const dateStr = new Date().toLocaleDateString('en-GB');
    doc.text(`Page ${i} of ${totalPages}  |  Issued: ${dateStr}`, 196, pageHeight - 9, { align: 'right' });
  }
}

/**
 * Standard 3-block signature block for formal enterprise authorization
 */
function drawSignatureBlocks(
  doc: jsPDF,
  startY: number,
  signers: { title: string; subtitle: string; name?: string }[]
) {
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.4);

  const blockWidth = 54;
  const gap = 10;
  const startX = 14;

  signers.slice(0, 3).forEach((signer, index) => {
    const x = startX + index * (blockWidth + gap);
    
    // Signature underline
    doc.line(x, startY + 14, x + blockWidth, startY + 14);
    
    // Signer Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(...COLORS.textDark);
    doc.text(signer.title, x, startY + 18);

    // Signer Subtitle / Role
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(...COLORS.textMuted);
    doc.text(signer.subtitle, x, startY + 22);

    if (signer.name) {
      doc.text(`Name: ${signer.name}`, x, startY + 26);
    }
  });
}

// =========================================================================
// 1. PRE-HANDOVER CIVIL, MEP & EQUIPMENT INSPECTION SHEET
// =========================================================================

export async function exportInspectionSheetPDF(params: InspectionSheetParams): Promise<jsPDF> {
  const {
    branch,
    project,
    settings,
    inspectionDate = new Date().toLocaleDateString('en-GB'),
    inspectorName = project?.projectManager || 'Lead Project Engineer',
    items,
    overallRemarks = 'All primary MEP, safety fire suppression, and civil parameters verified per group standards.',
    docReference = `MKI-INS-${branch.code}-${Date.now().toString().slice(-4)}`
  } = params;

  const { jsPDF, autoTable } = await loadPDFModules();
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  // 1. Branded Header
  drawBrandedHeader(
    doc,
    settings,
    'PRE-HANDOVER CIVIL, MEP & EQUIPMENT INSPECTION SHEET',
    docReference
  );

  // 2. Branch Context Card
  drawBranchContextBox(doc, branch, project, [
    ['Lead Inspector / PM', inspectorName],
    ['Inspection Date', inspectionDate]
  ]);

  // 3. Inspection Checklist Table
  autoTable(doc, {
    startY: 72,
    head: [['Area / System', 'Quality Inspection Parameter', 'Status', 'Engineering Findings & Notes']],
    body: items.map((item) => [
      item.area,
      item.check,
      item.status.toUpperCase(),
      item.remarks
    ]),
    headStyles: {
      fillColor: COLORS.primaryDark,
      textColor: 255,
      fontSize: 7.5,
      fontStyle: 'bold'
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: COLORS.textDark
    },
    alternateRowStyles: {
      fillColor: COLORS.lightBg
    },
    columnStyles: {
      0: { cellWidth: 32, fontStyle: 'bold' },
      1: { cellWidth: 70 },
      2: { cellWidth: 26, fontStyle: 'bold' },
      3: { cellWidth: 54 }
    },
    didParseCell: (data: any) => {
      if (data.section === 'body' && data.column.index === 2) {
        const val = String(data.cell.raw).toUpperCase();
        if (val.includes('PASSED')) {
          data.cell.styles.textColor = COLORS.emeraldDark;
        } else if (val.includes('ACTION')) {
          data.cell.styles.textColor = COLORS.amberAlert;
        }
      }
    },
    styles: { cellPadding: 2.8, lineColor: COLORS.borderGrey, lineWidth: 0.1 },
    margin: { left: 14, right: 14 }
  });

  const finalY = (doc as any).lastAutoTable?.finalY || 180;

  // 4. Overall Remarks Box
  doc.setFillColor(...COLORS.lightBg);
  doc.setDrawColor(...COLORS.borderGrey);
  doc.roundedRect(14, finalY + 4, 182, 14, 1.5, 1.5, 'FD');
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(...COLORS.textDark);
  doc.text('Overall Handover Readiness Verdict:', 18, finalY + 9);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(...COLORS.textMuted);
  doc.text(overallRemarks, 18, finalY + 14);

  // 5. Signature Blocks
  drawSignatureBlocks(doc, finalY + 22, [
    { title: 'Project Fit-out Manager', subtitle: 'Lead Civil & MEP Inspection', name: inspectorName },
    { title: 'Branch General Manager', subtitle: 'Custody Receiver & Acceptance', name: branch.branchManager },
    { title: 'Director Operations', subtitle: 'MK Innovexa Hospitality Group', name: 'Executive Sign-off' }
  ]);

  // 6. Universal Footer
  drawUniversalFooter(doc);

  return doc;
}

// =========================================================================
// 2. CONTRACTOR MILESTONE PAYMENT VERIFICATION VOUCHER
// =========================================================================

export async function exportPaymentVoucherPDF(params: PaymentVoucherParams): Promise<jsPDF> {
  const {
    branch,
    project,
    settings,
    costItem,
    voucherNumber = `MKI-PV-${costItem.invoiceRefNumber || Date.now().toString().slice(-4)}`,
    issueDate = new Date().toLocaleDateString('en-GB'),
    preparedBy = 'Finance & Fit-out Controller',
    retentionPercent = 5,
    paymentMethod = 'Crossed Cheque / RTGS Corporate Bank Transfer',
    notes = 'Payment authorized subject to 90-day defect liability period.'
  } = params;

  const { jsPDF, autoTable } = await loadPDFModules();
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  // 1. Branded Header
  drawBrandedHeader(
    doc,
    settings,
    'CONTRACTOR MILESTONE PAYMENT VERIFICATION VOUCHER',
    voucherNumber
  );

  // 2. Branch Context Card
  drawBranchContextBox(doc, branch, project, [
    ['Contractor / Vendor', costItem.vendorContractor],
    ['Invoice / Work Ref', costItem.invoiceRefNumber || 'N/A']
  ]);

  // Calculate gross, retention, and net
  const gross = Number(costItem.totalCost) || 0;
  const retention = Math.round(gross * (retentionPercent / 100));
  const net = gross - retention;
  const paid = Number(costItem.paidAmount) || 0;
  const balance = net - paid;

  // 3. Payment Breakdown Table
  autoTable(doc, {
    startY: 72,
    head: [['Milestone Work Description', 'Subcontract Scope', 'Status', 'Amount (PKR)']],
    body: [
      [
        `Gross Certified Work Completion (${costItem.category})`,
        costItem.workArea || 'Designated branch zone',
        'VERIFIED BY ENGINEER',
        `Rs. ${gross.toLocaleString('en-PK')}`
      ],
      [
        `Standard Defects Liability Retention (${retentionPercent}%)`,
        'Held until 90-day warranty closure',
        'DEDUCTED',
        `- Rs. ${retention.toLocaleString('en-PK')}`
      ],
      [
        'NET AUTHORIZED PAYABLE AMOUNT',
        'Certified for Treasury Release',
        costItem.paymentStatus.toUpperCase(),
        `Rs. ${net.toLocaleString('en-PK')}`
      ],
      [
        'Disbursed Payment to Date',
        'Bank cleared payments',
        'PAID',
        `Rs. ${paid.toLocaleString('en-PK')}`
      ],
      [
        'Remaining Net Balance Payable',
        'Pending disbursement',
        balance <= 0 ? 'CLEARED' : 'PENDING',
        `Rs. ${Math.max(0, balance).toLocaleString('en-PK')}`
      ]
    ],
    headStyles: {
      fillColor: COLORS.primaryDark,
      textColor: 255,
      fontSize: 8,
      fontStyle: 'bold'
    },
    bodyStyles: {
      fontSize: 8,
      textColor: COLORS.textDark
    },
    columnStyles: {
      0: { cellWidth: 70, fontStyle: 'bold' },
      1: { cellWidth: 50 },
      2: { cellWidth: 32, fontStyle: 'bold' },
      3: { cellWidth: 30, halign: 'right', fontStyle: 'bold' }
    },
    didParseCell: (data: any) => {
      if (data.section === 'body' && data.row.index === 2) {
        data.cell.styles.fillColor = [236, 253, 245]; // emerald-50
        data.cell.styles.textColor = COLORS.emeraldDark;
      }
    },
    styles: { cellPadding: 3, lineColor: COLORS.borderGrey, lineWidth: 0.1 },
    margin: { left: 14, right: 14 }
  });

  const finalY = (doc as any).lastAutoTable?.finalY || 160;

  // 4. Banking & Treasury Instructions Box
  doc.setFillColor(...COLORS.lightBg);
  doc.setDrawColor(...COLORS.borderGrey);
  doc.roundedRect(14, finalY + 5, 182, 20, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(...COLORS.textDark);
  doc.text('Payment Terms & Treasury Release Mandate:', 18, finalY + 11);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(...COLORS.textMuted);
  doc.text(`Disbursement Channel: ${paymentMethod}`, 18, finalY + 16);
  doc.text(`Special Notes: ${notes}`, 18, finalY + 21);

  // 5. Signature Blocks
  drawSignatureBlocks(doc, finalY + 30, [
    { title: 'Fit-out Site Engineer', subtitle: 'Work Quality Certification', name: project?.projectManager || preparedBy },
    { title: 'Finance Controller', subtitle: 'Budget & Retention Verification', name: preparedBy },
    { title: 'Director Operations', subtitle: 'MK Innovexa Treasury Release', name: 'Executive Approval' }
  ]);

  // 6. Universal Footer
  drawUniversalFooter(doc);

  return doc;
}

// =========================================================================
// 3. CAPITAL ASSET & EQUIPMENT HANDOVER CERTIFICATE
// =========================================================================

export async function exportAssetHandoverPDF(params: AssetHandoverParams): Promise<jsPDF> {
  const {
    branch,
    project,
    settings,
    assets,
    handoverDate = new Date().toLocaleDateString('en-GB'),
    handedOverBy = project?.projectManager || 'Project Fit-out Engineer',
    receivedBy = branch.branchManager || 'Branch General Manager',
    certificateNumber = `MKI-AHC-${branch.code}-${Date.now().toString().slice(-4)}`,
    custodyTerms = 'The Branch General Manager assumes operational custody and accountability for all listed equipment, fixtures, and capital assets.'
  } = params;

  const { jsPDF, autoTable } = await loadPDFModules();
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  // 1. Branded Header
  drawBrandedHeader(
    doc,
    settings,
    'CAPITAL ASSET & EQUIPMENT HANDOVER CERTIFICATE',
    certificateNumber
  );

  // 2. Branch Context Card
  drawBranchContextBox(doc, branch, project, [
    ['Handover Custody To', receivedBy],
    ['Transfer Date', handoverDate]
  ]);

  // Aggregate assets total valuation
  const totalAssetsCount = assets.reduce((sum, a) => sum + (Number(a.quantity) || 1), 0);
  const totalAssetValuation = assets.reduce((sum, a) => sum + (Number(a.totalCost) || 0), 0);

  // 3. Equipment Table
  autoTable(doc, {
    startY: 72,
    head: [['Category', 'Asset Item & Model', 'Serial / Tag No.', 'Location', 'Qty', 'Condition', 'Cost (PKR)']],
    body: assets.map((a) => [
      a.category.toUpperCase(),
      a.itemName,
      a.serialNumber || 'TAG-N/A',
      a.locationName || 'Floor Area',
      `${a.quantity} ${a.unit || 'units'}`,
      a.condition.toUpperCase(),
      `Rs. ${(Number(a.totalCost) || 0).toLocaleString('en-PK')}`
    ]),
    foot: [
      [
        'TOTALS',
        `${assets.length} Registered Asset Items`,
        '',
        '',
        `${totalAssetsCount} Units`,
        'ALL VERIFIED',
        `Rs. ${totalAssetValuation.toLocaleString('en-PK')}`
      ]
    ],
    headStyles: {
      fillColor: COLORS.primaryDark,
      textColor: 255,
      fontSize: 7,
      fontStyle: 'bold'
    },
    footStyles: {
      fillColor: COLORS.secondaryDark,
      textColor: 255,
      fontSize: 7.5,
      fontStyle: 'bold'
    },
    bodyStyles: {
      fontSize: 7,
      textColor: COLORS.textDark
    },
    alternateRowStyles: {
      fillColor: COLORS.lightBg
    },
    columnStyles: {
      0: { cellWidth: 24, fontStyle: 'bold' },
      1: { cellWidth: 46 },
      2: { cellWidth: 28, fontStyle: 'bold' },
      3: { cellWidth: 26 },
      4: { cellWidth: 16, halign: 'center' },
      5: { cellWidth: 18, halign: 'center', fontStyle: 'bold' },
      6: { cellWidth: 24, halign: 'right', fontStyle: 'bold' }
    },
    styles: { cellPadding: 2.2, lineColor: COLORS.borderGrey, lineWidth: 0.1 },
    margin: { left: 14, right: 14 }
  });

  const finalY = (doc as any).lastAutoTable?.finalY || 180;

  // 4. Legal Custody Transfer Clause Box
  doc.setFillColor(...COLORS.lightBg);
  doc.setDrawColor(...COLORS.borderGrey);
  doc.roundedRect(14, finalY + 4, 182, 16, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(...COLORS.textDark);
  doc.text('Property Custody & Responsibility Transfer Agreement:', 18, finalY + 9);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(...COLORS.textMuted);
  doc.text(custodyTerms, 18, finalY + 14);

  // 5. Signature Blocks
  drawSignatureBlocks(doc, finalY + 24, [
    { title: 'Project Fit-out Engineer', subtitle: 'Custody Handed Over By', name: handedOverBy },
    { title: 'Branch General Manager', subtitle: 'Custody Received & Verified', name: receivedBy },
    { title: 'Group Operations Director', subtitle: 'MK Innovexa Final Accreditation', name: 'Executive Sign-off' }
  ]);

  // 6. Universal Footer
  drawUniversalFooter(doc);

  return doc;
}
