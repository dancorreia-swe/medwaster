import { db } from "@/db";
import { wikiFiles, type WikiFile, type NewWikiFile } from "@/db/schema/wiki";
import { eq, and, isNull } from "drizzle-orm";
import { join, dirname } from "path";
import { v4 as uuid } from "uuid";
import { existsSync, mkdirSync, writeFileSync, unlinkSync, readFileSync } from "fs";
import { 
  BadRequestError, 
  NotFoundError, 
  InternalServerError,
  BusinessLogicError 
} from "@/lib/errors";

export interface FileUploadData {
  originalName: string;
  buffer: Buffer;
  mimeType: string;
  size: number;
  uploadedBy: string;
  associatedArticleId?: number;
}

export interface FileUploadResult {
  id: number;
  originalName: string;
  url: string;
  mimeType: string;
  fileSize: number;
  storedFilename: string;
}

// Configuration
const STORAGE_PATH = process.env.FILE_STORAGE_PATH || "./uploads/wiki";
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png", 
  "image/gif",
  "image/webp",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

export abstract class FileStorageService {
  /**
   * Initialize storage directory if it doesn't exist
   */
  private static ensureStorageDirectory(): void {
    if (!existsSync(STORAGE_PATH)) {
      mkdirSync(STORAGE_PATH, { recursive: true });
    }
  }

  /**
   * Validate file upload parameters
   */
  private static validateFile(data: FileUploadData): void {
    // Check file size
    if (data.size > MAX_FILE_SIZE) {
      throw new BadRequestError(
        `File size exceeds maximum allowed size of ${MAX_FILE_SIZE / (1024 * 1024)}MB`,
        { maxSize: MAX_FILE_SIZE, actualSize: data.size }
      );
    }

    // Check MIME type
    if (!ALLOWED_MIME_TYPES.includes(data.mimeType)) {
      throw new BadRequestError(
        "File type not allowed",
        { allowedTypes: ALLOWED_MIME_TYPES, actualType: data.mimeType }
      );
    }

    // Check file name
    if (!data.originalName || data.originalName.trim().length === 0) {
      throw new BadRequestError("Original filename is required");
    }

    // Check buffer
    if (!data.buffer || data.buffer.length === 0) {
      throw new BadRequestError("File content is required");
    }
  }

  /**
   * Generate unique stored filename
   */
  private static generateStoredFilename(originalName: string): string {
    const extension = originalName.split('.').pop() || '';
    const uniqueId = uuid();
    return extension ? `${uniqueId}.${extension}` : uniqueId;
  }

  /**
   * Get full file path for stored filename
   */
  private static getFilePath(storedFilename: string): string {
    return join(STORAGE_PATH, storedFilename);
  }

  /**
   * Upload a file to local storage
   */
  static async uploadFile(data: FileUploadData): Promise<FileUploadResult> {
    // Validate input
    this.validateFile(data);

    // Ensure storage directory exists
    this.ensureStorageDirectory();

    // Generate unique filename
    const storedFilename = this.generateStoredFilename(data.originalName);
    const filePath = this.getFilePath(storedFilename);

    try {
      // Write file to disk
      writeFileSync(filePath, data.buffer);

      // Save file metadata to database
      const fileRecord: NewWikiFile = {
        originalName: data.originalName,
        storedFilename,
        mimeType: data.mimeType,
        fileSize: data.size,
        filePath,
        uploadedBy: data.uploadedBy,
        associatedArticleId: data.associatedArticleId || null,
      };

      const [inserted] = await db.insert(wikiFiles).values(fileRecord).returning();

      return {
        id: inserted.id,
        originalName: inserted.originalName,
        url: `/api/wiki/files/${inserted.id}`,
        mimeType: inserted.mimeType,
        fileSize: inserted.fileSize,
        storedFilename: inserted.storedFilename,
      };
    } catch (error) {
      // Cleanup file if database insertion fails
      try {
        if (existsSync(filePath)) {
          unlinkSync(filePath);
        }
      } catch (cleanupError) {
        console.error("Failed to cleanup file after DB error:", cleanupError);
      }

      if (error instanceof Error) {
        throw new InternalServerError(`File upload failed: ${error.message}`);
      }
      throw new InternalServerError("File upload failed");
    }
  }

