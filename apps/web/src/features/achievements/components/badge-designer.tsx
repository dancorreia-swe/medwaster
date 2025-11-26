import { useState, useEffect } from "react";
import { Upload, Search, Trophy, X } from "lucide-react";
import * as LucideIcons from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { getApiUrl } from "@/lib/env";

interface BadgeDesignerProps {
  badgeIcon: string;
  badgeColor: string;
  badgeImageUrl?: string;
  onBadgeIconChange: (icon: string) => void;
  onBadgeColorChange: (color: string) => void;
  onBadgeImageUrlChange: (url: string | undefined) => void;
}

type BadgeMode = "icon" | "image";

// Popular achievement icons
const popularIcons = [
  "trophy",
  "award",
  "medal",
  "star",
  "crown",
  "target",
  "zap",
  "flame",
  "gem",
  "shield",
  "heart",
  "thumbs-up",
  "check-circle",
  "sparkles",
  "rocket",
  "graduation-cap",
  "book-open",
  "brain",
  "lightbulb",
  "coffee",
];

export function BadgeDesigner({
  badgeIcon,
  badgeColor,
  badgeImageUrl,
  onBadgeIconChange,
  onBadgeColorChange,
  onBadgeImageUrlChange,
}: BadgeDesignerProps) {
  const [mode, setMode] = useState<BadgeMode>(badgeImageUrl ? "image" : "icon");
  const [iconSearch, setIconSearch] = useState("");

  // Update mode when badgeImageUrl changes (for edit mode)
  useEffect(() => {
    setMode(badgeImageUrl ? "image" : "icon");
  }, [badgeImageUrl]);

  // Get the current icon component
  const CurrentIcon = (LucideIcons as any)[
    badgeIcon
      .split("-")
      .map((s, i) =>
        i === 0
          ? s.charAt(0).toUpperCase() + s.slice(1)
          : s.charAt(0).toUpperCase() + s.slice(1)
      )
      .join("")
  ] || Trophy;

  const handleModeChange = (newMode: BadgeMode) => {
    setMode(newMode);
    if (newMode === "icon") {
      onBadgeImageUrlChange(undefined);
    }
  };

  const handleIconSelect = (iconName: string) => {
    onBadgeIconChange(iconName);
  };

  const [isUploading, setIsUploading] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Por favor, selecione um arquivo de imagem válido");
      e.target.value = ""; // Reset input
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("O arquivo deve ter no máximo 5MB");
      e.target.value = ""; // Reset input
      return;
    }

    setIsUploading(true);

    try {
      // Upload to S3 via the achievements images endpoint
      const formData = new FormData();
      formData.append("image", file);

      const response = await fetch(
        `${getApiUrl()}/admin/achievements/images/upload`,
        {
          method: "POST",
          body: formData,
          credentials: "include",
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Upload failed");
      }

      const result = await response.json();

      if (result.success && result.data?.url) {
        onBadgeImageUrlChange(result.data.url);
        toast.success("Imagem carregada com sucesso!");
      } else {
        throw new Error("Invalid response format");
      }
    } catch (error) {
      console.error("Image upload failed:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Falha ao fazer upload da imagem. Tente novamente."
      );
    } finally {
      setIsUploading(false);
      e.target.value = ""; // Reset input so user can upload same file again
    }
  };

  // Filter icons based on search
  const filteredIcons = popularIcons.filter((icon) =>
    icon.toLowerCase().includes(iconSearch.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Preview */}
      <div className="flex items-center justify-between rounded-lg border bg-card p-6">
        <div>
          <Label className="text-base">Pré-visualização</Label>
          <p className="text-sm text-muted-foreground mt-1">
            Visualize como o badge aparecerá
          </p>
        </div>
        <div className="flex flex-col items-center gap-2">
          <div
            className="flex size-20 shrink-0 items-center justify-center rounded-full transition-all"
            style={{ backgroundColor: badgeColor + "20" }}
          >
            {mode === "image" && badgeImageUrl ? (
              <img
                src={badgeImageUrl}
                alt="Badge preview"
                className="h-12 w-12 object-contain"
              />
            ) : (
              <CurrentIcon className="size-12" style={{ color: badgeColor }} />
            )}
          </div>
          <div className="flex items-center gap-2">
            <div
              className="h-4 w-4 rounded-full border"
              style={{ backgroundColor: badgeColor }}
            />
            <span className="text-xs font-mono text-muted-foreground">
              {badgeColor}
            </span>
          </div>
        </div>
      </div>

      {/* Mode Selection */}
      <div className="space-y-4">
        <Label>Tipo de Badge</Label>
        <div className="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => handleModeChange("icon")}
            className={cn(
              "flex items-center gap-3 rounded-lg border-2 p-4 cursor-pointer transition-all text-left",
              mode === "icon"
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/50"
            )}
          >
            <div className={cn(
              "h-4 w-4 rounded-full border-2 flex items-center justify-center flex-shrink-0",
              mode === "icon" ? "border-primary" : "border-muted-foreground"
            )}>
              {mode === "icon" && (
                <div className="h-2 w-2 rounded-full bg-primary" />
              )}
            </div>
            <div className="flex-1">
              <div className="font-medium">Ícone</div>
              <div className="text-xs text-muted-foreground">
                Escolha um ícone da biblioteca
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleModeChange("image")}
            className={cn(
              "flex items-center gap-3 rounded-lg border-2 p-4 cursor-pointer transition-all text-left",
              mode === "image"
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/50"
            )}
          >
            <div className={cn(
              "h-4 w-4 rounded-full border-2 flex items-center justify-center flex-shrink-0",
              mode === "image" ? "border-primary" : "border-muted-foreground"
            )}>
              {mode === "image" && (
                <div className="h-2 w-2 rounded-full bg-primary" />
              )}
            </div>
            <div className="flex-1">
              <div className="font-medium">Imagem</div>
              <div className="text-xs text-muted-foreground">
                Upload de imagem (PNG, JPG, GIF, WebP, SVG)
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Icon Picker */}
      {mode === "icon" && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Ícone Selecionado</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar ícones..."
                value={iconSearch}
                onChange={(e) => setIconSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <ScrollArea className="h-[300px] rounded-md border p-4">
            <div className="grid grid-cols-5 gap-2">
              {filteredIcons.map((iconName) => {
                const IconComponent =
                  (LucideIcons as any)[
                    iconName
                      .split("-")
                      .map((s, i) =>
                        i === 0
                          ? s.charAt(0).toUpperCase() + s.slice(1)
                          : s.charAt(0).toUpperCase() + s.slice(1)
                      )
                      .join("")
                  ] || Trophy;

                const isSelected = iconName === badgeIcon;

                return (
                  <button
                    key={iconName}
                    type="button"
                    onClick={() => handleIconSelect(iconName)}
                    className={cn(
                      "flex flex-col items-center justify-center gap-1 rounded-lg border-2 p-3 transition-all hover:border-primary/50",
                      isSelected
                        ? "border-primary bg-primary/10"
                        : "border-border"
                    )}
                    title={iconName}
                  >
                    <IconComponent className="h-6 w-6" />
                    {isSelected && (
                      <div className="flex items-center justify-center w-full">
                        <div className="h-1 w-full rounded-full bg-primary" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
            {filteredIcons.length === 0 && (
              <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
                Nenhum ícone encontrado
              </div>
            )}
          </ScrollArea>
        </div>
      )}

      {/* Image Upload */}
      {mode === "image" && (
        <div className="space-y-4">
          <Label>Imagem do Badge</Label>
          {badgeImageUrl ? (
            <div className="space-y-3">
              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src={badgeImageUrl}
                      alt="Badge"
                      className="h-12 w-12 object-contain rounded"
                    />
                    <div>
                      <p className="text-sm font-medium">Imagem carregada</p>
                      <p className="text-xs text-muted-foreground">
                        Clique em "Alterar" para trocar
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => onBadgeImageUrlChange(undefined)}
                    disabled={isUploading}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => document.getElementById("badge-upload")?.click()}
                disabled={isUploading}
              >
                <Upload className="mr-2 h-4 w-4" />
                Alterar Imagem
              </Button>
            </div>
          ) : (
            <div
              className={cn(
                "flex flex-col items-center justify-center gap-4 rounded-lg border-2 border-dashed p-8 text-center transition-colors",
                isUploading
                  ? "cursor-not-allowed opacity-50"
                  : "cursor-pointer hover:border-primary/50"
              )}
              onClick={() =>
                !isUploading && document.getElementById("badge-upload")?.click()
              }
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Upload className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">
                  {isUploading ? "Fazendo upload..." : "Clique para fazer upload"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Imagem até 5MB (PNG, JPG, GIF, WebP, SVG)
                </p>
              </div>
            </div>
          )}
          <input
            id="badge-upload"
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml"
            className="hidden"
            onChange={handleImageUpload}
            disabled={isUploading}
          />
        </div>
      )}

      {/* Color Picker */}
      <div className="space-y-4">
        <Label>Cor do Badge</Label>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">Seletor de Cor</Label>
            <div className="flex items-center gap-3">
              <Input
                type="color"
                value={badgeColor}
                onChange={(e) => onBadgeColorChange(e.target.value)}
                className="h-12 w-20 cursor-pointer"
              />
              <Input
                type="text"
                value={badgeColor}
                onChange={(e) => onBadgeColorChange(e.target.value)}
                placeholder="#000000"
                pattern="^#[0-9A-Fa-f]{6}$"
                className="flex-1 font-mono"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">Cores Populares</Label>
            <div className="grid grid-cols-6 gap-2">
              {[
                "#fbbf24", // amber
                "#f59e0b", // yellow
                "#ef4444", // red
                "#ec4899", // pink
                "#8b5cf6", // purple
                "#3b82f6", // blue
                "#06b6d4", // cyan
                "#10b981", // green
                "#84cc16", // lime
                "#f97316", // orange
                "#6366f1", // indigo
                "#a855f7", // violet
              ].map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => onBadgeColorChange(color)}
                  className={cn(
                    "h-9 w-full rounded border-2 transition-all hover:scale-110",
                    color === badgeColor
                      ? "border-foreground ring-2 ring-offset-2"
                      : "border-transparent"
                  )}
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
