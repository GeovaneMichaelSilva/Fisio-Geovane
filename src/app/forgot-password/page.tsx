"use client";

import { useState } from "react";
import Link from "next/link";

import { Button } from "@/components/ui/Button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle
} from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";

export default function ForgotPasswordPage() {
	const [email, setEmail] = useState("");
	const [message, setMessage] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);

	async function onSubmit(e: React.FormEvent) {
		e.preventDefault();
		setError(null);
		setMessage(null);
		setLoading(true);

		const res = await fetch("/api/auth/forgot-password", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ email })
		});

		setLoading(false);

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
				<CardHeader>
					<CardTitle as="h1" className="text-xl">
						Recuperar senha
					</CardTitle>
					<CardDescription>
						Enviaremos um link para o e-mail cadastrado.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<form onSubmit={onSubmit} className="space-y-4">
						<Input
							label={{ text: "E-mail", required: true }}
							type="email"
							autoComplete="email"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							required
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
						<Button type="submit" className="w-full" disabled={loading}>
							{loading ? "Enviando…" : "Enviar link"}
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
