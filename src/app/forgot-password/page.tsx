"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import AuthBrand from "@/components/auth/AuthBrand";
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

import type { FC, ReactNode } from "react";

const ForgotPasswordPage: FC = () => {
	const [message, setMessage] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);

	const form = useForm<ForgotPasswordValues>({
		resolver: zodResolver(forgotPasswordSchema),
		defaultValues: { email: "" }
	});

	const onSubmit = async (values: ForgotPasswordValues) => {
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
	};

	let errorNode: ReactNode = null;
	if (error) {
		errorNode = (
			<p className="text-destructive text-sm" role="alert">
				{error}
			</p>
		);
	}

	let messageNode: ReactNode = null;
	if (message) {
		messageNode = (
			<p className="text-success text-sm" role="status">
				{message}
			</p>
		);
	}

	let submitLabel = "Enviar link";
	if (form.formState.isSubmitting) {
		submitLabel = "Enviando…";
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
						{errorNode}
						{messageNode}
						<Button
							type="submit"
							className="w-full"
							disabled={form.formState.isSubmitting}
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

export default ForgotPasswordPage;
