import { useState } from "react";
import { useDrag, useDrop, DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { GripVertical, ArrowUpDown, Save, EyeOff } from "lucide-react";

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
import type { Achievement } from "@server/db/schema/achievements";

const ITEM_TYPE = "ACHIEVEMENT_ORDER";

interface AchievementOrderItemProps {
  achievement: Achievement;
  index: number;
  onMove: (dragIndex: number, hoverIndex: number) => void;
}

const statusLabels = {
  active: "Ativo",
  inactive: "Inativo",
  archived: "Arquivado",
};

const difficultyLabels = {
  easy: "Fácil",
  medium: "Médio",
  hard: "Difícil",
};

function AchievementOrderItem({ achievement, index, onMove }: AchievementOrderItemProps) {
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

  return (
    <div
      ref={(node) => preview(drop(node))}
      style={{ opacity: isDragging ? 0.5 : 1 }}
      className="flex items-center gap-3 rounded-lg border bg-card p-3 hover:bg-accent transition-colors"
    >
      <div
        ref={drag}
        className="cursor-move text-muted-foreground hover:text-foreground transition-colors"
      >
        <GripVertical className="h-5 w-5" />
      </div>

      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-semibold">
        {index + 1}
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-medium">{achievement.name}</p>
          {achievement.isSecret && (
            <Badge variant="outline" className="text-[10px] gap-1">
              <EyeOff className="h-3 w-3" />
              Secreto
            </Badge>
          )}
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="text-[10px]">
            {statusLabels[achievement.status as keyof typeof statusLabels] ??
              achievement.status}
          </Badge>
          <Badge variant="outline" className="text-[10px]">
            {difficultyLabels[achievement.difficulty as keyof typeof difficultyLabels] ??
              achievement.difficulty}
          </Badge>
        </div>
      </div>
    </div>
  );
}

interface AchievementOrderManagerProps {
  achievements: Achievement[];
  onSave: (reorderedAchievements: Achievement[]) => void;
}

export function AchievementOrderManager({
  achievements,
  onSave,
}: AchievementOrderManagerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [localAchievements, setLocalAchievements] = useState<Achievement[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

  const handleOpen = () => {
    const sorted = [...achievements].sort((a, b) => {
      const aOrder = a.displayOrder ?? Number.MAX_SAFE_INTEGER;
      const bOrder = b.displayOrder ?? Number.MAX_SAFE_INTEGER;
      if (aOrder === bOrder) {
        return a.name.localeCompare(b.name);
      }
      return aOrder - bOrder;
    });
    setLocalAchievements(sorted);
    setHasChanges(false);
    setIsOpen(true);
  };

  const handleMove = (dragIndex: number, hoverIndex: number) => {
    setLocalAchievements((prev) => {
      const updated = [...prev];
      const [removed] = updated.splice(dragIndex, 1);
      updated.splice(hoverIndex, 0, removed);
      return updated;
    });
    setHasChanges(true);
  };

  const handleSave = () => {
    onSave(localAchievements);
    setIsOpen(false);
  };

  const handleCancel = () => {
    setLocalAchievements([]);
    setHasChanges(false);
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => (open ? handleOpen() : handleCancel())}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <ArrowUpDown className="mr-2 h-4 w-4" />
          Ordenar Conquistas
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Ordenar Conquistas</DialogTitle>
          <DialogDescription>
            Arraste e solte as conquistas para definir a ordem de exibição. A ordem será salva de forma sequencial.
          </DialogDescription>
        </DialogHeader>

        <DndProvider backend={HTML5Backend}>
          <ScrollArea className="h-[500px] pr-4">
            <div className="space-y-2">
              {localAchievements.map((achievement, index) => (
                <AchievementOrderItem
                  key={achievement.id}
                  achievement={achievement}
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
