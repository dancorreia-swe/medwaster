import { useState } from "react";
import { useDrag, useDrop, DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { GripVertical, ArrowUpDown, Save } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Trail } from "../types";

const ITEM_TYPE = "TRAIL_ORDER";

interface TrailOrderItemProps {
  trail: Trail;
  index: number;
  onMove: (dragIndex: number, hoverIndex: number) => void;
}

function TrailOrderItem({ trail, index, onMove }: TrailOrderItemProps) {
  const [{ isDragging }, drag, preview] = useDrag({
    type: ITEM_TYPE,
    item: { index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [, drop] = useDrop({
    accept: ITEM_TYPE,
    hover: (item: { index: number }) => {
      if (item.index !== index) {
        onMove(item.index, index);
        item.index = index;
      }
    },
  });

  const difficultyConfig = {
    basic: { label: "Básico", variant: "secondary" as const },
    intermediate: { label: "Intermediário", variant: "default" as const },
    advanced: { label: "Avançado", variant: "destructive" as const },
  };

  const difficulty = difficultyConfig[trail.difficulty];

  return (
    <div
      ref={(node) => preview(drop(node))}
      style={{
        opacity: isDragging ? 0.5 : 1,
      }}
      className="flex items-center gap-3 p-3 bg-card border rounded-lg hover:bg-accent transition-colors"
    >
      <div
        ref={drag}
        className="cursor-move text-muted-foreground hover:text-foreground transition-colors"
      >
        <GripVertical className="h-5 w-5" />
      </div>

      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-semibold">
        {index + 1}
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{trail.name}</p>
        <div className="flex items-center gap-2 mt-1">
          <Badge variant={difficulty.variant} className="text-xs">
            {difficulty.label}
          </Badge>
          {trail.category && (
            <Badge variant="outline" className="text-xs">
              {trail.category.name}
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}

interface TrailOrderManagerProps {
  trails: Trail[];
  onSave: (reorderedTrails: Trail[]) => void;
}

export function TrailOrderManager({ trails, onSave }: TrailOrderManagerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [localTrails, setLocalTrails] = useState<Trail[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

  const handleOpen = () => {
    // Sort trails by current unlockOrder (nulls at end), then by createdAt
    const sorted = [...trails].sort((a, b) => {
      if (a.unlockOrder === null && b.unlockOrder === null) {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      if (a.unlockOrder === null) return 1;
      if (b.unlockOrder === null) return -1;
      return a.unlockOrder - b.unlockOrder;
    });
    setLocalTrails(sorted);
    setHasChanges(false);
    setIsOpen(true);
  };

  const handleMove = (dragIndex: number, hoverIndex: number) => {
    const newTrails = [...localTrails];
    const [removed] = newTrails.splice(dragIndex, 1);
    newTrails.splice(hoverIndex, 0, removed);
    setLocalTrails(newTrails);
    setHasChanges(true);
  };

  const handleSave = () => {
    onSave(localTrails);
    setIsOpen(false);
  };

  const handleCancel = () => {
    setLocalTrails([]);
    setHasChanges(false);
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => (open ? handleOpen() : handleCancel())}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <ArrowUpDown className="mr-2 h-4 w-4" />
          Ordenar Trilhas
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Ordenar Trilhas</DialogTitle>
          <DialogDescription>
            Arraste e solte as trilhas para definir a ordem de desbloqueio. A ordem
            será salva como números sequenciais (1, 2, 3...).
          </DialogDescription>
        </DialogHeader>

        <DndProvider backend={HTML5Backend}>
          <ScrollArea className="h-[500px] pr-4">
            <div className="space-y-2">
              {localTrails.map((trail, index) => (
                <TrailOrderItem
                  key={trail.id}
                  trail={trail}
                  index={index}
                  onMove={handleMove}
                />
              ))}
            </div>
          </ScrollArea>
        </DndProvider>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={!hasChanges}>
            <Save className="mr-2 h-4 w-4" />
            Salvar Ordem
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
