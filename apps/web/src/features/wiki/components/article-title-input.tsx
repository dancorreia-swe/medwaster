import { Button } from "@/components/ui/button";
import {
  EmojiPicker,
  EmojiPickerContent,
  EmojiPickerFooter,
  EmojiPickerSearch,
} from "@/components/ui/emoji-picker";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScanHeart } from "lucide-react";
import React from "react";

interface ArticleTitleInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  icon?: string;
  onIconChange?: (icon: string) => void;
}

export function ArticleTitleInput({
  value,
  onChange,
  placeholder = "Título do artigo",
  icon,
  onIconChange,
}: ArticleTitleInputProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <div className="relative">
      <div className="flex items-start gap-3">
        {onIconChange && (
          <Popover onOpenChange={setIsOpen} open={isOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon-lg"
                className="mt-2 transition-colors hover:bg-muted"
              >
                {icon ? (
                  <span className="text-3xl leading-none">{icon}</span>
                ) : (
                  <ScanHeart className="size-6" />
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-fit p-0" align="start" sideOffset={12}>
              <EmojiPicker
                className="h-[342px]"
                onEmojiSelect={({ emoji }) => {
                  onIconChange?.(emoji);
                  setIsOpen(false);
                }}
              >
                <EmojiPickerSearch placeholder="Pesquisar..." />
                <EmojiPickerContent />
                <EmojiPickerFooter />
              </EmojiPicker>
            </PopoverContent>
          </Popover>
        )}
        <div className="flex-1">
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full resize-none bg-transparent text-4xl font-bold leading-tight outline-none placeholder:text-muted-foreground/40 focus:placeholder:text-muted-foreground/60 transition-colors py-1 [field-sizing:content] break-words"
            placeholder={placeholder}
            autoFocus
            rows={1}
          />
          {value.length > 0 && (
            <div className="mt-1 text-xs text-muted-foreground">
              {value.length} caracteres
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
