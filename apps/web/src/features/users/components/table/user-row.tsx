import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TableCell, TableRow } from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatDate } from "@/lib/utils";
import { getRoleDisplayName } from "@/lib/rbac";
import {
  Ban,
  CheckCircle,
  MailCheck,
  MailX,
  MoreHorizontal,
  Pencil,
  ShieldCheck,
  Trash2,
  UserX,
  Award,
  XCircle,
  Clock8,
} from "lucide-react";

interface UserRowProps {
  user: {
    id: string;
    name: string;
    email: string;
    emailVerified: boolean;
    image?: string | null;
    role?: string | null;
    banned: boolean;
    banReason?: string | null;
    banExpires?: Date | string | null;
    createdAt: Date | string;
    updatedAt: Date | string;
    certificate?: {
      status: "pending" | "approved" | "rejected" | "revoked";
      verificationCode?: string;
    } | null;
  };
  onEdit?: (user: any) => void;
  onDelete?: (user: any) => void;
  onView?: (user: any) => void;
}

export function UserRow({ user, onEdit, onDelete, onView }: UserRowProps) {
  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <TableRow
      className="group hover:bg-muted/50 transition-colors cursor-pointer"
      onClick={() => onView?.(user)}
    >
      <TableCell>
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.image || undefined} alt={user.name} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="font-medium text-foreground">{user.name}</span>
            {user.role && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <ShieldCheck className="h-3 w-3" />
                {getRoleDisplayName(user.role)}
              </span>
            )}
          </div>
        </div>
      </TableCell>

      <TableCell>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">{user.email}</span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    {user.emailVerified ? (
                      <MailCheck className="h-4 w-4 text-green-600" />
                    ) : (
                      <MailX className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  {user.emailVerified
                    ? "Email verificado"
                    : "Email não verificado"}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <CertificateIcon status={user.certificate?.status} />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                {getCertificateTooltip(user.certificate)}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </TableCell>

      <TableCell>
        {user.role ? (
          <Badge variant="outline" className="font-mono text-xs">
            {getRoleDisplayName(user.role)}
          </Badge>
        ) : (
          <span className="text-sm text-muted-foreground">—</span>
        )}
      </TableCell>

      <TableCell>
        {user.banned ? (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge variant="destructive" className="gap-1">
                  <Ban className="h-3 w-3" />
                  Banido
                </Badge>
              </TooltipTrigger>
              {user.banReason && (
                <TooltipContent>
                  <p className="max-w-xs">{user.banReason}</p>
                  {user.banExpires && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Expira em: {formatDate(user.banExpires)}
                    </p>
                  )}
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        ) : (
          <Badge
            variant="outline"
            className="gap-1 text-green-600 border-green-600"
          >
            <CheckCircle className="h-3 w-3" />
            Ativo
          </Badge>
        )}
      </TableCell>

      <TableCell>
        <span className="text-sm text-muted-foreground">
          {formatDate(user.createdAt)}
        </span>
      </TableCell>

      <TableCell onClick={(e) => e.stopPropagation()}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={(event) => event.stopPropagation()}
            >
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">Abrir ações</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem onClick={() => onView?.(user)}>
              <ShieldCheck className="mr-2 h-4 w-4" />
              Ver detalhes
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEdit?.(user)}>
              <Pencil className="mr-2 h-4 w-4" />
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDelete?.(user)}>
              <Trash2 className="mr-2 h-4 w-4" />
              Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}

const certificateIconConfig = {
  approved: { icon: Award, className: "text-blue-600" },
  pending: { icon: Clock8, className: "text-amber-500" },
  rejected: { icon: XCircle, className: "text-red-500" },
  revoked: { icon: XCircle, className: "text-red-500" },
} as const;

function CertificateIcon({ status }: { status?: string }) {
  if (!status) {
    return <XCircle className="h-4 w-4 text-muted-foreground/60" />;
  }
  const config =
    certificateIconConfig[status as keyof typeof certificateIconConfig];
  const Icon = config?.icon ?? XCircle;
  return (
    <Icon
      className={`h-4 w-4 ${config?.className ?? "text-muted-foreground"}`}
    />
  );
}

function getCertificateTooltip(
  certificate?: { status?: string; verificationCode?: string } | null,
) {
  if (!certificate?.status) {
    return "Certificado ainda não solicitado";
  }

  const labels: Record<string, string> = {
    pending: "Certificado em revisão",
    approved: "Certificado aprovado",
    rejected: "Certificado rejeitado",
    revoked: "Certificado revogado",
  };

  const label = labels[certificate.status] ?? "Status desconhecido";
  if (certificate.verificationCode) {
    return `${label} - ${certificate.verificationCode}`;
  }
  return label;
}
