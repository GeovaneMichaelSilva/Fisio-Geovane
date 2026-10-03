"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

import { PageHeader } from "@/components/admin/PageStates";
import { SettingsNav } from "@/components/admin/SettingsNav";
import { Button } from "@/components/ui/Button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle
} from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { useClinicRole } from "@/hooks/useClinicRole";
import { usePageTitle } from "@/hooks/usePageTitle";
import {
	changePasswordSchema,
	type ChangePasswordInput,
	type ChangePasswordParsed
} from "@/lib/auth/schema";

export default function AccountSettingsPage() {
	usePageTitle("Conta");
	const { me } = useClinicRole();

	const form = useForm<ChangePasswordInput, unknown, ChangePasswordParsed>({
		resolver: zodResolver(changePasswordSchema),
		defaultValues: {
			currentPassword: "",
			password: "",
			confirmPassword: ""
		}
	});

	const mutation = useMutation({
		mutationFn: async (values: ChangePasswordParsed) => {
			const res = await fetch("/api/admin/me/password", {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					currentPassword: values.currentPassword,
					password: values.password
				})
			});
			const json = await res.json();
			if (!res.ok) throw new Error(json.error || "Falha ao alterar senha.");
			return json.data;
		},
		onSuccess: () => {
			form.reset();
			toast.success("Senha alterada.");
		},
		onError: (err: Error) => toast.error(err.message)
	});

	return (
		<div className="space-y-6">
			<div className="space-y-3">
				<PageHeader
					title="Conta"
					description="Dados do seu acesso ao sistema."
				/>
				<SettingsNav />
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Seu acesso</CardTitle>
					<CardDescription>
						{me
							? `${me.clinicName} · ${me.role === "owner" ? "Responsável" : "Equipe"}`
							: "Carregando…"}
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-1 text-sm">
					{me?.fullName ? (
						<p>
							<span className="text-muted-foreground">Nome: </span>
							{me.fullName}
						</p>
					) : null}
					{me?.email ? (
						<p>
							<span className="text-muted-foreground">E-mail: </span>
							{me.email}
						</p>
					) : null}
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Alterar senha</CardTitle>
					<CardDescription>
						Use a senha atual e defina uma nova (mínimo 8 caracteres).
					</CardDescription>
				</CardHeader>
				<CardContent>
					<form
						className="grid max-w-md gap-4"
						onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
						noValidate
					>
						<Input
							label={{ text: "Senha atual", required: true }}
							type="password"
							autoComplete="current-password"
							error={form.formState.errors.currentPassword?.message}
							{...form.register("currentPassword")}
						/>
						<Input
							label={{ text: "Nova senha", required: true }}
							type="password"
							autoComplete="new-password"
							error={form.formState.errors.password?.message}
							{...form.register("password")}
						/>
						<Input
							label={{ text: "Confirmar nova senha", required: true }}
							type="password"
							autoComplete="new-password"
							error={form.formState.errors.confirmPassword?.message}
							{...form.register("confirmPassword")}
						/>
						<div>
							<Button
								type="submit"
								className="min-h-11 sm:min-h-10"
								disabled={mutation.isPending}
							>
								{mutation.isPending ? "Salvando…" : "Alterar senha"}
							</Button>
						</div>
					</form>
				</CardContent>
			</Card>
		</div>
	);
}
