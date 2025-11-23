import puppeteer, { type Browser } from "puppeteer";
import { Readability } from "@mozilla/readability";
import { JSDOM } from "jsdom";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";

interface ScrapeResult {
  success: boolean;
  content?: string;
  error?: string;
  title?: string;
  authors?: string[];
  contentType?: "html" | "pdf";
}

interface ScraperOptions {
  timeout?: number; // milliseconds
  waitForSelector?: string;
  userAgent?: string;
}

class ContentScraperService {
  private browser: Browser | null = null;
  private readonly DEFAULT_TIMEOUT = 30000; // 30 seconds
  private readonly DEFAULT_USER_AGENT =
    "Mozilla/5.0 (compatible; MedWasterBot/1.0; +https://medwaster.com)";

  /**
   * Initialize the browser instance
   */
  private async getBrowser(): Promise<Browser> {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: true,
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-accelerated-2d-canvas",
          "--disable-gpu",
        ],
      });
    }
    return this.browser;
  }

  /**
   * Close the browser instance
   */
  async closeBrowser(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  /**
   * Extract main article content from HTML using Mozilla Readability
   */
  private extractMainContent(html: string, url: string): {
    content: string;
    title?: string;
    excerpt?: string;
  } {
    try {
      // Create a JSDOM instance
      const dom = new JSDOM(html, { url });

      // Use Readability to extract article content
      const reader = new Readability(dom.window.document);
      const article = reader.parse();

      if (!article) {
        // Fallback to basic extraction if Readability fails
        return {
          content: this.basicTextExtraction(html),
        };
      }

      // Convert HTML content to plain text
      const contentDom = new JSDOM(article.content);
      const textContent = contentDom.window.document.body.textContent || "";

      return {
        content: textContent.replace(/\s+/g, " ").trim(),
        title: article.title,
        excerpt: article.excerpt,
      };
    } catch (error) {
      console.error("Readability extraction failed:", error);
      return {
        content: this.basicTextExtraction(html),
      };
    }
  }

  /**
   * Basic text extraction fallback
   */
  private basicTextExtraction(html: string): string {
    // Remove script and style tags
    let content = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");
    content = content.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "");

    // Remove HTML tags but keep text
    content = content.replace(/<[^>]+>/g, " ");

    // Decode HTML entities
    content = content
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");

    // Remove multiple spaces and trim
    return content.replace(/\s+/g, " ").trim();
  }

  /**
   * Check if a URL points to a PDF file
   */
  private isPdfUrl(url: string): boolean {
    const urlLower = url.toLowerCase();
    return (
      urlLower.endsWith(".pdf") ||
      urlLower.includes(".pdf?") ||
      urlLower.includes("/pdf/") ||
      urlLower.includes("view/pdf")
    );
  }

  /**
   * Download and extract text from a PDF using pdfjs-dist directly
   */
  private async extractPdfContent(url: string): Promise<{
    content: string;
    title?: string;
    numPages?: number;
  }> {
    let tmpFilePath: string | null = null;

    try {
      // Use direct HTTP fetch instead of Puppeteer for PDFs
      // This avoids HTML wrappers and browser-specific issues
      console.log(`[Scraper] Fetching PDF directly: ${url}`);

      const response = await fetch(url, {
        headers: {
          "User-Agent": this.DEFAULT_USER_AGENT,
          "Accept": "application/pdf,*/*",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const contentType = response.headers.get("content-type");

      console.log(`[Scraper] Downloaded: ${buffer.length} bytes, Content-Type: ${contentType}`);

      // Validate that we got a PDF
      if (!contentType?.includes("pdf") && buffer.length < 1024) {
        throw new Error(`Response doesn't appear to be a PDF. Content-Type: ${contentType}`);
      }

      // Check if buffer starts with PDF magic bytes (%PDF-)
      const pdfHeader = buffer.toString("utf-8", 0, 5);
      if (!pdfHeader.startsWith("%PDF")) {
        console.error(`[Scraper] Invalid PDF header: ${buffer.toString("utf-8", 0, 100)}`);
        throw new Error("Downloaded content is not a valid PDF file");
      }

      // Create a temporary file to save the PDF
      const tmpDir = os.tmpdir();
      const tmpFileName = `pdf-${Date.now()}-${Math.random().toString(36).substring(7)}.pdf`;
      tmpFilePath = path.join(tmpDir, tmpFileName);

      // Write the PDF buffer to the temp file
      await fs.promises.writeFile(tmpFilePath, buffer);

      // Read the file as Uint8Array for pdfjs
      const data = new Uint8Array(buffer);

      // Load PDF document using pdfjs-dist
      const loadingTask = pdfjsLib.getDocument({
        data,
        verbosity: 0, // Suppress warnings
        standardFontDataUrl: undefined, // Don't load standard fonts
      });

      const pdfDocument = await loadingTask.promise;
      const numPages = pdfDocument.numPages;

      console.log(`[Scraper] PDF loaded: ${numPages} pages`);

      // Extract text from all pages
      const textPromises = [];
      for (let pageNum = 1; pageNum <= numPages; pageNum++) {
        textPromises.push(
          pdfDocument.getPage(pageNum).then(async (page) => {
            const textContent = await page.getTextContent();
            return textContent.items
              .map((item: any) => item.str)
              .join(" ");
          }),
        );
      }

      const pageTexts = await Promise.all(textPromises);
      const content = pageTexts
        .join("\n\n")
        .replace(/\s+/g, " ")
        .trim();

      if (!content || content.length < 100) {
        throw new Error(`Insufficient content extracted: only ${content.length} characters`);
      }

      // Extract metadata
      const metadata = await pdfDocument.getMetadata();
      const title = metadata.info?.Title;

      console.log(`[Scraper] Successfully extracted ${content.length} characters from ${numPages} page(s)`);

      // Clean up
      await pdfDocument.destroy();

      return {
        content,
        title: title || undefined,
        numPages,
      };
    } catch (error) {
      console.error(`[Scraper] PDF extraction error:`, error);
      throw new Error(
        `Failed to extract PDF content: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    } finally {
      // Clean up: Delete the temporary file
      if (tmpFilePath) {
        try {
          await fs.promises.unlink(tmpFilePath);
          console.log(`[Scraper] Deleted temp PDF file: ${tmpFilePath}`);
        } catch (unlinkError) {
          console.error(
            `[Scraper] Failed to delete temp file ${tmpFilePath}:`,
            unlinkError,
          );
        }
      }
    }
  }

  /**
   * Scrape external article content from a URL
   */
  async scrapeExternalArticle(
    url: string,
    options: ScraperOptions = {},
  ): Promise<ScrapeResult> {
    const timeout = options.timeout || this.DEFAULT_TIMEOUT;
    const userAgent = options.userAgent || this.DEFAULT_USER_AGENT;

    let page;
    try {
      // Validate URL
      const parsedUrl = new URL(url);
      if (!["http:", "https:"].includes(parsedUrl.protocol)) {
        return {
          success: false,
          error: "Invalid URL protocol. Only HTTP and HTTPS are supported.",
        };
      }

      // Check if URL points to a PDF
      if (this.isPdfUrl(url)) {
        try {
          const pdfContent = await this.extractPdfContent(url);

          if (pdfContent.content.length < 100) {
            return {
              success: false,
              error: "Insufficient content extracted from PDF.",
            };
          }

          return {
            success: true,
            content: pdfContent.content,
            title: pdfContent.title,
            contentType: "pdf",
          };
        } catch (error) {
          return {
            success: false,
            error:
              error instanceof Error
                ? error.message
                : "Failed to extract PDF content",
          };
        }
      }

      const browser = await this.getBrowser();
      page = await browser.newPage();

      // Set user agent
      await page.setUserAgent(userAgent);

      // Set viewport
      await page.setViewport({ width: 1920, height: 1080 });

      // Navigate to URL
      await page.goto(url, {
        waitUntil: "networkidle2",
        timeout,
      });

      // Wait for specific selector if provided
      if (options.waitForSelector) {
        await page.waitForSelector(options.waitForSelector, { timeout: 10000 });
      }

      // Get the full HTML content from the page
      const html = await page.content();

      // Extract metadata using page.evaluate
      const metadata = await page.evaluate(() => {
        // Try to find authors (common meta tags and selectors)
        const authors: string[] = [];

        // Check meta tags
        const authorMeta = document.querySelector('meta[name="author"]');
        if (authorMeta) {
          const content = authorMeta.getAttribute("content");
          if (content) authors.push(content);
        }

        // Check common author selectors
        const authorElements = document.querySelectorAll(
          '.author, [class*="author"], [rel="author"], [itemprop="author"]',
        );
        authorElements.forEach((el) => {
          const text = el.textContent?.trim();
          if (text && !authors.includes(text)) {
            authors.push(text);
          }
        });

        return { authors };
      });

      // Use Readability to extract clean article content
      const extracted = this.extractMainContent(html, url);

      // Use the extracted content
      const cleanContent = extracted.content;

      // Check if we got meaningful content
      if (cleanContent.length < 100) {
        return {
          success: false,
          error: "Insufficient content extracted. The page might require JavaScript or have restricted access.",
        };
      }

      return {
        success: true,
        content: cleanContent,
        title: extracted.title,
        authors: metadata.authors.length > 0 ? metadata.authors : undefined,
        contentType: "html",
      };
    } catch (error) {
      let errorMessage = "Unknown error occurred while scraping";

      if (error instanceof Error) {
        if (error.message.includes("timeout")) {
          errorMessage = "Timeout: The page took too long to load";
        } else if (error.message.includes("net::ERR")) {
          errorMessage = "Network error: Could not reach the URL";
        } else if (error.message.includes("403") || error.message.includes("401")) {
          errorMessage = "Access denied: The page requires authentication or blocks automated access";
        } else if (error.message.includes("404")) {
          errorMessage = "Page not found (404)";
        } else {
          errorMessage = error.message;
        }
      }

      return {
        success: false,
        error: errorMessage,
      };
    } finally {
      // Close the page
      if (page) {
        await page.close();
      }
    }
  }

  /**
   * Scrape multiple URLs in sequence
   */
  async scrapeBatch(
    urls: string[],
    options: ScraperOptions = {},
  ): Promise<Map<string, ScrapeResult>> {
    const results = new Map<string, ScrapeResult>();

    for (const url of urls) {
      const result = await this.scrapeExternalArticle(url, options);
      results.set(url, result);

      // Add delay between requests to be respectful
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    return results;
  }

  /**
   * Test if a URL is scrapable
   */
  async testUrl(url: string): Promise<{ accessible: boolean; error?: string }> {
    try {
      const browser = await this.getBrowser();
      const page = await browser.newPage();

      const response = await page.goto(url, {
        waitUntil: "networkidle2",
        timeout: 15000,
      });

      await page.close();

      if (response && response.ok()) {
        return { accessible: true };
      } else {
        return {
          accessible: false,
          error: `HTTP ${response?.status() || "unknown"} response`,
        };
      }
    } catch (error) {
      return {
        accessible: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Public helper to extract PDF text (exposed for other services/controllers)
   */
  async extractPdfText(url: string) {
    return this.extractPdfContent(url);
  }
}

// Export singleton instance
export const contentScraperService = new ContentScraperService();
