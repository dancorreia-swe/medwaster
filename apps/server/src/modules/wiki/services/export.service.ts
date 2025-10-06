import puppeteer from "puppeteer";
import { ArticleService } from "./article-service";
import { NotFoundError, InternalServerError } from "@/lib/errors";
import { jsPDF } from "jspdf";
import { readFileSync } from "fs";
import { join } from "path";

export interface PDFExportOptions {
  includeImages?: boolean;
  format?: "A4" | "Letter";
  margins?: {
    top?: number;
    right?: number;
    bottom?: number;
    left?: number;
  };
  watermark?: string;
  showFooter?: boolean;
}

export interface PDFExportResult {
  buffer: Buffer;
  filename: string;
  mimeType: string;
  size: number;
}

export abstract class ExportService {
  private static readonly DEFAULT_OPTIONS: Required<PDFExportOptions> = {
    includeImages: true,
    format: "A4",
    margins: {
      top: 20,
      right: 20,
      bottom: 20,
      left: 20,
    },
    watermark: "",
    showFooter: true,
  };

  /**
   * Convert BlockNote content to clean HTML for PDF generation
   */
  private static convertBlockNoteToHTML(content: any): string {
    if (!content || !content.content) {
      return "<p>No content available</p>";
    }

    const convertBlock = (block: any): string => {
      switch (block.type) {
        case "paragraph":
          return `<p>${this.convertInlineContent(block.content || [])}</p>`;
        
        case "heading":
          const level = block.props?.level || 1;
          return `<h${level}>${this.convertInlineContent(block.content || [])}</h${level}>`;
        
        case "bulletListItem":
          return `<li>${this.convertInlineContent(block.content || [])}</li>`;
        
        case "numberedListItem":
          return `<li>${this.convertInlineContent(block.content || [])}</li>`;
        
        case "image":
          const src = block.props?.url || "";
          const alt = block.props?.caption || "";
          return src ? `<img src="${src}" alt="${alt}" style="max-width: 100%; height: auto;" />` : "";
        
        case "table":
          // Simple table rendering - would need more sophisticated logic for complex tables
          return "<table border='1' style='border-collapse: collapse; width: 100%;'><tr><td>Table content (complex tables not fully supported in PDF export)</td></tr></table>";
        
        default:
          return `<div>${this.convertInlineContent(block.content || [])}</div>`;
      }
    };

    const convertInlineContent = (inlineContent: any[]): string => {
      return inlineContent.map(item => {
        if (typeof item === "string") {
          return item;
        }
        if (item.type === "text") {
          let text = item.text || "";
          if (item.styles?.bold) text = `<strong>${text}</strong>`;
          if (item.styles?.italic) text = `<em>${text}</em>`;
          if (item.styles?.underline) text = `<u>${text}</u>`;
          return text;
        }
        return "";
      }).join("");
    };

    // Assign the method to the class for access
    this.convertInlineContent = convertInlineContent;

    const htmlContent = content.content.map(convertBlock).join("\n");
    
    return htmlContent;
  }

