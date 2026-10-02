"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { AuthBrand } from "@/components/auth/AuthBrand";
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
	forgotPasswordSchema,
	type ForgotPasswordValues
} from "@/lib/auth/schema";

export default function ForgotPasswordPage() {
	const [message, setMessage] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);

	const form = useForm<ForgotPasswordValues>({
		resolver: zodResolver(forgotPasswordSchema),
		defaultValues: { email: "" }
	});

	async function onSubmit(values: ForgotPasswordValues) {
		setError(null);
		setMessage(null);

		const res = await fetch("/api/auth/forgot-password", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(values)
		});

		if (!res.ok) {
			setError("Não foi possível enviar o e-mail. Tente novamente.");
			return;
		}

		setMessage(
			"Se o e-mail existir, você receberá um link para redefinir a senha."
		);
	}

	return (
		<main className="bg-background flex min-h-screen items-center justify-center px-4">
			<Card className="w-full max-w-md">
				<CardHeader className="flex flex-col items-center text-center">
					<AuthBrand />
					<CardTitle as="h1" className="text-xl">
						Recuperar senha
					</CardTitle>
					<CardDescription>
						Enviaremos um link para o e-mail cadastrado.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<form
						onSubmit={form.handleSubmit(onSubmit)}
						className="space-y-4"
						noValidate
					>
						<Input
							label={{ text: "E-mail", required: true }}
							type="email"
							autoComplete="email"
							error={form.formState.errors.email?.message}
							{...form.register("email")}
						/>
						{error ? (
							<p className="text-destructive text-sm" role="alert">
								{error}
							</p>
						) : null}
						{message ? (
							<p className="text-success text-sm" role="status">
								{message}
							</p>
						) : null}
						<Button
							type="submit"
							className="w-full"
							disabled={form.formState.isSubmitting}
						>
							{form.formState.isSubmitting ? "Enviando…" : "Enviar link"}
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
}
