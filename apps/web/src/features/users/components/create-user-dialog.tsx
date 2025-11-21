import { useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "@tanstack/react-form";
import { zodValidator } from "@tanstack/zod-form-adapter";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { usersApi, usersQueryKeys } from "../api";
import { usePermissions } from "@/components/auth/role-guard";
import { getAvailableRoles } from "@/lib/rbac";

const ROLE_LABEL: Record<string, string> = {
	"user": "Usuário",
	"admin": "Admin",
	"super-admin": "Super Admin",
};

const createUserSchema = z.object({
	name: z.string().min(1, "Nome é obrigatório").max(255, "Nome muito longo"),
	email: z
		.string()
		.min(1, "Email é obrigatório")
		.email("Email inválido")
		.max(255, "Email muito longo"),
	password: z
		.string()
		.min(8, "Senha deve ter pelo menos 8 caracteres")
		.max(128, "Senha muito longa"),
	role: z.string().optional(),
});

const errorToString = (error: unknown) => {
	if (!error) return "";
	if (typeof error === "string") return error;
	if (typeof error === "object" && "message" in error && typeof (error as any).message === "string") {
		return (error as any).message;
	}
	try {
		return JSON.stringify(error);
	} catch {
		return String(error);
	}
};

type CreateUserFormData = z.infer<typeof createUserSchema>;

interface CreateUserDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export function CreateUserDialog({ open, onOpenChange }: CreateUserDialogProps) {
	const queryClient = useQueryClient();
	const { user } = usePermissions();

	const roleOptions = useMemo(
		() => getAvailableRoles(user?.role),
		[user?.role],
	);

	const createMutation = useMutation({
		mutationFn: async (data: CreateUserFormData) => {
			return usersApi.createUser(data);
		},
		onSuccess: () => {
			toast.success("Usuário criado com sucesso");
			queryClient.invalidateQueries({ queryKey: usersQueryKeys.lists() });
			queryClient.invalidateQueries({ queryKey: usersQueryKeys.stats() });
			onOpenChange(false);
			form.reset();
		},
		onError: (error: any) => {
			const message =
				error?.message ||
				error?.response?.data?.message ||
				"Erro ao criar usuário";
			toast.error(message);
		},
	});

	const form = useForm({
		defaultValues: {
			name: "",
			email: "",
			password: "",
			role: roleOptions[0] ?? "user",
		} as CreateUserFormData,
		validatorAdapter: zodValidator(),
		validators: {
			onChange: createUserSchema,
			onSubmit: createUserSchema,
		},
		onSubmit: async ({ value }) => {
			await createMutation.mutateAsync(value);
		},
	});

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-[520px]">
				<DialogHeader>
					<DialogTitle>Criar usuário</DialogTitle>
					<DialogDescription>
						Informe os dados básicos. O usuário receberá a função selecionada e
						poderá redefinir a senha depois.
					</DialogDescription>
				</DialogHeader>

				<form
					onSubmit={(e) => {
						e.preventDefault();
						form.handleSubmit();
					}}
					className="space-y-4"
				>
					<form.Field name="name">
						{(field) => (
							<div className="space-y-2">
								<Label htmlFor={field.name}>
									Nome <span className="text-destructive">*</span>
								</Label>
								<Input
									id={field.name}
									value={field.state.value}
									onChange={(e) => field.handleChange(e.target.value)}
									onBlur={field.handleBlur}
									placeholder="Nome completo"
									autoComplete="name"
								/>
								{(form.state.isSubmitted ||
									field.state.meta.touched ||
									field.state.meta.isDirty) &&
									field.state.meta.errors[0] && (
									<p className="text-sm text-destructive">
										{errorToString(field.state.meta.errors[0])}
									</p>
								)}
							</div>
						)}
					</form.Field>

					<form.Field name="email">
						{(field) => (
							<div className="space-y-2">
								<Label htmlFor={field.name}>
									Email <span className="text-destructive">*</span>
								</Label>
								<Input
									id={field.name}
									type="email"
									value={field.state.value}
									onChange={(e) => field.handleChange(e.target.value)}
									onBlur={field.handleBlur}
									placeholder="email@exemplo.com"
									autoComplete="email"
								/>
								{(form.state.isSubmitted ||
									field.state.meta.touched ||
									field.state.meta.isDirty) &&
									field.state.meta.errors[0] && (
									<p className="text-sm text-destructive">
										{errorToString(field.state.meta.errors[0])}
									</p>
								)}
							</div>
						)}
					</form.Field>

					<form.Field name="password">
						{(field) => (
							<div className="space-y-2">
								<Label htmlFor={field.name}>
									Senha temporária <span className="text-destructive">*</span>
								</Label>
								<Input
									id={field.name}
									type="password"
									value={field.state.value}
									onChange={(e) => field.handleChange(e.target.value)}
									onBlur={field.handleBlur}
									placeholder="Mínimo 8 caracteres"
									autoComplete="new-password"
								/>
								{(form.state.isSubmitted ||
									field.state.meta.touched ||
									field.state.meta.isDirty) &&
									field.state.meta.errors[0] && (
									<p className="text-sm text-destructive">
										{errorToString(field.state.meta.errors[0])}
									</p>
								)}
							</div>
						)}
					</form.Field>

					<form.Field name="role">
						{(field) => (
							<div className="space-y-2">
								<Label htmlFor={field.name}>Função</Label>
								<Select
									value={field.state.value}
									onValueChange={(val) => field.handleChange(val)}
								>
									<SelectTrigger id={field.name}>
										<SelectValue placeholder="Selecione a função" />
									</SelectTrigger>
									<SelectContent>
										{roleOptions.map((role) => (
											<SelectItem key={role} value={role}>
												{ROLE_LABEL[role] ?? role}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
								{(form.state.isSubmitted ||
									field.state.meta.touched ||
									field.state.meta.isDirty) &&
									field.state.meta.errors[0] && (
									<p className="text-sm text-destructive">
										{errorToString(field.state.meta.errors[0])}
									</p>
								)}
							</div>
						)}
					</form.Field>

					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							onClick={() => onOpenChange(false)}
							disabled={createMutation.isPending}
						>
							Cancelar
						</Button>
						<Button type="submit" disabled={createMutation.isPending}>
							{createMutation.isPending && (
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							)}
							Criar usuário
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