  /**
   * Get file by ID
   */
  static async getFileById(id: number): Promise<WikiFile> {
    const file = await db.query.wikiFiles.findFirst({
      where: eq(wikiFiles.id, id),
    });

    if (!file) {
      throw new NotFoundError(`File with ID ${id}`);
    }

    return file;
  }

  /**
   * Get file content for serving
   */
  static async getFileContent(id: number): Promise<{ file: WikiFile; content: Buffer }> {
    const file = await this.getFileById(id);

    try {
      const content = readFileSync(file.filePath);
      return { file, content };
    } catch (error) {
      throw new NotFoundError("File content not found on disk");
    }
  }

  /**
   * Delete file (both from disk and database)
   */
  static async deleteFile(id: number, deletedBy: string): Promise<void> {
    const file = await this.getFileById(id);

    // Check if file is still referenced by articles
    if (file.associatedArticleId) {
      throw new BusinessLogicError(
        "Cannot delete file that is still associated with an article",
        "FILE_STILL_REFERENCED"
      );
    }

    try {
      // Delete from database first
      await db.delete(wikiFiles).where(eq(wikiFiles.id, id));

      // Delete from disk
      if (existsSync(file.filePath)) {
        unlinkSync(file.filePath);
      }
    } catch (error) {
      if (error instanceof Error) {
        throw new InternalServerError(`File deletion failed: ${error.message}`);
      }
      throw new InternalServerError("File deletion failed");
    }
  }

  /**
   * Associate file with article
   */
  static async associateWithArticle(fileId: number, articleId: number): Promise<WikiFile> {
    const [updated] = await db
      .update(wikiFiles)
      .set({ 
        associatedArticleId: articleId,
        updatedAt: new Date(),
      })
      .where(eq(wikiFiles.id, fileId))
      .returning();

    if (!updated) {
      throw new NotFoundError(`File with ID ${fileId}`);
    }

    return updated;
  }

  /**
   * Get files by article ID
   */
  static async getFilesByArticleId(articleId: number): Promise<WikiFile[]> {
    return await db.query.wikiFiles.findMany({
      where: eq(wikiFiles.associatedArticleId, articleId),
      orderBy: (files, { desc }) => [desc(files.createdAt)],
    });
  }

  /**
   * Get orphaned files (not associated with any article)
   */
  static async getOrphanedFiles(): Promise<WikiFile[]> {
    return await db.query.wikiFiles.findMany({
      where: isNull(wikiFiles.associatedArticleId),
      orderBy: (files, { desc }) => [desc(files.createdAt)],
    });
  }

  /**
   * Cleanup orphaned files older than specified days
   */
  static async cleanupOrphanedFiles(olderThanDays: number = 7): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const orphanedFiles = await db.query.wikiFiles.findMany({
      where: and(
        isNull(wikiFiles.associatedArticleId),
        // TODO: Add created_at < cutoffDate filter when the comparison operators are available
      ),
    });

    let deletedCount = 0;
    for (const file of orphanedFiles) {
      if (new Date(file.createdAt) < cutoffDate) {
        try {
          await this.deleteFile(file.id, "system");
          deletedCount++;
        } catch (error) {
          console.error(`Failed to delete orphaned file ${file.id}:`, error);
        }
      }
    }

    return deletedCount;
  }

  /**
   * Get storage statistics
   */
  static async getStorageStats(): Promise<{
    totalFiles: number;
    totalSize: number;
    filesByType: Record<string, number>;
    orphanedFiles: number;
  }> {
    const files = await db.query.wikiFiles.findMany();
    
    const stats = {
      totalFiles: files.length,
      totalSize: files.reduce((sum, file) => sum + file.fileSize, 0),
      filesByType: {} as Record<string, number>,
      orphanedFiles: files.filter(f => !f.associatedArticleId).length,
    };

    // Group by MIME type
    files.forEach(file => {
      stats.filesByType[file.mimeType] = (stats.filesByType[file.mimeType] || 0) + 1;
    });

    return stats;
  }
}