"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";

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

export default function LoginClient() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const next = searchParams.get("next") || "/admin";

	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);

	async function onSubmit(e: React.FormEvent) {
		e.preventDefault();
		setError(null);
		setLoading(true);

		const result = await signIn("credentials", {
			email,
			password,
			redirect: false
		});

		setLoading(false);

		if (result?.error) {
			setError("E-mail ou senha inválidos.");
			return;
		}

		router.replace(next);
		router.refresh();
	}

	return (
		<main className="bg-background flex min-h-screen items-center justify-center px-4">
			<Card className="w-full max-w-md">
				<CardHeader className="flex flex-col items-center text-center">
					<AuthBrand />
					<CardTitle as="h1" className="text-xl">
						Entrar
					</CardTitle>
					<CardDescription>Sistema interno</CardDescription>
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
						<Input
							label={{ text: "Senha", required: true }}
							type="password"
							autoComplete="current-password"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							required
						/>
						{error ? (
							<p className="text-destructive text-sm" role="alert">
								{error}
							</p>
						) : null}
						<Button type="submit" className="w-full" disabled={loading}>
							{loading ? "Entrando…" : "Entrar"}
						</Button>
						<p className="text-muted-foreground text-center text-sm">
							<Link
								href="/forgot-password"
								className="text-primary hover:underline"
							>
								Esqueci a senha
							</Link>
						</p>
					</form>
				</CardContent>
			</Card>
		</main>
	);
}
