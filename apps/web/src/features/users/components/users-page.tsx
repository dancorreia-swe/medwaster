import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import Loader from "@/components/loader";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { UsersTable } from "./users-table";
import { UserForm } from "./user-form";
import { UsersStats } from "./users-stats";
import { UsersFilters, type UsersFiltersState } from "./users-filters";
import {
  listUsersQueryOptions,
  userStatsQueryOptions,
  usersApi,
  usersQueryKeys,
} from "../api";
import type { UserStats } from "./users-stats";
import { usePermissions } from "@/components/auth/role-guard";
import { CreateUserDialog } from "./create-user-dialog";
import { Plus } from "lucide-react";

interface UsersFiltersInternal extends UsersFiltersState {
  page: number;
  pageSize: number;
}

export function UsersPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [filters, setFilters] = useState<UsersFiltersInternal>({
    search: "",
    role: "",
    status: "all",
    page: 1,
    pageSize: 20,
  });
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const [userToDelete, setUserToDelete] = useState<{ id: string; name: string } | null>(null);
  const { canAccessSuperAdmin } = usePermissions();

  const queryParams = useMemo(() => {
    return {
      page: filters.page,
      pageSize: filters.pageSize,
      search: filters.search || undefined,
      role: filters.role || undefined,
      banned:
        filters.status === "all"
          ? undefined
          : filters.status === "banned",
    };
  }, [filters]);

  const usersQuery = useQuery(listUsersQueryOptions(queryParams));
  const statsQuery = useQuery(userStatsQueryOptions());

  const deleteMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await usersApi.deleteUser(userId);
      if (response && response.success === false) {
        throw new Error(response.error?.message || "Erro ao excluir usuário");
      }
    },
    onSuccess: (_, deletedUserId) => {
      toast.success("Usuário excluído com sucesso");
      queryClient.invalidateQueries({ queryKey: usersQueryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: usersQueryKeys.stats() });
      if (deletedUserId) {
        queryClient.removeQueries({ queryKey: usersQueryKeys.detail(deletedUserId) });
        queryClient.removeQueries({ queryKey: usersQueryKeys.overview(deletedUserId) });
        queryClient.removeQueries({ queryKey: usersQueryKeys.achievements(deletedUserId) });
        queryClient.removeQueries({ queryKey: usersQueryKeys.trails(deletedUserId) });
        queryClient.removeQueries({ queryKey: usersQueryKeys.quizzes(deletedUserId) });
      }
    },
    onError: (error: any) => {
      const message =
        error?.message ||
        error?.response?.data?.message ||
        "Erro ao excluir usuário";
      toast.error(message);
    },
  });

  const data = usersQuery.data;
  const users = data?.users ?? [];
  const pagination = data?.pagination;

  const handleFiltersChange = (value: UsersFiltersState) => {
    setFilters((prev) => ({
      ...prev,
      search: value.search,
      role: value.role,
      status: value.status,
      page: 1,
    }));
  };

  const handlePageChange = (page: number) => {
    setFilters((prev) => ({
      ...prev,
      page,
    }));
  };

  const handleEdit = (user: { id: string }) => {
    setSelectedUserId(user.id);
    setIsFormOpen(true);
  };

  const handleDelete = (user: { id: string; name: string }) => {
    setUserToDelete(user);
  };

  const confirmDelete = async () => {
    if (!userToDelete) return;
    try {
      await deleteMutation.mutateAsync(userToDelete.id);
      setUserToDelete(null);
    } catch (error) {
      // errors handled via mutation onError
    }
  };

  const handleView = (user: { id: string }) => {
    navigate({ to: "/admin/users/$userId", params: { userId: user.id } });
  };

  const handleFormOpenChange = (open: boolean) => {
    setIsFormOpen(open);
    if (!open) {
      setSelectedUserId(null);
    }
  };

  const stats = (statsQuery.data ?? null) as UserStats | null;

  const errorMessage =
    usersQuery.error instanceof Error
      ? usersQuery.error.message
      : "Não foi possível carregar os usuários.";

  const tableData = users.map((user) => ({
    ...user,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  }));

  useEffect(() => {
    if (pagination && pagination.totalPages > 0 && filters.page > pagination.totalPages) {
      setFilters((prev) => ({
        ...prev,
        page: pagination.totalPages,
      }));
    }
  }, [filters.page, pagination]);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold md:text-3xl">Usuários</h1>
          <p className="text-sm text-muted-foreground max-w-2xl">
            Gerencie e acompanhe todos os usuários da plataforma. Aplique filtros, revise status e atualize informações com segurança.
          </p>
        </div>
        {canAccessSuperAdmin && (
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Criar usuário
          </Button>
        )}
      </header>

      <UsersStats stats={stats ?? undefined} isLoading={statsQuery.isLoading} />

      <UsersFilters
        value={{
          search: filters.search,
          role: filters.role,
          status: filters.status,
        }}
        onChange={handleFiltersChange}
      />

      {usersQuery.isError && (
        <Alert variant="destructive">
          <AlertTitle>Erro ao carregar usuários</AlertTitle>
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      {usersQuery.isLoading ? (
        <div className="min-h-[300px] rounded-md border border-border bg-card">
          <Loader />
        </div>
      ) : (
        <UsersTable
          data={tableData}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onView={handleView}
        />
      )}

      {pagination && pagination.totalPages > 1 && (
        <div className="flex flex-col gap-2 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-sm text-muted-foreground">
            Página {pagination.page} de {pagination.totalPages}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={filters.page <= 1}
              onClick={() => handlePageChange(filters.page - 1)}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={filters.page >= pagination.totalPages}
              onClick={() => handlePageChange(filters.page + 1)}
            >
              Próxima
            </Button>
          </div>
        </div>
      )}


      <AlertDialog open={!!userToDelete} onOpenChange={(open) => !open && setUserToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir usuário</AlertDialogTitle>
            <AlertDialogDescription>
              Essa ação não pode ser desfeita. Tem certeza de que deseja excluir o usuário{" "}
              <span className="font-semibold text-foreground">
                {userToDelete?.name}
              </span>
              ?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={confirmDelete}
              disabled={deleteMutation.isPending}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {selectedUserId && (
        <UserForm
          userId={selectedUserId}
          open={isFormOpen}
          onOpenChange={handleFormOpenChange}
        />
      )}

      {canAccessSuperAdmin && (
        <CreateUserDialog
          open={isCreateOpen}
          onOpenChange={setIsCreateOpen}
        />
      )}
    </div>
  );
}
