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
import { Plus, Users } from "lucide-react";
import { TeamFilters, type TeamFiltersState } from "./team-filters";
import { UsersTable } from "@/features/users/components/users-table";
import { UserForm } from "@/features/users/components/user-form";
import { CreateUserDialog } from "@/features/users/components/create-user-dialog";
import {
  listUsersQueryOptions,
  usersApi,
  usersQueryKeys,
} from "@/features/users/api";
import type { UserSummary } from "@/features/users/types";

interface TeamFiltersInternal extends TeamFiltersState {
  page: number;
  pageSize: number;
}

export function TeamPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [filters, setFilters] = useState<TeamFiltersInternal>({
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

  const queryParams = useMemo(() => {
    let roleFilter: string | undefined;
    if (filters.role) {
      roleFilter = filters.role;
    }

    return {
      page: filters.page,
      pageSize: filters.pageSize,
      search: filters.search || undefined,
      role: roleFilter,
      banned:
        filters.status === "all"
          ? undefined
          : filters.status === "banned",
    };
  }, [filters]);

  const usersQuery = useQuery(listUsersQueryOptions(queryParams));

  const deleteMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await usersApi.deleteUser(userId);
      if (response && response.success === false) {
        throw new Error(response.error?.message || "Erro ao excluir membro da equipe");
      }
    },
    onSuccess: (_, deletedUserId) => {
      toast.success("Membro da equipe excluído com sucesso");
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
        "Erro ao excluir membro da equipe";
      toast.error(message);
    },
  });

  const data = usersQuery.data;
  const teamMembers = data?.users ?? [];
  const pagination = data?.pagination;

  // Filter to only show admin and super-admin roles
  const filteredTeamMembers = teamMembers.filter(
    (user: UserSummary) => user.role === "admin" || user.role === "super-admin"
  );

  const handleFiltersChange = (value: TeamFiltersState) => {
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

  const errorMessage =
    usersQuery.error instanceof Error
      ? usersQuery.error.message
      : "Não foi possível carregar a equipe.";

  const tableData = filteredTeamMembers.map((user: UserSummary) => ({
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
          <h1 className="text-2xl font-bold md:text-3xl">Equipe Administrativa</h1>
          <p className="text-sm text-muted-foreground max-w-2xl">
            Gerencie administradores e super administradores da plataforma.
            Somente super administradores podem acessar esta seção.
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Adicionar membro
        </Button>
      </header>

      <div className="rounded-lg border bg-card p-6">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-primary/10 p-3">
            <Users className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total de membros</p>
            <p className="text-2xl font-bold">{filteredTeamMembers.length}</p>
          </div>
        </div>
      </div>

      <TeamFilters
        value={{
          search: filters.search,
          role: filters.role,
          status: filters.status,
        }}
        onChange={handleFiltersChange}
      />

      {usersQuery.isError && (
        <Alert variant="destructive">
          <AlertTitle>Erro ao carregar equipe</AlertTitle>
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
            <AlertDialogTitle>Excluir membro da equipe</AlertDialogTitle>
            <AlertDialogDescription>
              Essa ação não pode ser desfeita. Tem certeza de que deseja remover{" "}
              <span className="font-semibold text-foreground">
                {userToDelete?.name}
              </span>{" "}
              da equipe administrativa?
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

      <CreateUserDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
      />
    </div>
  );
}
