/**
 * Certificate PDF Generation Templates
 * Generates professional certificates with QR codes
 */

export interface CertificateData {
  certificateNumber: string;
  certificateType: string;
  residentName: string;
  residentAddress: string;
  purpose: string;
  issuedDate: string;
  issuedBy: string;
  issuedByPosition: string;
  notedBy?: string;
  notedByPosition?: string;
  qrCode: string;
  validUntil?: string;
  // Additional data based on certificate type
  additionalInfo?: {
    age?: number;
    civilStatus?: string;
    yearsOfResidency?: number;
    monthlyIncome?: string;
    occupation?: string;
    businessName?: string;
    businessType?: string;
  };
}

/**
 * Generates HTML for Barangay Clearance
 */
export function generateBarangayClearanceHTML(data: CertificateData): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    @page {
      size: 8.5in 11in;
      margin: 0.5in;
    }
    body {
      font-family: 'Times New Roman', serif;
      margin: 0;
      padding: 20px;
      background: white;
    }
    .certificate {
      max-width: 7.5in;
      margin: 0 auto;
      border: 3px double #1e40af;
      padding: 30px;
      position: relative;
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
      border-bottom: 2px solid #1e40af;
      padding-bottom: 20px;
    }
    .logo {
      width: 80px;
      height: 80px;
      margin: 0 auto 10px;
    }
    .office-name {
      font-size: 14px;
      font-weight: bold;
      color: #1e40af;
      margin: 5px 0;
    }
    .office-address {
      font-size: 11px;
      color: #64748b;
      margin: 3px 0;
    }
    .title {
      font-size: 24px;
      font-weight: bold;
      text-align: center;
      color: #1e40af;
      margin: 30px 0 20px;
      text-transform: uppercase;
      letter-spacing: 2px;
    }
    .cert-number {
      text-align: center;
      font-size: 12px;
      color: #64748b;
      margin-bottom: 30px;
    }
    .content {
      font-size: 13px;
      line-height: 1.8;
      text-align: justify;
      margin: 20px 0;
    }
    .content p {
      margin: 15px 0;
    }
    .name {
      font-weight: bold;
      font-size: 16px;
      text-decoration: underline;
      color: #000;
    }
    .purpose-box {
      background: #f1f5f9;
      border-left: 4px solid #1e40af;
      padding: 15px;
      margin: 20px 0;
    }
    .signatures {
      display: flex;
      justify-content: space-between;
      margin-top: 60px;
    }
    .signature {
      text-align: center;
      width: 45%;
    }
    .signature-line {
      border-top: 2px solid #000;
      margin: 40px 0 5px;
      padding-top: 5px;
    }
    .signature-name {
      font-weight: bold;
      font-size: 14px;
    }
    .signature-position {
      font-size: 12px;
      color: #64748b;
    }
    .qr-section {
      position: absolute;
      bottom: 30px;
      right: 30px;
      text-align: center;
    }
    .qr-code {
      width: 100px;
      height: 100px;
      border: 2px solid #1e40af;
      padding: 5px;
      background: white;
    }
    .qr-label {
      font-size: 9px;
      color: #64748b;
      margin-top: 5px;
    }
    .footer {
      margin-top: 40px;
      text-align: center;
      font-size: 10px;
      color: #64748b;
      border-top: 1px solid #e2e8f0;
      padding-top: 15px;
    }
    .watermark {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(-45deg);
      font-size: 80px;
      color: rgba(30, 64, 175, 0.05);
      font-weight: bold;
      pointer-events: none;
      z-index: -1;
    }
  </style>