  /**
   * Generate PDF template HTML
   */
  private static generatePDFTemplate(
    title: string, 
    htmlContent: string, 
    options: Required<PDFExportOptions>,
    articleMeta?: {
      author?: string;
      publishedAt?: string;
      category?: string;
    }
  ): string {
    const watermarkHTML = options.watermark 
      ? `<div style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-45deg); font-size: 72px; color: rgba(0,0,0,0.1); z-index: -1; pointer-events: none;">${options.watermark}</div>`
      : "";

    const footerHTML = options.showFooter 
      ? `<div style="position: fixed; bottom: 20px; left: 0; right: 0; text-align: center; font-size: 12px; color: #666; border-top: 1px solid #eee; padding-top: 10px;">
           MedWaster Learning - Sistema de Gestão de Resíduos Médicos
         </div>`
      : "";

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>${title}</title>
          <style>
            body {
              font-family: 'Arial', sans-serif;
              line-height: 1.6;
              color: #333;
              margin: ${options.margins.top}mm ${options.margins.right}mm ${options.margins.bottom}mm ${options.margins.left}mm;
              background: white;
            }
            
            h1, h2, h3, h4, h5, h6 {
              color: #2c3e50;
              margin-top: 20px;
              margin-bottom: 10px;
            }
            
            h1 {
              border-bottom: 3px solid #3498db;
              padding-bottom: 10px;
              font-size: 28px;
            }
            
            h2 {
              border-bottom: 1px solid #bdc3c7;
              padding-bottom: 5px;
              font-size: 22px;
            }
            
            p {
              margin-bottom: 12px;
              text-align: justify;
            }
            
            ul, ol {
              margin-bottom: 12px;
              padding-left: 25px;
            }
            
            li {
              margin-bottom: 5px;
            }
            
            img {
              max-width: 100%;
              height: auto;
              margin: 10px 0;
              border: 1px solid #ddd;
              border-radius: 4px;
              padding: 5px;
            }
            
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 15px 0;
            }
            
            th, td {
              border: 1px solid #ddd;
              padding: 8px;
              text-align: left;
            }
            
            th {
              background-color: #f8f9fa;
              font-weight: bold;
            }
            
            .article-meta {
              background-color: #f8f9fa;
              padding: 15px;
              border-left: 4px solid #3498db;
              margin-bottom: 20px;
              font-size: 14px;
            }
            
            .article-meta strong {
              color: #2c3e50;
            }

            @page {
              margin: 0;
              size: ${options.format};
            }
            
            @media print {
              body {
                margin: ${options.margins.top}mm ${options.margins.right}mm ${options.margins.bottom}mm ${options.margins.left}mm;
              }
            }
          </style>
        </head>
        <body>
          ${watermarkHTML}
          
          <h1>${title}</h1>
          
          ${articleMeta ? `
            <div class="article-meta">
              ${articleMeta.author ? `<p><strong>Autor:</strong> ${articleMeta.author}</p>` : ""}
              ${articleMeta.category ? `<p><strong>Categoria:</strong> ${articleMeta.category}</p>` : ""}
              ${articleMeta.publishedAt ? `<p><strong>Publicado em:</strong> ${new Date(articleMeta.publishedAt).toLocaleDateString('pt-BR')}</p>` : ""}
              <p><strong>Gerado em:</strong> ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}</p>
            </div>
          ` : ""}
          
          <div class="content">
            ${htmlContent}
          </div>
          
