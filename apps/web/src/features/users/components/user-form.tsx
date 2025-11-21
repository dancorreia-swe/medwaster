import { useEffect } from "react";
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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "@tanstack/react-form";
import { zodValidator } from "@tanstack/zod-form-adapter";
import { Loader2 } from "lucide-react";
import { z } from "zod";
import { usersApi, userQueryOptions, usersQueryKeys } from "../api";
import { toast } from "sonner";
import { usePermissions } from "@/components/auth/role-guard";
import { getAvailableRoles } from "@/lib/rbac";

const ROLE_LABEL: Record<string, string> = {
	user: "Usuário",
	admin: "Admin",
	"super-admin": "Super Admin",
};

const userFormSchema = z
	.object({
		name: z.string().min(1, "Nome é obrigatório").max(255, "Nome muito longo"),
		email: z
			.string()
			.min(1, "Email é obrigatório")
			.email("Email inválido")
			.max(255, "Email muito longo"),
		role: z.string().max(50, "Função muito longa").optional(),
		banned: z.boolean().default(false),
		banReason: z.string().max(500, "Motivo muito longo").optional(),
		image: z.string().max(500, "URL muito longa").optional(),
	})
	.superRefine((data, ctx) => {
		if (data.banned && !data.banReason) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: "Informe o motivo do banimento.",
				path: ["banReason"],
			});
		}
	});

type UserFormData = z.infer<typeof userFormSchema>;

interface UserFormProps {
	userId: string;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export function UserForm({ userId, open, onOpenChange }: UserFormProps) {
	const queryClient = useQueryClient();
	const { user: currentUser } = usePermissions();
	const roleOptions = getAvailableRoles(currentUser?.role);

	// Fetch user data
	const { data: userData, isLoading } = useQuery({
		...userQueryOptions(userId),
		enabled: open,
	});

	// Update mutation
	const updateMutation = useMutation({
		mutationFn: async (data: UserFormData) => {
			const response = await usersApi.updateUser(userId, data);
			if (!response.success) {
				throw new Error(
					response.error?.message || "Erro ao atualizar usuário",
				);
			}
			return response.data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: usersQueryKeys.lists() });
			queryClient.invalidateQueries({ queryKey: usersQueryKeys.stats() });
			queryClient.invalidateQueries({
				queryKey: usersQueryKeys.detail(userId),
			});
			queryClient.invalidateQueries({
				queryKey: usersQueryKeys.overview(userId),
			});
			toast.success("Usuário atualizado com sucesso");
			onOpenChange(false);
		},
		onError: (error: any) => {
			const message =
				error?.message ||
				error?.response?.data?.message ||
				"Erro ao atualizar usuário";
			toast.error(message);
		},
	});

	const form = useForm({
		defaultValues: {
			name: userData?.name || "",
			email: userData?.email || "",
			role: userData?.role || "",
			banned: userData?.banned || false,
			banReason: userData?.banReason || "",
			image: userData?.image || "",
		} as UserFormData,
		validatorAdapter: zodValidator(),
		validators: {
			onBlur: userFormSchema,
		},
		onSubmit: async ({ value }) => {
			await updateMutation.mutateAsync(value);
		},
	});

	useEffect(() => {
		if (open && userData && !isLoading) {
			form.reset({
				name: userData.name || "",
				email: userData.email || "",
				role: userData.role || "",
				banned: userData.banned ?? false,
				banReason: userData.banReason || "",
				image: userData.image || "",
			} as UserFormData);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [open, userData, isLoading]);

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-[600px]">
				<DialogHeader>
					<DialogTitle>Editar Usuário</DialogTitle>
					<DialogDescription>
						Atualize as informações do usuário. Campos marcados com * são
						obrigatórios.
					</DialogDescription>
				</DialogHeader>

				{isLoading ? (
					<div className="flex items-center justify-center py-8">
						<Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
					</div>
				) : (
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
										placeholder="Nome completo do usuário"
									/>
									{field.state.meta.errors.length > 0 && (
										<p className="text-sm text-destructive">
											{field.state.meta.errors[0]}
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
									/>
									{field.state.meta.errors.length > 0 && (
										<p className="text-sm text-destructive">
											{field.state.meta.errors[0]}
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
										value={field.state.value || roleOptions[0] || ""}
										onValueChange={(val) => field.handleChange(val)}
										disabled={roleOptions.length === 0}
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
									{field.state.meta.errors.length > 0 && (
										<p className="text-sm text-destructive">
											{field.state.meta.errors[0]}
										</p>
									)}
								</div>
							)}
						</form.Field>

						<form.Field name="image">
							{(field) => (
								<div className="space-y-2">
									<Label htmlFor={field.name}>URL da Imagem</Label>
									<Input
										id={field.name}
										value={field.state.value}
										onChange={(e) => field.handleChange(e.target.value)}
										onBlur={field.handleBlur}
										placeholder="https://exemplo.com/avatar.jpg"
									/>
									{field.state.meta.errors.length > 0 && (
										<p className="text-sm text-destructive">
											{field.state.meta.errors[0]}
										</p>
									)}
								</div>
							)}
						</form.Field>

						<form.Field name="banned">
							{(field) => (
								<div className="flex items-center justify-between space-x-2 rounded-lg border p-4">
									<div className="space-y-0.5">
										<Label htmlFor={field.name}>Banir Usuário</Label>
										<p className="text-sm text-muted-foreground">
											Impede o usuário de acessar o sistema
										</p>
									</div>
									<Switch
										id={field.name}
										checked={field.state.value}
										onCheckedChange={(checked) => field.handleChange(checked)}
									/>
								</div>
							)}
						</form.Field>

						<form.Field name="banReason">
							{(field) => (
								<div className="space-y-2">
									<Label htmlFor={field.name}>Motivo do Banimento</Label>
									<Textarea
										id={field.name}
										value={field.state.value}
										onChange={(e) => field.handleChange(e.target.value)}
										onBlur={field.handleBlur}
										placeholder="Explique o motivo do banimento..."
										rows={3}
										disabled={!form.getFieldValue("banned")}
									/>
									{field.state.meta.errors.length > 0 && (
										<p className="text-sm text-destructive">
											{field.state.meta.errors[0]}
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
								disabled={updateMutation.isPending}
							>
								Cancelar
							</Button>
							<Button type="submit" disabled={updateMutation.isPending}>
								{updateMutation.isPending && (
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								)}
								Salvar Alterações
							</Button>
						</DialogFooter>
					</form>
				)}
			</DialogContent>
		</Dialog>
	);
}
