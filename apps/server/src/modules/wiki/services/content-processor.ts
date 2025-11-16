// Content processing utilities for BlockNote editor content
interface BlockNoteBlock {
  type: string;
  props?: Record<string, any>;
  content?: BlockNoteBlock[];
  children?: BlockNoteBlock[];
}

interface BlockNoteContent {
  type: string;
  content?: BlockNoteBlock[];
}

export class ContentProcessor {
  /**
   * Decode HTML entities in a string
   * Converts entities like &#x20; (space) and &#97; (a) to their actual characters
   */
  static decodeHTMLEntities(text: string): string {
    return text
      .replace(/&#x([0-9A-Fa-f]+);/g, (_, hex) =>
        String.fromCharCode(parseInt(hex, 16))
      )
      .replace(/&#(\d+);/g, (_, dec) =>
        String.fromCharCode(parseInt(dec, 10))
      )
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&'); // Must be last to avoid double-decoding
  }

  /**
   * Extract plain text from BlockNote JSON content for search indexing
   */
  static extractPlainText(content: any): string {
    if (!content || typeof content !== "object") {
      return "";
    }

    let text = "";

    const extractFromBlock = (block: any): string => {
      if (!block || typeof block !== "object") return "";

      let blockText = "";

      // Handle different block types
      if (block.type) {
        switch (block.type) {
          case "paragraph":
          case "heading":
            // Extract text from inline content
            if (block.content && Array.isArray(block.content)) {
              blockText = block.content
                .map((item: any) => item.text || "")
                .join("");
            }
            break;

          case "bulletListItem":
          case "numberedListItem":
          case "checkListItem":
            // Extract text from list items
            if (block.content && Array.isArray(block.content)) {
              blockText = block.content
                .map((item: any) => item.text || "")
                .join("");
            }
            break;

          case "table":
            // Extract text from table cells
            if (block.content && Array.isArray(block.content)) {
              blockText = block.content
                .map((row: any) => {
                  if (row.content && Array.isArray(row.content)) {
                    return row.content
                      .map((cell: any) => {
                        if (cell.content && Array.isArray(cell.content)) {
                          return cell.content
                            .map((cellContent: any) =>
                              extractFromBlock(cellContent),
                            )
                            .join(" ");
                        }
                        return "";
                      })
                      .join(" ");
                  }
                  return "";
                })
                .join(" ");
            }
            break;

          case "codeBlock":
            // Extract code content
            if (block.props && block.props.code) {
              blockText = block.props.code;
            }
            break;

          default:
            // Handle custom blocks (procedure, alert, equipment, etc.)
            if (block.props) {
              if (block.props.title) blockText += block.props.title + " ";
              if (block.props.content) blockText += block.props.content + " ";
              if (block.props.steps && Array.isArray(block.props.steps)) {
                blockText += block.props.steps.join(" ") + " ";
              }
              if (
                block.props.safety_notes &&
                Array.isArray(block.props.safety_notes)
              ) {
                blockText += block.props.safety_notes.join(" ") + " ";
              }
              if (block.props.items && Array.isArray(block.props.items)) {
                blockText +=
                  block.props.items
                    .map((item: any) => item.name || item.description || "")
                    .join(" ") + " ";
              }
            }
        }
      }

      // Handle direct text content
      if (block.text) {
        blockText += block.text;
      }

      // Recursively process children/content
      if (block.children && Array.isArray(block.children)) {
        blockText += " " + block.children.map(extractFromBlock).join(" ");
      }
      if (block.content && Array.isArray(block.content)) {
        blockText += " " + block.content.map(extractFromBlock).join(" ");
      }

      return blockText;
    };

    // Handle root content structure
    if (Array.isArray(content)) {
      text = content.map(extractFromBlock).join(" ");
    } else if (content.content && Array.isArray(content.content)) {
      text = content.content.map(extractFromBlock).join(" ");
    } else {
      text = extractFromBlock(content);
    }

    // Clean up the text
    return text
      .replace(/\s+/g, " ") // Replace multiple spaces with single space
      .trim();
  }

  /**
   * Calculate word count from BlockNote content
   */
  static calculateWordCount(content: any): number {
    const plainText = this.extractPlainText(content);
    if (!plainText) return 0;

    // Split by whitespace and filter out empty strings
    const words = plainText.split(/\s+/).filter((word) => word.length > 0);
    return words.length;
  }