          ${footerHTML}
        </body>
      </html>
    `;
  }

  /**
   * Export article as PDF using Puppeteer
   */
  static async exportArticleToPDF(
    articleId: number, 
    options: PDFExportOptions = {}
  ): Promise<PDFExportResult> {
    const finalOptions = { ...this.DEFAULT_OPTIONS, ...options };

    try {
      // Get article data
      const article = await ArticleService.getArticleById(articleId);
      
      if (!article) {
        throw new NotFoundError(`Article with ID ${articleId}`);
      }

      // Convert BlockNote content to HTML
      const htmlContent = this.convertBlockNoteToHTML(article.content);
      
      // Generate PDF template
      const html = this.generatePDFTemplate(
        article.title,
        htmlContent,
        finalOptions,
        {
          author: article.author?.name || article.author?.email,
          publishedAt: article.publishedAt || undefined,
          category: article.category?.name,
        }
      );

      // Launch Puppeteer and generate PDF
      const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });

      const page = await browser.newPage();
      
      // Set content and wait for images to load if includeImages is true
      await page.setContent(html, { 
        waitUntil: finalOptions.includeImages ? 'networkidle0' : 'domcontentloaded' 
      });

      // Generate PDF
      const pdfBuffer = await page.pdf({
        format: finalOptions.format === "A4" ? "a4" : "letter",
        margin: {
          top: `${finalOptions.margins.top}mm`,
          right: `${finalOptions.margins.right}mm`,
          bottom: `${finalOptions.margins.bottom}mm`,
          left: `${finalOptions.margins.left}mm`,
        },
        printBackground: true,
        preferCSSPageSize: true,
      });

      await browser.close();

      // Generate filename
      const sanitizedTitle = article.title
        .replace(/[^a-zA-Z0-9\s]/g, "")
        .replace(/\s+/g, "-")
        .toLowerCase()
        .substring(0, 50);
      
      const timestamp = new Date().toISOString().split("T")[0];
      const filename = `wiki-${sanitizedTitle}-${timestamp}.pdf`;

      return {
        buffer: Buffer.from(pdfBuffer),
        filename,
        mimeType: "application/pdf",
        size: pdfBuffer.byteLength,
      };

    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      
      console.error("PDF export failed:", error);
      throw new InternalServerError(
        `Failed to export article to PDF: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  /**
   * Export multiple articles as a combined PDF
   */
  static async exportMultipleArticlesToPDF(
    articleIds: number[],
    options: PDFExportOptions & { title?: string } = {}
  ): Promise<PDFExportResult> {
    const finalOptions = { ...this.DEFAULT_OPTIONS, ...options };

    try {
      if (articleIds.length === 0) {
        throw new Error("At least one article ID is required");
      }

      // Get all articles
      const articles = await Promise.all(
        articleIds.map(id => ArticleService.getArticleById(id))
      );

      // Filter out null results and check if any articles were found
      const validArticles = articles.filter(a => a !== null);
      if (validArticles.length === 0) {
        throw new NotFoundError("No valid articles found");
      }

      // Combine all content
      const combinedContent = validArticles.map(article => {
        const htmlContent = this.convertBlockNoteToHTML(article.content);
        return `
          <div style="page-break-before: always;">
            <h1>${article.title}</h1>
            <div class="article-meta">
              ${article.author?.name ? `<p><strong>Autor:</strong> ${article.author.name}</p>` : ""}
              ${article.category?.name ? `<p><strong>Categoria:</strong> ${article.category.name}</p>` : ""}
              ${article.publishedAt ? `<p><strong>Publicado em:</strong> ${new Date(article.publishedAt).toLocaleDateString('pt-BR')}</p>` : ""}
            </div>
            <div class="content">
              ${htmlContent}
            </div>
          </div>
        `;
      }).join("\n");

      // Generate combined PDF
      const title = options.title || `Coletânea de Artigos - ${validArticles.length} artigos`;
      const html = this.generatePDFTemplate(title, combinedContent, finalOptions);

      const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });

      const page = await browser.newPage();
      await page.setContent(html, { 
        waitUntil: finalOptions.includeImages ? 'networkidle0' : 'domcontentloaded' 
      });

      const pdfBuffer = await page.pdf({
        format: finalOptions.format === "A4" ? "a4" : "letter",
        margin: {
          top: `${finalOptions.margins.top}mm`,
          right: `${finalOptions.margins.right}mm`,
          bottom: `${finalOptions.margins.bottom}mm`,
          left: `${finalOptions.margins.left}mm`,
        },
        printBackground: true,
        preferCSSPageSize: true,
      });

      await browser.close();

      const timestamp = new Date().toISOString().split("T")[0];
      const filename = `wiki-coletanea-${articleIds.length}-artigos-${timestamp}.pdf`;

      return {
        buffer: Buffer.from(pdfBuffer),
        filename,
        mimeType: "application/pdf",
        size: pdfBuffer.byteLength,
      };

    } catch (error) {
      console.error("Multiple articles PDF export failed:", error);
      throw new InternalServerError(
        `Failed to export articles to PDF: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  // Helper method (needed for the convertInlineContent function)
  private static convertInlineContent: (inlineContent: any[]) => string;
}