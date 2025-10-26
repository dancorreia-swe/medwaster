import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface CategoryStatusDropdownProps {
  isActive: boolean;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onStatusChange: (isActive: boolean) => void;
  onStopPropagation: (e: React.MouseEvent) => void;
}

export function CategoryStatusDropdown({
  isActive,
  isOpen,
  onOpenChange,
  onStatusChange,
  onStopPropagation,
}: CategoryStatusDropdownProps) {
  return (
    <DropdownMenu open={isOpen} onOpenChange={onOpenChange}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="cursor-pointer"
          onClick={onStopPropagation}
        >
          <Badge
            variant={isActive ? "default" : "secondary"}
            className="text-xs hover:opacity-80 transition-opacity"
          >
            {isActive ? "Ativa" : "Inativa"}
          </Badge>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" onClick={onStopPropagation}>
        <DropdownMenuItem onClick={() => onStatusChange(true)}>
          Ativa
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onStatusChange(false)}>
          Inativa
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