</head>
<body>
  <div class="watermark">OFFICIAL</div>
  
  <div class="certificate">
    <!-- Header -->
    <div class="header">
      <div class="logo">🏛️</div>
      <div class="office-name">OFFICE OF THE PUNONG BARANGAY</div>
      <div class="office-name">BARANGAY 37 - BITANO</div>
      <div class="office-address">Legazpi City, Albay 4500</div>
      <div class="office-address">Philippines</div>
    </div>

    <!-- Title -->
    <div class="title">BARANGAY CLEARANCE</div>
    
    <!-- Certificate Number -->
    <div class="cert-number">Certificate No. <strong>${data.certificateNumber}</strong></div>

    <!-- Content -->
    <div class="content">
      <p style="text-align: center; font-weight: bold; font-size: 14px;">TO WHOM IT MAY CONCERN:</p>
      
      <p>
        This is to certify that <span class="name">${data.residentName.toUpperCase()}</span>, 
        ${data.additionalInfo?.age ? `${data.additionalInfo.age} years old,` : ''} 
        ${data.additionalInfo?.civilStatus ? `${data.additionalInfo.civilStatus},` : ''} 
        is a bonafide resident of <strong>Barangay 37 - Bitano, Legazpi City, Albay</strong> 
        with the following address:
      </p>
      
      <p style="text-align: center; font-style: italic; margin: 20px 40px;">
        ${data.residentAddress}
      </p>
      
      <p>
        Based on the records available in this office, the above-named person is of good moral character 
        and has no derogatory and/or criminal record filed in this barangay.
      </p>

      <div class="purpose-box">
        <strong>PURPOSE:</strong> ${data.purpose}
      </div>

      <p>
        Issued this <strong>${data.issuedDate}</strong> at Barangay 37 - Bitano, Legazpi City, Albay, 
        Philippines upon the request of the above-named person for whatever legal purpose it may serve.
      </p>
    </div>

    <!-- Signatures -->
    <div class="signatures">
      ${data.notedBy ? `
      <div class="signature">
        <div class="signature-line">
          <div class="signature-name">${data.notedBy}</div>
          <div class="signature-position">${data.notedByPosition}</div>
        </div>
      </div>
      ` : '<div></div>'}
      
      <div class="signature">
        <div class="signature-line">
          <div class="signature-name">${data.issuedBy}</div>
          <div class="signature-position">${data.issuedByPosition}</div>
        </div>
      </div>
    </div>

    <!-- QR Code -->
    <div class="qr-section">
      <img src="${data.qrCode}" class="qr-code" alt="QR Code">
      <div class="qr-label">Scan to verify</div>
    </div>

    <!-- Footer -->
    <div class="footer">
      <p>Not valid without official seal • For verification, scan QR code or visit barangaylink.gov.ph/verify</p>
      ${data.validUntil ? `<p>Valid until: ${data.validUntil}</p>` : ''}
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Generates HTML for Certificate of Indigency
 */
