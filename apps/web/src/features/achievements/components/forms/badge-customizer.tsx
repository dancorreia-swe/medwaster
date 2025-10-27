import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { HexColorPicker, HexColorInput } from "react-colorful";
import { UseFormReturn } from "react-hook-form";
import { AchievementFormData } from "./types";
import * as LucideIcons from "lucide-react";
import { useState } from "react";

interface BadgeCustomizerProps {
  form: UseFormReturn<AchievementFormData>;
}

const commonIcons = [
  "trophy", "award", "star", "medal", "crown", "target",
  "zap", "flame", "sparkles", "heart", "shield", "gem",
  "rocket", "check-circle", "flag", "graduation-cap"
];

export function BadgeCustomizer({ form }: BadgeCustomizerProps) {
  const { register, watch, setValue } = form;
  const [iconSearchOpen, setIconSearchOpen] = useState(false);
  
  const badgeIcon = watch("badgeIcon") || "trophy";
  const badgeColor = watch("badgeColor") || "#fbbf24";
  
  const Icon = (LucideIcons as any)[
    badgeIcon.split("-").map((s, i) => 
      i === 0 ? s.charAt(0).toUpperCase() + s.slice(1) : 
      s.charAt(0).toUpperCase() + s.slice(1)
    ).join("")
  ] || LucideIcons.Trophy;

  return (
    <div className="space-y-4">
      {/* Preview */}
      <div className="rounded-lg border p-6">
        <div className="flex items-center justify-center">
          <div 
            className="flex h-24 w-24 items-center justify-center rounded-full"
            style={{ backgroundColor: badgeColor + "20" }}
          >
            <Icon className="h-12 w-12" style={{ color: badgeColor }} />
          </div>
        </div>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          Pré-visualização do Badge
        </p>
      </div>

      {/* Icon Selector */}
      <div className="space-y-2">
        <Label htmlFor="badgeIcon">Ícone do Badge</Label>
        <Popover open={iconSearchOpen} onOpenChange={setIconSearchOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-full justify-start">
              <Icon className="mr-2 h-4 w-4" />
              {badgeIcon}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="start">
            <div className="space-y-2">
              <Input
                placeholder="Buscar ícone..."
                value={badgeIcon}
                onChange={(e) => setValue("badgeIcon", e.target.value, { shouldDirty: true })}
              />
              <div className="grid max-h-60 grid-cols-4 gap-2 overflow-y-auto">
                {commonIcons.map((iconName) => {
                  const IconComponent = (LucideIcons as any)[
                    iconName.split("-").map((s) => 
                      s.charAt(0).toUpperCase() + s.slice(1)
                    ).join("")
                  ];
                  if (!IconComponent) return null;
                  
                  return (
                    <button
                      key={iconName}
                      type="button"
                      onClick={() => {
                        setValue("badgeIcon", iconName, { shouldDirty: true });
                        setIconSearchOpen(false);
                      }}
                      className={`flex aspect-square items-center justify-center rounded-md border hover:bg-accent ${
                        badgeIcon === iconName ? "border-primary bg-accent" : ""
                      }`}
                    >
                      <IconComponent className="h-5 w-5" />
                    </button>
                  );
                })}
              </div>
            </div>
          </PopoverContent>
        </Popover>
        <p className="text-xs text-muted-foreground">
          Escolha um ícone do Lucide Icons ou digite o nome
        </p>
      </div>

      {/* Color Picker */}
      <div className="space-y-2">
        <Label htmlFor="badgeColor">Cor do Badge</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-full justify-start">
              <div 
                className="mr-2 h-4 w-4 rounded border"
                style={{ backgroundColor: badgeColor }}
              />
              {badgeColor.toUpperCase()}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-3" align="start">
            <div className="space-y-3">
              <HexColorPicker
                color={badgeColor}
                onChange={(color) => setValue("badgeColor", color, { shouldDirty: true })}
                style={{ width: "200px", height: "150px" }}
              />
              <HexColorInput
                color={badgeColor}
                onChange={(color) => setValue("badgeColor", color, { shouldDirty: true })}
                prefixed
                className="w-full rounded-md border px-3 py-2 text-sm"
              />
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
