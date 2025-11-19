import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Users } from "lucide-react";
import { UserRow } from "./table/user-row";

export interface UserTableItem {
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
}

interface UsersTableProps {
  data: UserTableItem[];
  onEdit?: (user: UserTableItem) => void;
  onDelete?: (user: UserTableItem) => void;
  onView?: (user: UserTableItem) => void;
}

export function UsersTable({
  data,
  onEdit,
  onDelete,
  onView,
}: UsersTableProps) {
  return (
    <div className="rounded-md border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Usuário</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Função</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Criado em</TableHead>
            <TableHead className="w-20">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length ? (
            data.map((user) => (
              <UserRow
                key={user.id}
                user={user}
                onEdit={onEdit}
                onDelete={onDelete}
                onView={onView}
              />
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={6} className="p-6">
                <Empty className="py-10">
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <Users className="size-5" />
                    </EmptyMedia>
                    <EmptyTitle>Nenhum usuário encontrado</EmptyTitle>
                    <EmptyDescription>
                      Ajuste os filtros para encontrar usuários.
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