export function generateIndigencyHTML(data: CertificateData): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    @page { size: 8.5in 11in; margin: 0.5in; }
    body { font-family: 'Times New Roman', serif; margin: 0; padding: 20px; }
    .certificate { max-width: 7.5in; margin: 0 auto; border: 3px double #ea580c; padding: 30px; }
    .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #ea580c; padding-bottom: 20px; }
    .logo { width: 80px; height: 80px; margin: 0 auto 10px; }
    .office-name { font-size: 14px; font-weight: bold; color: #ea580c; margin: 5px 0; }
    .office-address { font-size: 11px; color: #64748b; margin: 3px 0; }
    .title { font-size: 24px; font-weight: bold; text-align: center; color: #ea580c; margin: 30px 0 20px; text-transform: uppercase; letter-spacing: 2px; }
    .cert-number { text-align: center; font-size: 12px; color: #64748b; margin-bottom: 30px; }
    .content { font-size: 13px; line-height: 1.8; text-align: justify; margin: 20px 0; }
    .name { font-weight: bold; font-size: 16px; text-decoration: underline; }
    .income-box { background: #fff7ed; border-left: 4px solid #ea580c; padding: 15px; margin: 20px 0; }
    .signatures { display: flex; justify-content: space-between; margin-top: 60px; }
    .signature { text-align: center; width: 45%; }
    .signature-line { border-top: 2px solid #000; margin: 40px 0 5px; padding-top: 5px; }
    .signature-name { font-weight: bold; font-size: 14px; }
    .signature-position { font-size: 12px; color: #64748b; }
    .qr-section { position: absolute; bottom: 30px; right: 30px; text-align: center; }
    .qr-code { width: 100px; height: 100px; border: 2px solid #ea580c; padding: 5px; }
    .qr-label { font-size: 9px; color: #64748b; margin-top: 5px; }
    .watermark { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-45deg); font-size: 80px; color: rgba(234, 88, 12, 0.05); font-weight: bold; z-index: -1; }
  </style>
</head>
<body>
  <div class="watermark">INDIGENT</div>
  
  <div class="certificate">
    <div class="header">
      <div class="logo">🏛️</div>
      <div class="office-name">OFFICE OF THE PUNONG BARANGAY</div>
      <div class="office-name">BARANGAY 37 - BITANO</div>
      <div class="office-address">Legazpi City, Albay 4500</div>
    </div>

    <div class="title">CERTIFICATE OF INDIGENCY</div>
    <div class="cert-number">Certificate No. <strong>${data.certificateNumber}</strong></div>

    <div class="content">
      <p style="text-align: center; font-weight: bold; font-size: 14px;">TO WHOM IT MAY CONCERN:</p>
      
      <p>
        This is to certify that <span class="name">${data.residentName.toUpperCase()}</span>, 
        ${data.additionalInfo?.age ? `${data.additionalInfo.age} years old,` : ''} 
        is a bonafide resident of <strong>Barangay 37 - Bitano, Legazpi City, Albay</strong>.
      </p>
      
      <div class="income-box">
        <p><strong>FAMILY STATUS:</strong></p>
        <p>The above-named person belongs to an <strong>INDIGENT FAMILY</strong> with:</p>
        <ul>
          ${data.additionalInfo?.monthlyIncome ? `<li>Monthly Family Income: <strong>${data.additionalInfo.monthlyIncome}</strong></li>` : ''}
          ${data.additionalInfo?.occupation ? `<li>Occupation: <strong>${data.additionalInfo.occupation}</strong></li>` : '<li>Occupation: <strong>None/Unemployed</strong></li>'}
        </ul>
        <p><strong>PURPOSE:</strong> ${data.purpose}</p>
      </div>

      <p>
        This certification is issued upon the request of the above-named person for the purpose stated above 
        and for whatever legal intent it may serve.
      </p>

      <p style="margin-top: 30px;">
        Issued this <strong>${data.issuedDate}</strong> at Barangay 37 - Bitano, Legazpi City, Albay.
      </p>
    </div>

    <div class="signatures">
      ${data.notedBy ? `
      <div class="signature">
        <div class="signature-line">
          <div class="signature-name">${data.notedBy}</div>
          <div class="signature-position">${data.notedByPosition}</div>
        </div>
      </div>
      ` : '<div></div>'}
      
      <div class="signature">
        <div class="signature-line">
          <div class="signature-name">${data.issuedBy}</div>
          <div class="signature-position">${data.issuedByPosition}</div>
        </div>
      </div>
    </div>

    <div class="qr-section">
      <img src="${data.qrCode}" class="qr-code" alt="QR Code">
      <div class="qr-label">Scan to verify</div>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Generates HTML for Certificate of Residency
 */
export function generateResidencyHTML(data: CertificateData): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    @page { size: 8.5in 11in; margin: 0.5in; }
    body { font-family: 'Times New Roman', serif; margin: 0; padding: 20px; }
    .certificate { max-width: 7.5in; margin: 0 auto; border: 3px double #0891b2; padding: 30px; position: relative; }
    .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #0891b2; padding-bottom: 20px; }
    .logo { width: 80px; height: 80px; margin: 0 auto 10px; }
    .office-name { font-size: 14px; font-weight: bold; color: #0891b2; margin: 5px 0; }
    .office-address { font-size: 11px; color: #64748b; margin: 3px 0; }
    .title { font-size: 24px; font-weight: bold; text-align: center; color: #0891b2; margin: 30px 0 20px; text-transform: uppercase; letter-spacing: 2px; }
    .cert-number { text-align: center; font-size: 12px; color: #64748b; margin-bottom: 30px; }
    .content { font-size: 13px; line-height: 1.8; text-align: justify; margin: 20px 0; }
    .name { font-weight: bold; font-size: 16px; text-decoration: underline; }
    .residency-box { background: #ecfeff; border-left: 4px solid #0891b2; padding: 15px; margin: 20px 0; }
    .signatures { display: flex; justify-content: space-between; margin-top: 60px; }
    .signature { text-align: center; width: 45%; }
    .signature-line { border-top: 2px solid #000; margin: 40px 0 5px; padding-top: 5px; }
    .qr-section { position: absolute; bottom: 30px; right: 30px; text-align: center; }
    .qr-code { width: 100px; height: 100px; border: 2px solid #0891b2; padding: 5px; }
    .watermark { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-45deg); font-size: 80px; color: rgba(8, 145, 178, 0.05); font-weight: bold; z-index: -1; }
  </style>
</head>
<body>
  <div class="watermark">RESIDENT</div>
  
  <div class="certificate">
    <div class="header">
      <div class="logo">🏛️</div>
      <div class="office-name">OFFICE OF THE PUNONG BARANGAY</div>
      <div class="office-name">BARANGAY 37 - BITANO</div>
      <div class="office-address">Legazpi City, Albay 4500</div>
    </div>

    <div class="title">CERTIFICATE OF RESIDENCY</div>
    <div class="cert-number">Certificate No. <strong>${data.certificateNumber}</strong></div>

    <div class="content">
      <p style="text-align: center; font-weight: bold; font-size: 14px;">TO WHOM IT MAY CONCERN:</p>
      
      <p>
        This is to certify that <span class="name">${data.residentName.toUpperCase()}</span>, 
        ${data.additionalInfo?.age ? `${data.additionalInfo.age} years old,` : ''} 
        is a <strong>BONAFIDE RESIDENT</strong> of <strong>Barangay 37 - Bitano, Legazpi City, Albay</strong>.
      </p>
      
      <div class="residency-box">
        <p><strong>RESIDENCY DETAILS:</strong></p>
        <p>Address: <strong>${data.residentAddress}</strong></p>
        ${data.additionalInfo?.yearsOfResidency ? `<p>Years of Residency: <strong>${data.additionalInfo.yearsOfResidency} years</strong></p>` : ''}
        <p><strong>PURPOSE:</strong> ${data.purpose}</p>
      </div>

      <p>
        This certification is issued upon the request of the above-named person for whatever legal purpose it may serve.
      </p>

      <p style="margin-top: 30px;">
        Issued this <strong>${data.issuedDate}</strong> at Barangay 37 - Bitano, Legazpi City, Albay.
      </p>
    </div>

    <div class="signatures">
      ${data.notedBy ? `
      <div class="signature">
        <div class="signature-line">
          <div class="signature-name">${data.notedBy}</div>
          <div class="signature-position">${data.notedByPosition}</div>
        </div>
      </div>
      ` : '<div></div>'}
      
      <div class="signature">
        <div class="signature-line">
          <div class="signature-name">${data.issuedBy}</div>
          <div class="signature-position">${data.issuedByPosition}</div>
        </div>
      </div>
    </div>

    <div class="qr-section">
      <img src="${data.qrCode}" class="qr-code" alt="QR Code">
      <div class="qr-label">Scan to verify</div>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Main template selector
 */
export function generateCertificateHTML(
  type: string,
  data: CertificateData
): string {
  switch (type) {
    case "Barangay Clearance":
      return generateBarangayClearanceHTML(data);
    case "Certificate of Indigency":
      return generateIndigencyHTML(data);
    case "Certificate of Residency":
      return generateResidencyHTML(data);
    case "Certificate of Good Moral":
    case "Business Permit":
    case "COMELEC Certification":
    case "First Time Job Seeker":
    case "Certificate of No Income":
      // Use Barangay Clearance template as fallback with modified title
      return generateBarangayClearanceHTML({ ...data, certificateType: type });
    default:
      return generateBarangayClearanceHTML(data);
  }
}