  /**
   * Calculate estimated reading time in minutes
   * Based on average reading speed with adjustments for content type
   */
  static calculateReadingTime(content: any): number {
    const wordCount = this.calculateWordCount(content);

    if (wordCount === 0) return 1; // Minimum 1 minute

    // Base reading speed: 200 words per minute
    let wordsPerMinute = 200;

    // Adjust for technical content (medical terminology)
    // Technical content is typically read 15% slower
    wordsPerMinute *= 0.85;

    // Calculate reading time
    let readingTime = wordCount / wordsPerMinute;

    // Round up to nearest minute, minimum 1 minute
    return Math.max(1, Math.ceil(readingTime));
  }

  /**
   * Generate excerpt from content
   */
  static generateExcerpt(content: any, maxLength: number = 150): string {
    const plainText = this.extractPlainText(content);

    if (!plainText) return "";

    if (plainText.length <= maxLength) {
      return plainText;
    }

    const truncated = plainText.substring(0, maxLength);
    const lastSentenceEnd = Math.max(
      truncated.lastIndexOf("."),
      truncated.lastIndexOf("!"),
      truncated.lastIndexOf("?"),
    );

    if (lastSentenceEnd > maxLength * 0.6) {
      return truncated.substring(0, lastSentenceEnd + 1);
    } else {
      const lastSpace = truncated.lastIndexOf(" ");
      if (lastSpace > 0) {
        return truncated.substring(0, lastSpace) + "...";
      } else {
        return truncated + "...";
      }
    }
  }

  /**
   * Extract image URLs from BlockNote content
   */
  static extractImageUrls(content: any): string[] {
    const urls: string[] = [];

    const extractFromBlock = (block: any): void => {
      if (!block || typeof block !== "object") return;

      // Check for image blocks
      if (block.type === "image" && block.props && block.props.url) {
        urls.push(block.props.url);
      }

      // Check for featured images in custom blocks
      if (block.props && block.props.image_url) {
        urls.push(block.props.image_url);
      }

      // Recursively check children
      if (block.children && Array.isArray(block.children)) {
        block.children.forEach(extractFromBlock);
      }
      if (block.content && Array.isArray(block.content)) {
        block.content.forEach(extractFromBlock);
      }
    };

    if (Array.isArray(content)) {
      content.forEach(extractFromBlock);
    } else if (content.content && Array.isArray(content.content)) {
      content.content.forEach(extractFromBlock);
    } else {
      extractFromBlock(content);
    }

    return urls;
  }

  /**
   * Validate BlockNote content structure
   */
  static validateContent(content: any): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
    wordCount: number;
    estimatedReadingTime: number;
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Basic structure validation
    if (!content) {
      errors.push("Content cannot be empty");
    }

    if (typeof content !== "object") {
      errors.push("Content must be a valid BlockNote JSON object");
    }

    // Extract metrics
    const wordCount = this.calculateWordCount(content);
    const estimatedReadingTime = this.calculateReadingTime(content);

    // Content length validation
    if (wordCount < 25) {
      warnings.push("Content is very short (less than 25 words)");
    }

    if (wordCount === 0) {
      errors.push("Content has no readable text");
    }

    // Check for proper structure
    if (content && typeof content === "object") {
      if (!Array.isArray(content) && !content.content) {
        warnings.push(
          "Content structure may be invalid - expected array or object with content property",
        );
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      wordCount,
      estimatedReadingTime,
    };
  }
}

/**
 * Generate URL-friendly slug from title
 */
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFD") // Decompose accented characters
    .replace(/[\u0300-\u036f]/g, "") // Remove accent marks
    .replace(/[^\w\s-]/g, "") // Remove special characters except spaces and hyphens
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/-+/g, "-") // Replace multiple hyphens with single hyphen
    .trim()
    .replace(/^-+|-+$/g, ""); // Remove leading/trailing hyphens
}

/**
 * Ensure slug uniqueness by appending number if needed
 */
export function ensureUniqueSlug(
  baseSlug: string,
  existingSlugs: string[],
): string {
  let slug = baseSlug;
  let counter = 1;

  while (existingSlugs.includes(slug)) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return slug;
}
