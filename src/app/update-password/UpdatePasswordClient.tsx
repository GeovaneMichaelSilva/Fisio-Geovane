"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import AuthBrand from "@/components/auth/AuthBrand";
import PasswordRequirements from "@/components/auth/PasswordRequirements";
import { Button } from "@/components/ui/Button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle
} from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import {
	resetPasswordSchema,
	type ResetPasswordValues
} from "@/lib/auth/schema";

import type { FC, ReactNode } from "react";

const UpdatePasswordClient: FC = () => {
	const router = useRouter();
	const searchParams = useSearchParams();
	const token = searchParams.get("token") || "";
	const [error, setError] = useState<string | null>(null);

	const form = useForm<ResetPasswordValues>({
		resolver: zodResolver(resetPasswordSchema),
		defaultValues: {
			token,
			password: "",
			confirmPassword: ""
		},
		mode: "all"
	});

	const onSubmit = async (values: ResetPasswordValues) => {
		setError(null);
		const res = await fetch("/api/auth/reset-password", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				token: values.token,
				password: values.password
			})
		});
		const data = (await res.json()) as { error?: string };

		if (!res.ok) {
			setError(
				data.error ||
					"Não foi possível atualizar a senha. O link pode ter expirado."
			);
			return;
		}

		router.replace("/login");
		router.refresh();
	};

	let missingTokenNode: ReactNode = null;
	if (!token) {
		missingTokenNode = (
			<p className="text-destructive text-sm" role="alert">
				Token ausente. Abra o link enviado por e-mail.
			</p>
		);
	}

	let errorNode: ReactNode = null;
	if (error) {
		errorNode = (
			<p className="text-destructive text-sm" role="alert">
				{error}
			</p>
		);
	}

	let submitLabel = "Salvar senha";
	if (form.formState.isSubmitting) {
		submitLabel = "Salvando…";
	}

	return (
		<main className="bg-background flex min-h-screen items-center justify-center px-4">
			<Card className="w-full max-w-md">
				<CardHeader className="flex flex-col items-center text-center">
					<AuthBrand />
					<CardTitle as="h1" className="text-xl">
						Nova senha
					</CardTitle>
					<CardDescription>Defina uma nova senha de acesso.</CardDescription>
				</CardHeader>
				<CardContent>
					<form
						onSubmit={form.handleSubmit(onSubmit)}
						className="space-y-4"
						noValidate
					>
						{missingTokenNode}
						<input type="hidden" {...form.register("token")} />
						<div className="space-y-2">
							<Input
								label={{ text: "Nova senha", required: true }}
								type="password"
								autoComplete="new-password"
								error={form.formState.errors.password?.message}
								{...form.register("password")}
							/>
							<PasswordRequirements password={form.watch("password") ?? ""} />
						</div>
						<Input
							label={{ text: "Confirmar senha", required: true }}
							type="password"
							autoComplete="new-password"
							error={form.formState.errors.confirmPassword?.message}
							{...form.register("confirmPassword")}
						/>
						{errorNode}
						<Button
							type="submit"
							className="w-full"
							disabled={form.formState.isSubmitting || !token}
						>
							{submitLabel}
						</Button>
						<p className="text-muted-foreground text-center text-sm">
							<Link href="/login" className="text-primary hover:underline">
								Voltar ao login
							</Link>
						</p>
					</form>
				</CardContent>
			</Card>
		</main>
	);
};

export default UpdatePasswordClient;
