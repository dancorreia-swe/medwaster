import { useState, useRef, useEffect } from "react";
import { Upload, X, Image as ImageIcon, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { client } from "@/lib/client";
import { getApiUrl } from "@/lib/env";

interface ImageData {
  url: string;
  key: string;
}

interface ImageUploadProps {
  value?: string;
  onChange: (data: ImageData | null) => void;
  disabled?: boolean;
  className?: string;
  label?: string;
  uploadPath?: string; // custom endpoint; defaults to questions upload
  keyValue?: string;
  deletePath?: string; // optional delete endpoint (without trailing key)
}

export function ImageUpload({
  value,
  onChange,
  disabled,
  className,
  label = "Imagem da Questão",
  uploadPath = "/api/admin/questions/images/upload",
  keyValue,
  deletePath,
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(value || null);
  const [imageError, setImageError] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Update preview when value prop changes (important for editing)
  useEffect(() => {
    setPreview(value || null);
    setImageError(false);
  }, [value]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml"];
    if (!validTypes.includes(file.type)) {
      toast.error("Tipo de arquivo inválido. Use: JPG, PNG, GIF, WebP ou SVG");
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Arquivo muito grande. Tamanho máximo: 5MB");
      return;
    }

    setImageError(false);
    setIsUploading(true);

    try {
      // Create FormData
      const formData = new FormData();
      formData.append("image", file);

      // Upload using fetch directly since Elysia client might not support FormData well
      const response = await fetch(`${getApiUrl()}${uploadPath}`, {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const result = await response.json();
      const imageUrl = result.data.url;
      const imageKey = result.data.key;

      // Set preview
      setPreview(imageUrl);

      // Update form value with both URL and key
      onChange({ url: imageUrl, key: imageKey });

      toast.success("Imagem enviada com sucesso!");
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Erro ao enviar imagem. Tente novamente.");
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemove = () => {
    const maybeDelete = async () => {
      if (!deletePath || !keyValue) return;
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL || "http://localhost:3000"}${deletePath}/${encodeURIComponent(keyValue)}`,
          { method: "DELETE", credentials: "include" },
        );
        if (!response.ok) {
          console.error("Failed to delete image key", keyValue);
        }
      } catch (error) {
        console.error("Delete image error:", error);
      }
    };
    void maybeDelete();

    setPreview(null);
    onChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={cn("space-y-2", className)}>
      <Label>{label}</Label>
      
      <div className="flex flex-col gap-2">
        {preview && !imageError ? (
          <div className="relative w-full max-w-md">
            <img
              src={preview}
              alt="Preview"
              className="w-full h-auto rounded-lg border border-border"
              onError={() => {
                console.error("Failed to load image:", preview);
                setImageError(true);
              }}
            />
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2"
              onClick={handleRemove}
              disabled={disabled || isUploading}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : imageError ? (
          <div className="relative w-full max-w-md p-8 border-2 border-dashed border-destructive rounded-lg">
            <div className="flex flex-col items-center gap-2">
              <AlertCircle className="h-8 w-8 text-destructive" />
              <p className="text-sm text-destructive">Erro ao carregar imagem</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleRemove}
                disabled={disabled || isUploading}
              >
                Remover
              </Button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleClick}
            disabled={disabled || isUploading}
            className={cn(
              "relative flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-colors",
              "hover:bg-accent hover:border-accent-foreground/50",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            )}
          >
            {isUploading ? (
              <>
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                <p className="mt-2 text-sm text-muted-foreground">Enviando...</p>
              </>
            ) : (
              <>
                <Upload className="h-8 w-8 text-muted-foreground" />
                <p className="mt-2 text-sm text-muted-foreground">
                  Clique para enviar uma imagem
                </p>
                <p className="text-xs text-muted-foreground">
                  PNG, JPG, GIF, WebP ou SVG (máx. 5MB)
                </p>
              </>
            )}
          </button>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml"
          onChange={handleFileChange}
          className="hidden"
          disabled={disabled || isUploading}
        />
      </div>

      <p className="text-xs text-muted-foreground">
        Imagem opcional para acompanhar a questão (diagramas, ilustrações, etc.)
      </p>
    </div>
  );
}
