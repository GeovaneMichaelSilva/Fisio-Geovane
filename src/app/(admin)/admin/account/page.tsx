"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

import { PageHeader } from "@/components/admin/PageStates";
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

import type { FC, ReactNode } from "react";

/**
 * Conta do usuário logado (fora de Configurações da clínica).
 */
const AccountPage: FC = () => {
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

	const roleDescription = me
		? `${me.clinicName} · ${me.role === "owner" ? "Responsável" : "Equipe"}`
		: "Carregando…";

	const saveLabel = mutation.isPending ? "Salvando…" : "Alterar senha";

	let nameRow: ReactNode = null;
	if (me?.fullName) {
		nameRow = (
			<p>
				<span className="text-muted-foreground">Nome: </span>
				{me.fullName}
			</p>
		);
	}

	let emailRow: ReactNode = null;
	if (me?.email) {
		emailRow = (
			<p>
				<span className="text-muted-foreground">E-mail: </span>
				{me.email}
			</p>
		);
	}

	return (
		<div className="space-y-6">
			<PageHeader
				title="Conta"
				description="Dados e senha do seu acesso ao sistema."
			/>

			<Card>
				<CardHeader>
					<CardTitle>Seu acesso</CardTitle>
					<CardDescription>{roleDescription}</CardDescription>
				</CardHeader>
				<CardContent className="space-y-1 text-sm">
					{nameRow}
					{emailRow}
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
								{saveLabel}
							</Button>
						</div>
					</form>
				</CardContent>
			</Card>
		</div>
	);
};

export default AccountPage;
