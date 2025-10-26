import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  ColorPicker,
  ColorPickerSelection,
  ColorPickerHue,
  ColorPickerPreview,
  ColorPickerEyeDropper,
} from "@/components/ui/shadcn-io/color-picker";
import { Palette } from "lucide-react";

interface CategoryColorPickerProps {
  color: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onChange: (rgba: number[] | string) => void;
  onStopPropagation: (e: React.MouseEvent) => void;
}

export function CategoryColorPicker({
  color,
  isOpen,
  onOpenChange,
  onChange,
  onStopPropagation,
}: CategoryColorPickerProps) {
  return (
    <Popover open={isOpen} onOpenChange={onOpenChange}>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="h-5 w-5 rounded-full border-2 border-border hover:border-primary transition-colors cursor-pointer shrink-0 relative group"
                style={{ backgroundColor: color }}
                onClick={onStopPropagation}
              >
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 rounded-full">
                  <Palette className="h-3 w-3 text-white" />
                </div>
              </button>
            </PopoverTrigger>
          </TooltipTrigger>
          <TooltipContent>
            <p>Clique para alterar a cor</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <PopoverContent
        className="w-56 p-4"
        align="start"
        onClick={onStopPropagation}
      >
        <ColorPicker
          defaultValue={color}
          onChange={onChange}
          className="w-full"
        >
          <div className="space-y-3">
            <ColorPickerSelection className="h-32 w-full rounded-md" />
            <ColorPickerHue className="w-full" />
            <div className="flex items-center gap-2">
              <ColorPickerEyeDropper />
              <ColorPickerPreview
                label="Cor selecionada"
                className="w-full"
              />
            </div>
          </div>
        </ColorPicker>
      </PopoverContent>
    </Popover>
  );
}
