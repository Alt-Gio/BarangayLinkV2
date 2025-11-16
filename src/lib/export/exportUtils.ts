/**
 * Export Utilities for CSV and PDF Reports
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// ============================================
// CSV EXPORT
// ============================================

export function exportToCSV(data: any[], filename: string) {
  if (!data || data.length === 0) {
    alert("No data to export");
    return;
  }

  // Get headers from first object
  const headers = Object.keys(data[0]);
  
  // Create CSV content
  let csvContent = headers.join(",") + "\n";
  
  data.forEach((row) => {
    const values = headers.map((header) => {
      const value = row[header];
      // Handle commas and quotes in values
      if (typeof value === "string" && (value.includes(",") || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value || "";
    });
    csvContent += values.join(",") + "\n";
  });

  // Create blob and download
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  
  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}.csv`);
  link.style.visibility = "hidden";
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// ============================================
// PDF EXPORT
// ============================================

export interface PDFReportOptions {
  title: string;
  filename: string;
  orientation?: 'portrait' | 'landscape';
  data: any[];
  columns: { header: string; dataKey: string }[];
  summary?: { label: string; value: string | number }[];
}

export function exportToPDF(options: PDFReportOptions) {
  const { title, filename, orientation = 'portrait', data, columns, summary } = options;

  if (!data || data.length === 0) {
    alert("No data to export");
    return;
  }

  // Create new PDF document
  const doc = new jsPDF({
    orientation,
    unit: 'mm',
    format: 'a4',
  });

  // Add header
  doc.setFontSize(18);
  doc.setFont(undefined, 'bold');
  doc.text(title, 14, 15);

  // Add subtitle
  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');
  doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 22);

  // Add summary if provided
  let startY = 30;
  if (summary && summary.length > 0) {
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('Summary', 14, startY);
    startY += 7;

    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    summary.forEach((item) => {
      doc.text(`${item.label}: ${item.value}`, 14, startY);
      startY += 6;
    });
    startY += 5;
  }

  // Add table
  autoTable(doc, {
    startY,
    head: [columns.map(col => col.header)],
    body: data.map(row => columns.map(col => row[col.dataKey] || '')),
    theme: 'grid',
    headStyles: {
      fillColor: [59, 130, 246], // Blue
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    styles: {
      fontSize: 9,
      cellPadding: 3,
    },
    alternateRowStyles: {
      fillColor: [245, 247, 250],
    },
  });

  // Save PDF
  doc.save(`${filename}.pdf`);
}

// ============================================
// SPECIALIZED EXPORT FUNCTIONS
// ============================================

/**
 * Export Residents List
 */
export function exportResidents(residents: any[]) {
  const data = residents.map((r) => ({
    "Barangay ID": r.barangayIdNumber,
    "Name": `${r.firstName} ${r.middleName || ''} ${r.lastName}`,
    "Age": r.age,
    "Gender": r.gender,
    "Civil Status": r.civilStatus,
    "Phone": r.phoneNumber,
    "Verified": r.isVerified ? "Yes" : "No",
    "Status": [
      r.isSeniorCitizen && "Senior",
      r.isPWD && "PWD",
      r.isVoter && "Voter",
    ].filter(Boolean).join(", ") || "None",
  }));

  exportToCSV(data, `residents_${new Date().toISOString().split('T')[0]}`);
}

/**
 * Export Residents to PDF
 */
export function exportResidentsToPDF(residents: any[], stats: any) {
  const data = residents.map((r) => ({
    id: r.barangayIdNumber,
    name: `${r.firstName} ${r.lastName}`,
    age: r.age,
    gender: r.gender,
    phone: r.phoneNumber,
    verified: r.isVerified ? "✓" : "✗",
  }));

  exportToPDF({
    title: 'Barangay 37 - Bitano Residents Report',
    filename: `residents_report_${new Date().toISOString().split('T')[0]}`,
    orientation: 'landscape',
    data,
    columns: [
      { header: 'Barangay ID', dataKey: 'id' },
      { header: 'Name', dataKey: 'name' },
      { header: 'Age', dataKey: 'age' },
      { header: 'Gender', dataKey: 'gender' },
      { header: 'Phone', dataKey: 'phone' },
      { header: 'Verified', dataKey: 'verified' },
    ],
    summary: stats ? [
      { label: 'Total Residents', value: stats.totalResidents },
      { label: 'Verified', value: stats.verified },
      { label: 'Male', value: stats.male },
      { label: 'Female', value: stats.female },
      { label: 'Senior Citizens', value: stats.seniors },
    ] : undefined,
  });
}

