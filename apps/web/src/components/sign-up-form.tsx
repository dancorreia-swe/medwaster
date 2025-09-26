import { authClient } from "@/lib/auth-client";
import { useForm } from "@tanstack/react-form";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import z from "zod";
import Loader from "./loader";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "./ui/card";
import { Button } from "./ui/button";
import { Input, PasswordInput } from "./ui/input";
import { Label } from "./ui/label";

export default function SignUpForm({
	onSwitchToSignIn,
}: {
	onSwitchToSignIn: () => void;
}) {
	const navigate = useNavigate({
		from: "/",
	});
	const { isPending } = authClient.useSession();

	const form = useForm({
		defaultValues: {
			email: "",
			password: "",
			name: "",
		},
		onSubmit: async ({ value }) => {
			await authClient.signUp.email(
				{
					email: value.email,
					password: value.password,
					name: value.name,
				},
				{
					onSuccess: () => {
						navigate({
							to: "/dashboard",
						});
					toast.success("Cadastro realizado com sucesso");
					},
					onError: (error) => {
						toast.error(error.error.message || error.error.statusText);
					},
				},
			);
		},
		validators: {
				onSubmit: z.object({
					name: z
						.string()
						.min(2, "O nome deve ter pelo menos 2 caracteres"),
					email: z.email("E-mail inválido"),
					password: z
						.string()
						.min(8, "A senha deve ter pelo menos 8 caracteres"),
				}),
		},
	});

	if (isPending) {
		return <Loader />;
	}

	return (
		<Card className="w-full max-w-md border-slate-200 bg-white/95 shadow-md">
				<CardHeader>
					<CardTitle className="text-2xl font-semibold text-slate-900">
						Crie sua conta
					</CardTitle>
					<CardDescription>
						Junte-se ao MedWaster para simplificar o acompanhamento e a conformidade dos resíduos.
					</CardDescription>
			</CardHeader>
			<CardContent>
				<form
					onSubmit={(e) => {
						e.preventDefault();
						e.stopPropagation();
						form.handleSubmit();
					}}
					className="flex flex-col gap-5"
				>
					<form.Field name="name">
						{(field) => (
							<div className="flex flex-col gap-2">
								<Label htmlFor={field.name} className="text-sm font-medium text-slate-900">
									Nome completo
								</Label>
								<Input
									id={field.name}
									name={field.name}
									value={field.state.value}
									onBlur={field.handleBlur}
									onChange={(e) => field.handleChange(e.target.value)}
								/>
								{field.state.meta.errors.map((error) => (
									<p key={error?.message} className="text-sm text-destructive">
										{error?.message}
									</p>
								))}
							</div>
						)}
					</form.Field>

					<form.Field name="email">
						{(field) => (
							<div className="flex flex-col gap-2">
								<Label htmlFor={field.name} className="text-sm font-medium text-slate-900">
									E-mail
								</Label>
								<Input
									id={field.name}
									name={field.name}
									type="email"
									value={field.state.value}
									onBlur={field.handleBlur}
									onChange={(e) => field.handleChange(e.target.value)}
								/>
								{field.state.meta.errors.map((error) => (
									<p key={error?.message} className="text-sm text-destructive">
										{error?.message}
									</p>
								))}
							</div>
						)}
					</form.Field>

				<form.Field name="password">
					{(field) => (
						<div className="flex flex-col gap-2">
							<Label htmlFor={field.name} className="text-sm font-medium text-slate-900">
								Senha
							</Label>
							<PasswordInput
								id={field.name}
								name={field.name}
								value={field.state.value}
								autoComplete="new-password"
								onBlur={field.handleBlur}
								onChange={(e) => field.handleChange(e.target.value)}
							/>
							{field.state.meta.errors.map((error) => (
								<p key={error?.message} className="text-sm text-destructive">
									{error?.message}
								</p>
							))}
						</div>
					)}
				</form.Field>

					<form.Subscribe>
						{(state) => (
							<Button
								type="submit"
								className="h-11 w-full text-base font-semibold"
								disabled={!state.canSubmit || state.isSubmitting}
							>
								{state.isSubmitting ? "Criando conta..." : "Criar conta"}
							</Button>
						)}
					</form.Subscribe>
				</form>
			</CardContent>
				<CardFooter className="justify-center text-sm text-slate-600">
					<span>Já tem uma conta?</span>
					<Button
						variant="link"
						onClick={onSwitchToSignIn}
						className="font-semibold"
					>
						Entrar
					</Button>
			</CardFooter>
		</Card>
	);
}
