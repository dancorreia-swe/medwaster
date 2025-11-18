import puppeteer from "puppeteer";
import path from "node:path";
import fs from "node:fs/promises";

interface CertificateData {
  id: number;
  userName: string;
  averageScore: number;
  totalTrailsCompleted: number;
  totalTimeMinutes: number;
  completionDate: Date;
  verificationCode: string;
}

const CERTIFICATES_DIR = path.join(process.cwd(), "storage", "certificates");

/**
 * Generate HTML template for certificate
 */
function generateCertificateHTML(data: CertificateData): string {
  const formattedDate = new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(data.completionDate));

  const hours = Math.floor(data.totalTimeMinutes / 60);

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Georgia', 'Times New Roman', serif;
      background: linear-gradient(135deg, #155DFC 0%, #0B4FDB 100%);
      padding: 60px;
      width: 1200px;
      height: 850px;
    }
    
    .certificate {
      background: white;
      border-radius: 20px;
      padding: 80px 100px;
      height: 100%;
      position: relative;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    }
    
    .border-decoration {
      position: absolute;
      top: 40px;
      left: 40px;
      right: 40px;
      bottom: 40px;
      border: 3px solid #155DFC;
      border-radius: 12px;
      pointer-events: none;
    }
    
    .header {
      text-align: center;
      margin-bottom: 60px;
      position: relative;
    }
    
    .icon {
      width: 80px;
      height: 80px;
      background: #EFF6FF;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 20px;
      font-size: 48px;
    }
    
    .title {
      font-size: 42px;
      font-weight: bold;
      color: #111827;
      margin-bottom: 10px;
      letter-spacing: 2px;
    }
    
    .subtitle {
      font-size: 20px;
      color: #6B7280;
      font-weight: normal;
    }
    
    .certify-label {
      font-size: 14px;
      text-transform: uppercase;
      letter-spacing: 3px;
      color: #9CA3AF;
      margin-bottom: 15px;
      font-weight: 600;
    }
    
    .student-name {
      font-size: 48px;
      font-weight: bold;
      color: #155DFC;
      margin-bottom: 40px;
      text-align: center;
      line-height: 1.2;
    }
    
    .achievement-text {
      font-size: 18px;
      color: #4B5563;
      line-height: 1.8;
      text-align: center;
      margin-bottom: 50px;
    }
    
    .stats {
      display: flex;
      justify-content: space-around;
      margin-bottom: 50px;
      padding: 30px 0;
      border-top: 2px solid #E5E7EB;
      border-bottom: 2px solid #E5E7EB;
    }
    
    .stat {
      text-align: center;
    }
    
    .stat-label {
      font-size: 13px;
      color: #9CA3AF;
      margin-bottom: 8px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    
    .stat-value {
      font-size: 32px;
      font-weight: bold;
      color: #111827;
    }
    
    .footer {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }
    
    .date-section, .verification-section {
      flex: 1;
    }
    
    .footer-label {
      font-size: 12px;
      color: #9CA3AF;
      margin-bottom: 5px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    
    .footer-value {
      font-size: 16px;
      color: #111827;
      font-weight: 600;
    }
    
    .verification-code {
      font-family: 'Courier New', monospace;
      background: #F3F4F6;
      padding: 8px 16px;
      border-radius: 6px;
      display: inline-block;
    }
    
    .logo {
      text-align: center;
      margin-top: 30px;
    }
    
    .logo-text {
      font-size: 16px;
      color: #155DFC;
      font-weight: 600;
      letter-spacing: 1px;
    }
  </style>
</head>
<body>
  <div class="certificate">
    <div class="border-decoration"></div>
    
    <div class="header">
      <div class="icon">🏆</div>
      <h1 class="title">CERTIFICADO DE CONCLUSÃO</h1>
      <p class="subtitle">MedWaster - Plataforma de Educação</p>
    </div>
    
    <div style="text-align: center;">
      <p class="certify-label">Certificamos que</p>
      <h2 class="student-name">${data.userName}</h2>
    </div>
    
    <p class="achievement-text">
      concluiu com sucesso todas as trilhas de aprendizado da plataforma MedWaster,
      demonstrando excelência e dedicação em sua jornada educacional.
    </p>
    
    <div class="stats">
      <div class="stat">
        <div class="stat-label">Média Geral</div>
        <div class="stat-value">${data.averageScore.toFixed(0)}%</div>
      </div>
      <div class="stat">
        <div class="stat-label">Trilhas Concluídas</div>
        <div class="stat-value">${data.totalTrailsCompleted}</div>
      </div>
      <div class="stat">
        <div class="stat-label">Horas de Estudo</div>
        <div class="stat-value">${hours}h</div>
      </div>
    </div>
    
    <div class="footer">
      <div class="date-section">
        <div class="footer-label">Data de Conclusão</div>
        <div class="footer-value">${formattedDate}</div>
      </div>
      <div class="verification-section" style="text-align: right;">
        <div class="footer-label">Código de Verificação</div>
        <div class="footer-value verification-code">${data.verificationCode}</div>
      </div>
    </div>
    
    <div class="logo">
      <p class="logo-text">MEDWASTER</p>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Generate PDF certificate
 */
export async function generateCertificatePDF(
  data: CertificateData
): Promise<string> {
  try {
    // Ensure certificates directory exists
    await fs.mkdir(CERTIFICATES_DIR, { recursive: true });

    const fileName = `certificate-${data.id}-${data.verificationCode}.pdf`;
    const filePath = path.join(CERTIFICATES_DIR, fileName);

    // Check if certificate already exists
    try {
      await fs.access(filePath);
      console.log(`Certificate already exists: ${fileName}`);
      return `/certificates/${fileName}`;
    } catch {
      // File doesn't exist, generate it
    }

    // Generate HTML
    const html = generateCertificateHTML(data);

    // Launch puppeteer and generate PDF
    const browser = await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
      ],
    });

    const page = await browser.newPage();

    // Set viewport for consistent rendering
    await page.setViewport({
      width: 1200,
      height: 850,
      deviceScaleFactor: 2,
    });

    // Load HTML content
    await page.setContent(html, {
      waitUntil: "networkidle0",
    });

    // Generate PDF
    await page.pdf({
      path: filePath,
      width: "1200px",
      height: "850px",
      printBackground: true,
      preferCSSPageSize: true,
    });

    await browser.close();

    console.log(`✅ Certificate PDF generated: ${fileName}`);

    // Return relative URL path
    return `/certificates/${fileName}`;
  } catch (error) {
    console.error("Failed to generate certificate PDF:", error);
    throw error;
  }
}

/**
 * Get certificate file path
 */
export function getCertificateFilePath(certificateUrl: string): string {
  const fileName = path.basename(certificateUrl);
  return path.join(CERTIFICATES_DIR, fileName);
}
