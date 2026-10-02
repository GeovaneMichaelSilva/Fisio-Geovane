"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/Button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle
} from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";

export default function UpdatePasswordClient() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const token = searchParams.get("token") || "";

	const [password, setPassword] = useState("");
	const [confirm, setConfirm] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);

	async function onSubmit(e: React.FormEvent) {
		e.preventDefault();
		setError(null);

		if (!token) {
			setError("Link inválido. Solicite uma nova recuperação de senha.");
			return;
		}

		if (password.length < 8) {
			setError("A senha deve ter pelo menos 8 caracteres.");
			return;
		}

		if (password !== confirm) {
			setError("As senhas não coincidem.");
			return;
		}

		setLoading(true);
		const res = await fetch("/api/auth/reset-password", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ token, password })
		});
		const data = (await res.json()) as { error?: string };
		setLoading(false);

		if (!res.ok) {
			setError(
				data.error ||
					"Não foi possível atualizar a senha. O link pode ter expirado."
			);
			return;
		}

		router.replace("/login");
		router.refresh();
	}

	return (
		<main className="bg-background flex min-h-screen items-center justify-center px-4">
			<Card className="w-full max-w-md">
				<CardHeader>
					<CardTitle as="h1" className="text-xl">
						Nova senha
					</CardTitle>
					<CardDescription>Defina uma nova senha de acesso.</CardDescription>
				</CardHeader>
				<CardContent>
					<form onSubmit={onSubmit} className="space-y-4">
						{!token ? (
							<p className="text-destructive text-sm" role="alert">
								Token ausente. Abra o link enviado por e-mail.
							</p>
						) : null}
						<Input
							label={{ text: "Nova senha", required: true }}
							type="password"
							autoComplete="new-password"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							required
						/>
						<Input
							label={{ text: "Confirmar senha", required: true }}
							type="password"
							autoComplete="new-password"
							value={confirm}
							onChange={(e) => setConfirm(e.target.value)}
							required
						/>
						{error ? (
							<p className="text-destructive text-sm" role="alert">
								{error}
							</p>
						) : null}
						<Button
							type="submit"
							className="w-full"
							disabled={loading || !token}
						>
							{loading ? "Salvando…" : "Salvar senha"}
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