/**
 * Export Households List
 */
export function exportHouseholds(households: any[]) {
  const data = households.map((h) => ({
    "Household #": h.householdNumber,
    "Address": `${h.houseNumber} ${h.street}, ${h.purok}`,
    "City": h.city,
    "Members": h.totalMembers,
    "Indigent": h.isIndigent ? "Yes" : "No",
    "4Ps": h.is4PsBeneficiary ? "Yes" : "No",
    "Utilities": [
      h.hasElectricity && "⚡",
      h.hasWater && "💧",
      h.hasInternet && "📡",
    ].filter(Boolean).join(" "),
  }));

  exportToCSV(data, `households_${new Date().toISOString().split('T')[0]}`);
}

/**
 * Export Certificates List
 */
export function exportCertificates(certificates: any[]) {
  const data = certificates.map((c) => ({
    "Certificate #": c.certificateNumber,
    "Type": c.certificateType,
    "Issued To": c.residentName,
    "Purpose": c.purpose,
    "Issued Date": new Date(c.issuedAt).toLocaleDateString(),
    "Issued By": c.issuedByName,
    "Valid": c.isValid ? "Yes" : "No",
  }));

  exportToCSV(data, `certificates_${new Date().toISOString().split('T')[0]}`);
}

/**
 * Export Certificate Requests
 */
export function exportCertificateRequests(requests: any[]) {
  const data = requests.map((r) => ({
    "Control #": r.controlNumber,
    "Resident": r.requestedBy,
    "Type": r.certificateType,
    "Purpose": r.purpose,
    "Status": r.status,
    "Requested": new Date(r.requestedAt).toLocaleDateString(),
    "Paid": r.isPaid ? "Yes" : "No",
  }));

  exportToCSV(data, `certificate_requests_${new Date().toISOString().split('T')[0]}`);
}

/**
 * Export Analytics Report to PDF
 */
export function exportAnalyticsReport(stats: {
  residentStats: any;
  householdStats: any;
  certificateStats: any;
}) {
  const { residentStats, householdStats, certificateStats } = stats;

  // Prepare demographic data for table
  const demographicData = [
    { category: 'Total Residents', value: residentStats?.totalResidents || 0 },
    { category: 'Male', value: residentStats?.male || 0 },
    { category: 'Female', value: residentStats?.female || 0 },
    { category: 'Verified Residents', value: residentStats?.verified || 0 },
    { category: 'Senior Citizens', value: residentStats?.seniors || 0 },
    { category: 'PWD', value: residentStats?.pwd || 0 },
    { category: 'Voters', value: residentStats?.voters || 0 },
  ];

  exportToPDF({
    title: 'Barangay 37 - Bitano Analytics Report',
    filename: `analytics_report_${new Date().toISOString().split('T')[0]}`,
    orientation: 'portrait',
    data: demographicData,
    columns: [
      { header: 'Category', dataKey: 'category' },
      { header: 'Count', dataKey: 'value' },
    ],
    summary: [
      { label: 'Total Households', value: householdStats?.totalHouseholds || 0 },
      { label: 'Indigent Families', value: householdStats?.indigentHouseholds || 0 },
      { label: '4Ps Beneficiaries', value: householdStats?.fourPsBeneficiaries || 0 },
      { label: 'Total Certificate Requests', value: certificateStats?.totalRequests || 0 },
      { label: 'Approved Certificates', value: certificateStats?.approved || 0 },
    ],
  });
}
