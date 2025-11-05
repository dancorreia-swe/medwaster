import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface TrueFalseIconProps {
  className?: string;
  size?: number;
  monochrome?: boolean;
}

export function TrueFalseIcon({ 
  className, 
  size = 20,
  monochrome = false 
}: TrueFalseIconProps) {
  return (
    <div
      className={cn(
        "relative inline-flex items-center justify-center",
        className,
      )}
      style={{ width: size, height: size }}
    >
      {/* Check mark - top right */}
      <Check
        className={cn(
          "absolute",
          monochrome 
            ? "text-foreground" 
            : "text-green-600 dark:text-green-500"
        )}
        size={size * 0.5}
        strokeWidth={2.5}
        style={{
          top: 0,
          right: 0,
        }}
      />

      {/* Diagonal slash - center */}
      <div
        className="absolute bg-foreground"
        style={{
          width: size * 0.8,
          height: 1,
          transform: "rotate(45deg)",
          transformOrigin: "center",
        }}
      />

      {/* X mark - bottom left */}
      <X
        className={cn(
          "absolute",
          monochrome 
            ? "text-foreground" 
            : "text-red-600 dark:text-red-500"
        )}
        size={size * 0.5}
        strokeWidth={2.5}
        style={{
          bottom: 0,
          left: 0,
        }}
      />
    </div>
  );
}
